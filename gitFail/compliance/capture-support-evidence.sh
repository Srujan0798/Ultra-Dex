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
  echo "- Branch: $(git rev-parse --abbrev-ref HEAD)"
  echo "- HEAD: $(git rev-parse --short HEAD 2>/dev/null || echo 'none')"
  echo "- Remote: $(git config --get remote.origin.url || echo 'none')"
  echo
  echo "## Local Status Snapshot"
  echo '```text'
  git status --short --untracked-files=all || true
  echo '```'
  echo
  echo '## Remote Access Check (`ls-remote`)'
  echo '```text'
  GIT_SSH_COMMAND='ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new' \
    git ls-remote --heads origin 2>&1 || true
  echo '```'
  echo
  echo '## Push Capability Check (`push --dry-run`)'
  echo '```text'
  GIT_SSH_COMMAND='ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new' \
    git push --dry-run origin "$(git rev-parse --abbrev-ref HEAD)" 2>&1 || true
  echo '```'
  echo
  echo "## Recent Commits"
  echo '```text'
  git --no-pager log --date=iso-strict --pretty=format:"%h | %ad | %an | %s" -n 8 2>/dev/null || true
  echo
  echo '```'
} >"$OUT_FILE"

echo "Saved support evidence: $OUT_FILE"
echo "$OUT_FILE"
