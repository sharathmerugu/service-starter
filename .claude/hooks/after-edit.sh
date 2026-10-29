#!/usr/bin/env bash
# NOT enabled by default (interrupts multi-file edits). To enable, add a PostToolUse hook for Edit|Write|MultiEdit in .claude/settings.json.
# PostToolUse(Edit|Write): typecheck after any TS edit; feed errors back to Claude (exit 2).
input=$(cat)
file=$(echo "$input" | jq -r '.tool_input.file_path // empty')
[[ "$file" == *.ts ]] || exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 0
out=$(npx tsc --noEmit 2>&1 | head -20)
if [ -n "$out" ]; then echo "Typecheck failed after editing $file:"$'\n'"$out" >&2; exit 2; fi
exit 0
