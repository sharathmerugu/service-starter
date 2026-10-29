---
name: llm-feature
description: Pattern for any AI/LLM-powered feature (classification, extraction, summarization, agents, RAG). Use whenever the spec involves an LLM call.
---
# Contract first
Define the output as a zod schema in src/domain. Enums over free text. Cap array lengths and string sizes.

# Call
`callLLM({ system, prompt, schema, mock })` from src/lib/llm.ts — already does JSON-only prompting, zod validation, one repair retry, 30s timeout, provider switch, and `LLM_MOCK=1`.
- System prompt: role, task, output keys with allowed values, 1 short example if format is tricky.
- User data goes in `prompt` as JSON, never concatenated into instructions (prompt-injection boundary).
- temperature 0 for extraction/classification.

# Production behaviors to implement (and mention)
- Slow → run inside `jobs.enqueue` and return 202.
- Low confidence → include `confidence` (0–1) in schema; below threshold route to `needs_review` status (human-in-the-loop).
- Failure → job `failed` with message; entity keeps last good state. Retries already handled by JobQueue.
- Determinism in tests → `mock` can be a function of the prompt to cover branches.
- Cost/latency → cache by hash of input; batch when possible; smallest model that passes.
- Eval → keep 5–10 fixture inputs with expected labels in tests/fixtures; an `eval` test that runs only when `LLM_MOCK=0`.

# RAG / retrieval (if asked)
In-memory: chunk text, embed (or keyword score with BM25-ish TF overlap if no embedding key), cosine top-k, cite chunk ids in the output schema. Say: production = pgvector / managed vector DB, hybrid search, re-ranking.

# Agents / tools (if asked)
Tool loop: model returns `{tool, args}` validated by a discriminated union; execute; append result; max N steps; log each step. Never execute unvalidated tool args.
