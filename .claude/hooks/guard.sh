#!/usr/bin/env bash
# PreToolUse(Bash): block destructive commands (agent runs with a broad allowlist).
cmd=$(cat | jq -r '.tool_input.command // empty')
if echo "$cmd" | grep -Eq 'rm -rf (/|~|\.|\*)|git push .*--force|git reset --hard|cat .*\.env($| )'; then
  echo "Blocked by guard hook: $cmd" >&2; exit 2
fi
exit 0
