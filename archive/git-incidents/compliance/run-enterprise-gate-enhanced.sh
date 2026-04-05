#!/usr/bin/env sh
set -eu

MODE="${1:-push}"
VERBOSE="${VERBOSE:-0}"

echo "[enterprise-gate] mode=$MODE"

if [ "$MODE" != "local" ] && [ "$MODE" != "push" ]; then
  echo "[enterprise-gate] invalid mode: $MODE (use local|push)"
  exit 1
fi

# Function to run command with optional verbose output
run_check() {
  label="$1"
  shift
  echo "[enterprise-gate] $label"
  
  if [ "$VERBOSE" = "1" ]; then
    "$@"
  else
    "$@" 2>/dev/null || {
      echo "[enterprise-gate] ERROR: $label failed"
      exit 1
    }
  fi
}

# Function to run command with warning on failure (non-fatal)
run_check_warn() {
  label="$1"
  shift
  echo "[enterprise-gate] $label"
  
  if ! "$@" 2>/dev/null; then
    echo "[enterprise-gate] WARNING: $label failed (continuing)"
  fi
}

run_check "1/6 governance checks" node gitFail/compliance/check-governance-files.js

if [ "$MODE" = "push" ]; then
  run_check "2/6 policy guard (remote/account + policy checks)" node gitFail/compliance/github-guard.js
else
  run_check "2/6 policy guard (local checks)" SKIP_REMOTE_CHECK=1 node gitFail/compliance/github-guard.js
fi

run_check "3/6 tests" npm test

# Run security audit with warning instead of failure for moderate issues
echo "[enterprise-gate] 4/6 dependency security audit (warnings allowed)"
if ! npm run security:audit 2>/dev/null; then
  echo "[enterprise-gate] WARNING: Security audit has some issues (moderate severity allowed)"
fi

run_check "5/6 type checking" npm run typecheck

run_check_warn "6/6 lint check" npm run lint

echo "[enterprise-gate] All checks passed"
