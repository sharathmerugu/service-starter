# CLAUDE.md

## Mission
Ship small, working, tested backend features from SPEC.md. Correct > complete > clever.
A smaller scope that fully works beats a bigger one that half works.

## How to communicate with me
- Plain, simple English. Short sentences. Write for someone new to this domain.
- Avoid jargon. If a technical term is needed, explain it in a few words the first time.
- Keep replies short: what you did, what's next, anything blocking. ~10 lines unless I ask for more.
- Questions: max 3 at a time. One line each, phrased as a simple choice, recommended option first.
  Example: "Should data survive a restart? (a) No, keep it in memory — recommended (b) Yes, use a database"

## Stack (decided — do not re-litigate)
Node 22 · TypeScript (strict) · Express 5 · zod · vitest + supertest · in-memory `Store` (src/lib/store.ts).
Async work → `JobQueue` (src/lib/jobs.ts). LLM → `callLLM` (src/lib/llm.ts), always with a zod schema + a mock.
Only add a dependency if it removes >50 lines; say why in one line.

## Layout
- `src/domain/*.ts` — zod schemas (the contract) + pure business rules. No Express here.
- `src/routes/*.ts` — thin HTTP: parse → call domain/store → respond. Register in `src/app.ts`.
- `src/lib/` — errors, validate, store, jobs, llm. Reuse; don't rewrite.
- `tests/acceptance/` — one `it("ACn ...")` per acceptance criterion in SPEC.md.
- `tests/unit/` — pure domain logic.
- `public/index.html` — API console for manual testing; keep `EXAMPLES` in sync with real endpoints.
- `src/domain/task.ts`, `src/routes/tasks.ts` are reference examples. Replace with the real domain; delete when unused.

## Conventions
- Validate every input with `parse(schema, data)` → 400 `{error:{code,message,details}}`.
- Not found → `notFound()`; invalid state change → `conflict()` (409). Never leak stack traces.
- Slow/external work (LLM, fan-out) → 202 + jobId, poll `GET /jobs/:id`.
- LLM output is untrusted: schema-validate, cap lengths, keep user text out of the system prompt.
- IDs are UUIDs. Timestamps ISO-8601 UTC. Money in integer minor units.
- If the spec has "submit/pay/book", handle double-submit explicitly.

## Workflow
`/intake` → `/spec` → `/build` → `/verify` → `/ship`
1. Read SPEC.md. If it is missing or unclear, stop and ask; never guess silently.
2. Tests first for each acceptance criterion, watch them fail, then implement.
3. Vertical slices: one endpoint end-to-end + green before the next.
4. After each slice: `npm run typecheck && npm test`. Fix before moving on.
5. Done = `npm run verify` passes (typecheck + tests + smoke against the real server).
6. Approved acceptance tests are locked (hook + git tag `spec-lock`, checked by `npm run verify`). Fix the code, not the test.
   If a test itself is wrong, stop and tell me why; I decide.

## Commands
`npm run dev` · `npm test` · `npm run typecheck` · `npm run verify` · `npm run share` (public URL)
`LLM_MOCK=1` gives deterministic runs without an API key.

## Coding behavior
- State assumptions explicitly. If two readings exist, list them; don't pick silently.
- Minimum code that solves the spec. No speculative abstractions, configs, or features.
- Surgical edits; every changed line traces to the spec.
