import { Router } from "express";
export const healthRouter = Router().get("/", (_req, res) => {
  res.json({ ok: true, uptime: process.uptime(), llmMock: process.env.LLM_MOCK === "1" });
});
