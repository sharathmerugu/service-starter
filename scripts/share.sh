#!/usr/bin/env bash
# Public URL for reviewers/testers. Prefers cloudflared (no account), falls back to ngrok.
PORT=${PORT:-3000}
if command -v cloudflared >/dev/null; then exec cloudflared tunnel --url "http://localhost:$PORT"
elif command -v ngrok >/dev/null; then exec ngrok http "$PORT"
else echo "Install one: brew install cloudflared   (or ngrok)"; exit 1; fi
