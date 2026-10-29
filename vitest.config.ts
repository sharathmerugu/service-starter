import { defineConfig } from "vitest/config";
export default defineConfig({ test: { env: { LLM_MOCK: "1" } } });
