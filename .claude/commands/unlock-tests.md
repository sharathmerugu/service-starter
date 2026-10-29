---
description: Unlock approved acceptance tests when the requirement itself changed.
argument-hint: <what changed in the requirement>
---
Requirement change: $ARGUMENTS
1. Update SPEC.md first (the acceptance criteria that changed).
2. `rm -f .claude/SPEC_LOCKED`, update only the affected tests, run `npm test` to see them fail for the right reason.
3. `touch .claude/SPEC_LOCKED && git add -A && git commit -qm "test: update acceptance tests (<change>)" && git tag -f spec-lock`. Tell me in one line what changed, then continue building.
