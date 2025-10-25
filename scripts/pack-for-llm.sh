#!/usr/bin/env bash
set -euo pipefail

# pack-for-llm.sh
# Creates a tar.gz archive of the repo excluding everything in .gitignore
# and other standard excludes by leveraging `git ls-files`.

usage() {
  cat <<'EOF'
Usage: scripts/pack-for-llm.sh [output-file]

Creates a tar.gz of the repository including only files that are tracked or
explicitly unignored (i.e., excluding everything in .gitignore by default).

Arguments:
  output-file  Optional explicit output path. If omitted, an archive is written to
               dist/archives/<repo>-llm-pack-<date>-<sha>.tar.gz.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

ROOT_DIR=$(git rev-parse --show-toplevel 2>/dev/null || true)
if [[ -z "${ROOT_DIR}" || ! -d "${ROOT_DIR}/.git" ]]; then
  echo "Error: Must be run inside a Git repository." >&2
  exit 1
fi

cd "${ROOT_DIR}"

REPO_NAME=$(basename "${ROOT_DIR}")
DATE_UTC=$(date -u +"%Y%m%d-%H%M%S")
GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "nogit")

OUT_DIR="${ROOT_DIR}/dist/archives"
mkdir -p "${OUT_DIR}"

DEFAULT_NAME="${REPO_NAME}-llm-pack-${DATE_UTC}-${GIT_SHA}.tar.gz"
OUT_FILE="${1:-${OUT_DIR}/${DEFAULT_NAME}}"

echo "📦 Creating LLM pack: ${OUT_FILE}"

# Use git to list tracked and unignored files, then tar from that list.
# -z null-delimited for safety with spaces; tar reads with --null -T -
git ls-files -z --cached --others --exclude-standard \
  | tar -czf "${OUT_FILE}" --null -T -

echo "✅ Archive created"
echo "   Path: ${OUT_FILE}"
echo "   Size: $(du -h "${OUT_FILE}" | awk '{print $1}')"

