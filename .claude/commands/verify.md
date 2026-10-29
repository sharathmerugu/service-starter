---
description: Check the work. Default = full (review + edge tests + real-LLM run). Add "fast" when time is short.
argument-hint: [fast]
---
If my message includes "fast": run `npm run verify` only, fix anything failing, then report in ≤4 plain-language lines (passed?, what was fixed, known limitations). Stop there.

Otherwise (full):
1. Run `npm run verify`. Fix anything failing first.
2. In parallel, launch subagents:
   - `reviewer` on `git diff $(git rev-list --max-parents=0 HEAD)..HEAD` against SPEC.md.
   - `edge-case-tester` to add tests in tests/acceptance/edge.test.ts.
3. Real end-to-end check: if an LLM API key is set in .env, start the server with `LLM_MOCK=0` on port 3998, run the main flow against it (`BASE_URL=http://localhost:3998 bash scripts/demo.sh` if it exists, otherwise the smoke checks), and report whether the real model's output passed validation. Stop the server after. Skip with one line if no key.
4. Fix Critical/High findings now. List Medium/Low as "known limitations".
5. Re-run `npm run verify` until it passes. Commit `fix: review findings`.
6. Report in plain words, ≤8 lines: checks passed?, real-LLM run result, what was found and fixed, known limitations.
