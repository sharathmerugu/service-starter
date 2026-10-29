# service-starter

My Claude Code workflow + Node/TypeScript backend starter for building small services fast with tests.

```bash
npm i
npm run verify      # typecheck + tests + smoke test against the real server
npm run dev         # http://localhost:3000  (API console at /)
npm run share       # temporary public URL (cloudflared/ngrok)
```

## Workflow (Claude Code)
| Step | Command | What happens |
|---|---|---|
| 1 | `/intake <problem> [timebox]` | Breaks down the problem, lists unclear points, asks simple questions. No code. |
| 2 | `/spec <answers> [critic]` | Writes SPEC.md, failing acceptance tests and a flow smoke test; locks the tests (git tag) |
| 3 | `/build` | Claude builds slice by slice until every acceptance test passes (optionally with `/goal` for long tasks) |
| 4 | `/verify [fast]` | Full: independent review + edge-case tests in parallel + one real-LLM run. Fast: checks only |
| 5 | `/ship [readme]` | API console examples, demo script, final check, short walkthrough |

Helpers: `/checkpoint` (commit), `/explain <thing>`, `/unlock-tests <reason>`.

## Guardrails (hooks)
- Optional: typecheck after each edit (hooks/after-edit.sh, off by default).
- Before stopping: tests must pass.
- Approved acceptance tests: edits blocked by a hook, and any change by any route fails `npm run verify` (git tag `spec-lock`).
- Destructive shell commands are blocked.

Subagents: `spec-critic`, `reviewer`, `edge-case-tester`. Skills: `backend-conventions`, `llm-feature`, `karpathy-guidelines`.
