import type { ZodSchema } from "zod";

/**
 * Provider-agnostic structured-output LLM call (no SDK deps, plain fetch).
 * - Asks for JSON, validates with zod, retries once with the validation error fed back.
 * - LLM_MOCK=1 -> returns `mock` (tests + no-key demos stay deterministic).
 */
export type LLMCall<T> = {
  system: string;
  prompt: string;
  schema: ZodSchema<T>;
  mock: T | ((prompt: string) => T);
  temperature?: number;
};

const env = (k: string) => process.env[k] ?? "";

export async function callLLM<T>(c: LLMCall<T>): Promise<T> {
  if (env("LLM_MOCK") === "1") {
    return c.schema.parse(typeof c.mock === "function" ? (c.mock as (p: string) => T)(c.prompt) : c.mock);
  }
  let prompt = c.prompt;
  let lastErr = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await complete(c.system + "\nRespond with ONLY valid JSON. No prose, no code fences.", prompt, c.temperature ?? 0);
    try {
      return c.schema.parse(JSON.parse(stripFences(raw)));
    } catch (e) {
      lastErr = (e as Error).message;
      prompt = `${c.prompt}\n\nYour previous reply was invalid: ${lastErr.slice(0, 500)}\nReturn corrected JSON only.`;
    }
  }
  throw new Error(`LLM output failed validation: ${lastErr.slice(0, 300)}`);
}

const stripFences = (s: string) => s.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();

async function complete(system: string, user: string, temperature: number): Promise<string> {
  const provider = env("LLM_PROVIDER") || "anthropic";
  const model = env("LLM_MODEL");
  const timeout = AbortSignal.timeout(30_000);

  if (provider === "anthropic") {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", signal: timeout,
      headers: { "x-api-key": env("ANTHROPIC_API_KEY"), "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: model || "claude-sonnet-4-5", max_tokens: 2048, temperature, system, messages: [{ role: "user", content: user }] }),
    });
    if (!r.ok) throw new Error(`anthropic ${r.status}: ${await r.text()}`);
    const j = (await r.json()) as { content: Array<{ type: string; text?: string }> };
    return j.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  }
  if (provider === "openai") {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", signal: timeout,
      headers: { authorization: `Bearer ${env("OPENAI_API_KEY")}`, "content-type": "application/json" },
      body: JSON.stringify({ model: model || "gpt-4o-mini", temperature, response_format: { type: "json_object" },
        messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
    });
    if (!r.ok) throw new Error(`openai ${r.status}: ${await r.text()}`);
    const j = (await r.json()) as { choices: Array<{ message: { content: string } }> };
    return j.choices[0].message.content;
  }
  if (provider === "gemini") {
    const m = model || "gemini-2.0-flash";
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${env("GEMINI_API_KEY")}`, {
      method: "POST", signal: timeout, headers: { "content-type": "application/json" },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { temperature, responseMimeType: "application/json" } }),
    });
    if (!r.ok) throw new Error(`gemini ${r.status}: ${await r.text()}`);
    const j = (await r.json()) as { candidates: Array<{ content: { parts: Array<{ text: string }> } }> };
    return j.candidates[0].content.parts.map((p) => p.text).join("");
  }
  throw new Error(`Unknown LLM_PROVIDER: ${provider}`);
}
