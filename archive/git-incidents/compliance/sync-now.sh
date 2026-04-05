#!/usr/bin/env sh
set -eu

OUT_DIR="gitFail/compliance/status"
mkdir -p "$OUT_DIR"

LATEST_BEFORE="$(ls -1t "$OUT_DIR"/*.txt 2>/dev/null | head -n 1 || true)"

TRACK_SYNC_QUIET=1 ./gitFail/compliance/track-agent-sync.sh >/tmp/agent-sync-last.txt

LATEST_AFTER="$(ls -1t "$OUT_DIR"/*.txt 2>/dev/null | head -n 1 || true)"

if [ -z "$LATEST_AFTER" ]; then
  echo "No snapshot was created."
  exit 1
fi

echo "Latest snapshot: $LATEST_AFTER"

if [ -z "$LATEST_BEFORE" ] || [ "$LATEST_BEFORE" = "$LATEST_AFTER" ]; then
  echo "No previous snapshot available for delta comparison."
  exit 0
fi

extract_section() {
  file="$1"
  start="$2"
  end="$3"
  awk -v s="$start" -v e="$end" '
    $0 == s { flag = 1; next }
    $0 == e { flag = 0 }
    flag && NF > 0 { print }
  ' "$file" | sed 's/[[:space:]]*$//'
}

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

extract_section "$LATEST_BEFORE" "Working Tree Status:" "Staged Files:" | sort >"$TMP_DIR/prev-status.txt"
extract_section "$LATEST_AFTER" "Working Tree Status:" "Staged Files:" | sort >"$TMP_DIR/new-status.txt"

extract_section "$LATEST_BEFORE" "Staged Files:" "Unstaged Files:" | sort >"$TMP_DIR/prev-staged.txt"
extract_section "$LATEST_AFTER" "Staged Files:" "Unstaged Files:" | sort >"$TMP_DIR/new-staged.txt"

extract_section "$LATEST_BEFORE" "Unstaged Files:" "Untracked Files:" | sort >"$TMP_DIR/prev-unstaged.txt"
extract_section "$LATEST_AFTER" "Unstaged Files:" "Untracked Files:" | sort >"$TMP_DIR/new-unstaged.txt"

echo
echo "Delta since: $LATEST_BEFORE"
echo

echo "Working tree added:"
comm -13 "$TMP_DIR/prev-status.txt" "$TMP_DIR/new-status.txt" || true
echo
echo "Working tree removed:"
comm -23 "$TMP_DIR/prev-status.txt" "$TMP_DIR/new-status.txt" || true
echo

echo "Staged added:"
comm -13 "$TMP_DIR/prev-staged.txt" "$TMP_DIR/new-staged.txt" || true
echo
echo "Staged removed:"
comm -23 "$TMP_DIR/prev-staged.txt" "$TMP_DIR/new-staged.txt" || true
echo

echo "Unstaged added:"
comm -13 "$TMP_DIR/prev-unstaged.txt" "$TMP_DIR/new-unstaged.txt" || true
echo
echo "Unstaged removed:"
comm -23 "$TMP_DIR/prev-unstaged.txt" "$TMP_DIR/new-unstaged.txt" || true
