#!/usr/bin/env sh
set -eu

OUT_DIR="gitFail/compliance/status"
mkdir -p "$OUT_DIR"
TS="$(date -u +"%Y-%m-%dT%H-%M-%SZ")"
OUT_FILE="$OUT_DIR/support-evidence-$TS.md"

{
  echo "# Support Evidence"
  echo
  echo "Generated (UTC): $(date -u +"%Y-%m-%d %H:%M:%S")"
  echo
  echo "## Repository"
  echo "- Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
  echo "- HEAD: $(git rev-parse --short HEAD 2>/dev/null || echo 'none')"
  echo "- Remote: $(git config --get remote.origin.url 2>/dev/null || echo 'none')"
  echo
  echo "## Local Status Snapshot"
  echo '```text'
  if command -v git >/dev/null 2>&1; then
    git status --short --untracked-files=all 2>/dev/null || echo "(git status failed)"
  else
    echo "(git command not available)"
  fi
  echo '```'
  echo
  echo '## Remote Access Check (`ls-remote`)'
  echo '```text'
  if command -v ssh >/dev/null 2>&1; then
    GIT_SSH_COMMAND='ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new' \
      git ls-remote --heads origin 2>&1 || echo "(ls-remote failed - possibly due to authentication or network)"
  else
    echo "(ssh command not available)"
  fi
  echo '```'
  echo
  echo '## Push Capability Check (`push --dry-run`)'
  echo '```text'
  if command -v ssh >/dev/null 2>&1; then
    GIT_SSH_COMMAND='ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new' \
      git push --dry-run origin "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'HEAD')" 2>&1 || echo "(push --dry-run failed - possibly due to authentication or network)"
  else
    echo "(ssh command not available)"
  fi
  echo '```'
  echo
  echo "## Recent Commits"
  echo '```text'
  if command -v git >/dev/null 2>&1; then
    git --no-pager log --date=iso-strict --pretty=format:"%h | %ad | %an | %s" -n 8 2>/dev/null || echo "(log command failed)"
  else
    echo "(git command not available)"
  fi
  echo
  echo '```'
} >"$OUT_FILE"

echo "Saved support evidence: $OUT_FILE"
echo "$OUT_FILE"
