#!/usr/bin/env bash
# Boots the real server and hits it over HTTP. Exit non-zero on any failure.
set -euo pipefail
PORT=${SMOKE_PORT:-3999}
LLM_MOCK=${LLM_MOCK:-1} PORT=$PORT npx tsx src/server.ts > /tmp/smoke.log 2>&1 &
PID=$!; trap 'kill $PID 2>/dev/null || true' EXIT
for i in $(seq 1 50); do curl -sf "localhost:$PORT/health" >/dev/null && break; sleep 0.2; done
B="localhost:$PORT"
check() { local want=$1; shift; local got; got=$(curl -s -o /tmp/smoke.body -w '%{http_code}' "$@"); 
  if [ "$got" != "$want" ]; then echo "FAIL want $want got $got: $*"; cat /tmp/smoke.body; exit 1; fi; echo "ok $want $*" | cut -c1-110; }
check 200 "$B/health"
check 201 -X POST "$B/tasks" -H 'content-type: application/json' -d '{"title":"smoke"}'
ID=$(jq -r .id /tmp/smoke.body)
check 200 "$B/tasks/$ID"
check 400 -X POST "$B/tasks" -H 'content-type: application/json' -d '{"title":""}'
check 202 -X POST "$B/tasks/$ID/summarize"
check 404 "$B/does-not-exist"
echo "SMOKE PASSED"
