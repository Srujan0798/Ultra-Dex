#!/usr/bin/env sh
set -eu

MODE="${1:-push}"

echo "[enterprise-gate] mode=$MODE"

if [ "$MODE" != "local" ] && [ "$MODE" != "push" ]; then
  echo "[enterprise-gate] invalid mode: $MODE (use local|push)"
  exit 1
fi

echo "[enterprise-gate] 1/5 governance checks"
node gitFail/compliance/check-governance-files.js

echo "[enterprise-gate] 2/5 policy guard (local checks)"
SKIP_REMOTE_CHECK=1 node gitFail/compliance/github-guard.js

echo "[enterprise-gate] 3/5 tests"
npm test

echo "[enterprise-gate] 4/5 dependency security audit"
npm run security:audit

if [ "$MODE" = "push" ]; then
  echo "[enterprise-gate] 5/5 remote/account check"
  node gitFail/compliance/github-guard.js
fi

echo "[enterprise-gate] passed"
