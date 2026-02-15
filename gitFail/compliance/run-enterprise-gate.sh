#!/usr/bin/env sh
set -eu

MODE="${1:-push}"
FULL_MODE="${ENTERPRISE_GATE_FULL:-0}"
AUDIT_CHANGED_ONLY="${ENTERPRISE_GATE_AUDIT_CHANGED_ONLY:-1}"

echo "[enterprise-gate] mode=$MODE"
echo "[enterprise-gate] full_mode=$FULL_MODE"

if [ "$MODE" != "local" ] && [ "$MODE" != "push" ]; then
  echo "[enterprise-gate] invalid mode: $MODE (use local|push)"
  exit 1
fi

get_diff_range() {
  if git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' >/dev/null 2>&1; then
    BASE="$(git merge-base HEAD '@{upstream}')"
    echo "${BASE}...HEAD"
    return 0
  fi

  if git rev-parse HEAD~1 >/dev/null 2>&1; then
    echo "HEAD~1...HEAD"
    return 0
  fi

  return 1
}

dependencies_changed() {
  RANGE="$(get_diff_range || true)"

  if [ -z "${RANGE:-}" ]; then
    return 1
  fi

  git diff --name-only "$RANGE" | grep -E '(^|/)(package\.json|package-lock\.json|npm-shrinkwrap\.json|pnpm-lock\.yaml|yarn\.lock)$' >/dev/null 2>&1
}

echo "[enterprise-gate] 1/5 governance checks"
node gitFail/compliance/check-governance-files.js

if [ "$MODE" = "push" ]; then
  echo "[enterprise-gate] 2/5 policy guard (remote/account + policy checks)"
  node gitFail/compliance/github-guard.js
else
  echo "[enterprise-gate] 2/5 policy guard (local checks)"
  SKIP_REMOTE_CHECK=1 node gitFail/compliance/github-guard.js
fi

echo "[enterprise-gate] 3/5 tests"
if [ "$MODE" = "push" ] && [ "$FULL_MODE" != "1" ]; then
  echo "[enterprise-gate] using push smoke suite (set ENTERPRISE_GATE_FULL=1 for full suite)"
  npm run test:push:smoke
else
  echo "[enterprise-gate] using full test suite"
  npm test
fi

echo "[enterprise-gate] 4/5 dependency security audit"
if [ "$MODE" = "push" ] && [ "$FULL_MODE" != "1" ] && [ "$AUDIT_CHANGED_ONLY" = "1" ]; then
  if dependencies_changed; then
    echo "[enterprise-gate] dependency manifests changed; running security audit"
    npm run security:audit
  else
    echo "[enterprise-gate] no dependency manifest changes; skipping audit in push smoke mode"
  fi
else
  npm run security:audit
fi

echo "[enterprise-gate] 5/5 finalization checks complete"

echo "[enterprise-gate] passed"
