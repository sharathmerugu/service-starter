#!/usr/bin/env bash
# PreToolUse(Edit|Write|MultiEdit): once the spec is approved, existing acceptance tests are read-only.
# New test files (e.g. edge.test.ts) are still allowed. Unlock with /unlock-tests.
cd "$CLAUDE_PROJECT_DIR" || exit 0
[ -f .claude/SPEC_LOCKED ] || exit 0
file=$(jq -r '.tool_input.file_path // empty')
case "$file" in
  *tests/acceptance/*)
    if [ -f "$file" ] && [ "$(basename "$file")" != "edge.test.ts" ]; then
      echo "Acceptance tests are locked (approved spec). Fix the code, not the test. If the requirement changed, ask me to run /unlock-tests." >&2
      exit 2
    fi ;;
esac
exit 0
