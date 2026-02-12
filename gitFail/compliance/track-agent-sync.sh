#!/usr/bin/env sh
set -eu

OUT_DIR="gitFail/compliance/status"
QUIET="${TRACK_SYNC_QUIET:-0}"
mkdir -p "$OUT_DIR"

TS="$(date -u +"%Y-%m-%dT%H-%M-%SZ")"
OUT_FILE="$OUT_DIR/$TS.txt"

{
  echo "Agent Sync Snapshot (UTC): $(date -u +"%Y-%m-%d %H:%M:%S")"
  echo "Branch: $(git rev-parse --abbrev-ref HEAD)"
  echo "Head: $(git rev-parse --short HEAD 2>/dev/null || echo 'none')"
  echo

  echo "Recent Commits:"
  git --no-pager log --date=iso-strict --pretty=format:"%h | %ad | %an | %s" -n 8 2>/dev/null || true
  echo
  echo

  echo "Working Tree Status:"
  git status --short --untracked-files=all
  echo

  echo "Staged Files:"
  git diff --cached --name-only
  echo

  echo "Unstaged Files:"
  git diff --name-only
  echo

  echo "Untracked Files:"
  git ls-files --others --exclude-standard
  echo
} > "$OUT_FILE"

if [ "$QUIET" = "1" ]; then
  echo "Saved snapshot: $OUT_FILE"
else
  cat "$OUT_FILE"
  echo "Saved snapshot: $OUT_FILE"
fi
