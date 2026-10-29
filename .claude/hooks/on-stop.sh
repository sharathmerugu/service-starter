#!/usr/bin/env bash
# Stop: don't let Claude declare "done" while tests are red. The loop.
input=$(cat)
[ "$(echo "$input" | jq -r '.stop_hook_active')" = "true" ] && exit 0   # avoid infinite loop
cd "$CLAUDE_PROJECT_DIR" || exit 0
[ -f .claude/LOOP_OFF ] && exit 0                                         # touch to disable during intake/spec
out=$(LLM_MOCK=1 npx vitest run 2>&1)
if [ $? -ne 0 ]; then
  echo "Tests are failing. Fix them before stopping (or say why they are expected to fail):"$'\n'"$(echo "$out" | grep -E 'FAIL|✗|×|AssertionError|Expected|Received' | head -25)" >&2
  exit 2
fi
exit 0
