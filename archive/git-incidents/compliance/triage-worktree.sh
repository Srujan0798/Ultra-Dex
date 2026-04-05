#!/usr/bin/env sh
set -eu

OUT_DIR="gitFail/compliance/status"
mkdir -p "$OUT_DIR"
TS="$(date -u +"%Y-%m-%dT%H-%M-%SZ")"
OUT_FILE="$OUT_DIR/triage-$TS.md"

ALL_FILES="$(git status --porcelain --untracked-files=all | sed 's/^...//' || true)"

group_files() {
  pattern="$1"
  printf "%s\n" "$ALL_FILES" | rg "^$pattern" || true
}

append_group() {
  title="$1"
  pattern="$2"
  echo "## $title" >>"$OUT_FILE"
  FILES="$(group_files "$pattern")"
  if [ -z "$FILES" ]; then
    echo "- (none)" >>"$OUT_FILE"
  else
    printf "%s\n" "$FILES" | sed 's/^/- /' >>"$OUT_FILE"
  fi
  echo >>"$OUT_FILE"
}

{
  echo "# Worktree Triage"
  echo
  echo "Generated (UTC): $(date -u +"%Y-%m-%d %H:%M:%S")"
  echo "Branch: $(git rev-parse --abbrev-ref HEAD)"
  echo "Head: $(git rev-parse --short HEAD 2>/dev/null || echo 'none')"
  echo
} >"$OUT_FILE"

append_group "Governance and Compliance" "\"?(\\.github/|\\.husky/|CODE_OF_CONDUCT\\.md|SECURITY\\.md|CONTRIBUTING\\.md|docs/governance/|gitFail/compliance/|gitFail/README\\.md)"
append_group "Incident Notes" "\"?gitFail/incidents/"
append_group "Product / Feature Code" "\"?(apps/|src/|scripts/)"
append_group "Dependency / Lock / Other" "\"?(package\\.json|package-lock\\.json|check_deps\\.cjs|README\\.md|eslint\\.config\\.js)"

{
  echo "## Recommended Commit Split"
  echo '- `chore(governance):` governance/compliance files only'
  echo '- `docs(gitfail):` incident notes only'
  echo '- `feat/fix(cli):` app/src feature changes'
  echo '- `chore(deps):` dependency or lockfile updates'
  echo
  echo "## Quick Commands"
  echo '```bash'
  echo "# 1) Governance commit"
  echo "git add .github/workflows/governance-compliance.yml .husky/pre-commit .husky/pre-push \\"
  echo "  CODE_OF_CONDUCT.md SECURITY.md CONTRIBUTING.md docs/governance/README.md \\"
  echo "  .github/PULL_REQUEST_TEMPLATE.md gitFail/compliance gitFail/README.md"
  echo
  echo "# 2) Incident notes commit"
  echo "git add gitFail/incidents"
  echo
  echo "# 3) Feature/code commit"
  echo "git add apps src scripts eslint.config.js README.md"
  echo
  echo "# 4) Dependency commit"
  echo "git add package.json apps/cli/package.json package-lock.json check_deps.cjs"
  echo '```'
} >>"$OUT_FILE"

cat "$OUT_FILE"
echo "Saved triage report: $OUT_FILE"
