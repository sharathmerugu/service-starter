#!/usr/bin/env bash
# Approved acceptance tests must be unchanged since the `spec-lock` tag (set by /spec).
# Catches changes made by any route (Edit, Write, sed, scripts). New edge.test.ts is allowed.
git rev-parse -q --verify refs/tags/spec-lock >/dev/null 2>&1 || { echo "locked tests: no spec-lock tag yet (skipped)"; exit 0; }
changed=$(git diff --name-only spec-lock -- tests/acceptance ':(exclude)tests/acceptance/edge.test.ts'; \
          git ls-files --deleted -- tests/acceptance)
if [ -n "$changed" ]; then
  echo "FAIL: approved acceptance tests changed since spec-lock:"; echo "$changed" | sort -u
  echo "If the requirement changed, use /unlock-tests (re-tags after updating SPEC.md and tests)."; exit 1
fi
echo "locked tests: unchanged"
