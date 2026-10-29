---
description: Finalize SPEC.md, write failing acceptance tests + flow smoke test, and lock the tests.
argument-hint: <answers to the questions / my decisions> [critic]
---
My answers and decisions: $ARGUMENTS

1. Complete SPEC.md: data model, API contract table, business rules, AI component (if any), acceptance criteria as Given/When/Then (AC1..ACn, 4–8 max, sized to the timebox), edge cases, build order as vertical slices.
2. Only if my message includes the word "critic": run the `spec-critic` subagent on SPEC.md and apply only fixes that matter for the first version. Otherwise skip this step.
3. Write `tests/acceptance/<domain>.test.ts`: one `it("ACn …")` per criterion, supertest against `createApp()`, same style as tests/acceptance/tasks.test.ts. Delete the example tasks tests if the real domain replaces them.
4. Rewrite `scripts/smoke.sh` for the real feature: keep its boot + `check` helper, replace the example `/tasks` checks with the main user flow end-to-end over real HTTP (create → act → read result, plus one error case). If the flow has an async/AI step, poll the job until it finishes (max ~10s).
5. Run `npm test`. Confirm the new tests FAIL because the feature is missing (not because of syntax errors).
6. Lock the tests: `touch .claude/SPEC_LOCKED && git add -A && git commit -qm "test: acceptance tests for <feature>" && git tag -f spec-lock`.
7. Reply in plain words, short:
   - The acceptance criteria, one line each.
   - The build order.
   - Last line: "Run /build when ready."

Optional (long tasks only): I may set `/goal` myself. Do not ask me to.
