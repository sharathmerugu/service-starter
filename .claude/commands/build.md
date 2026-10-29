---
description: Implement SPEC.md slice by slice until all acceptance tests pass.
argument-hint: [optional: slice number or focus]
---
First run: `rm -f .claude/LOOP_OFF` (turn the test gate on).

Implement SPEC.md following CLAUDE.md. Focus: $ARGUMENTS

For each slice in the build order:
1. Domain schema + pure rules in src/domain (unit test any non-trivial rule).
2. Thin route in src/routes, registered in src/app.ts.
3. `npm run typecheck && npm test`. Fix until this slice's tests pass. Don't move on with failing tests.
4. Commit: `git add -A && git commit -qm "feat: <slice>"`.
5. One plain-language line to me: "Slice N done — ACx, ACy passing (k of n). Next: …"

When all slices are done, run `npm run verify` and show its output.
If the same failure survives 3 fix attempts, stop and explain the blocker in plain words instead of retrying.

Rules:
- Reuse src/lib (parse, errors, Store, JobQueue, callLLM). If the spec has an LLM step, use the llm-feature skill.
- Never edit locked acceptance tests. If one looks wrong, stop and tell me why in plain words.
- Keep scripts/smoke.sh walking the main flow; don't weaken its checks to make it pass.
- Update public/index.html EXAMPLES for new endpoints. Remove the example tasks domain once unused.
- If the spec contradicts itself, stop and ask one simple question.
