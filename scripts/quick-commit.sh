#!/usr/bin/env bash
# Quick commit workflow: format, commit, minimal checks, push to main
# Usage: ./scripts/quick-commit.sh "feat(api): add health check"
# If message is missing or non-conventional, prefixes with "chore(repo): ".

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Config
BASE_BRANCH="${BASE_BRANCH:-main}"

log_info() { echo -e "${BLUE}ℹ${NC} $*"; }
log_success() { echo -e "${GREEN}✓${NC} $*"; }
log_warning() { echo -e "${YELLOW}⚠${NC} $*"; }
log_error() { echo -e "${RED}✗${NC} $*" 1>&2; }
log_step() { echo -e "\n${CYAN}==>${NC} ${BLUE}$*${NC}\n"; }
die() { log_error "$*"; exit 1; }

need() {
  command -v "$1" >/dev/null 2>&1 || die "$1 is required but not installed"
}

main() {
  need git
  need pnpm

  local current_branch
  current_branch=$(git rev-parse --abbrev-ref HEAD)

  if [[ "$current_branch" != "$BASE_BRANCH" ]]; then
    die "You are on '$current_branch'. Switch to '$BASE_BRANCH' or set BASE_BRANCH to proceed."
  fi

  log_step "Syncing $BASE_BRANCH"
  git fetch origin "$BASE_BRANCH" || true
  # Fast-forward only to avoid unexpected merges
  git pull --ff-only origin "$BASE_BRANCH" || true

  log_step "Formatting code"
  pnpm nx format:write

  log_step "Staging changes"
  git add -A
  if git diff --cached --quiet; then
    log_warning "No changes staged. Nothing to commit."
    exit 0
  fi

  local msg=${1:-}
  if [[ -z "$msg" ]]; then
    msg="chore(repo): quick commit"
  else
    # Ensure Conventional Commit style; if not, prefix with chore(repo)
    local conventional_pattern='^(feat|fix|docs|style|refactor|test|chore|ci|build|perf)(\([^)]+\))?:.+'
    if ! [[ "$msg" =~ $conventional_pattern ]]; then
      msg="chore(repo): $msg"
    fi
  fi

  log_step "Creating commit"
  git commit -m "$msg" || die "Commit failed"
  log_success "Committed: $msg"

  # Determine comparison base for affected commands
  local base_ref
  if git rev-parse --verify origin/"$BASE_BRANCH" >/dev/null 2>&1; then
    base_ref="origin/$BASE_BRANCH"
  elif git rev-parse --verify "$BASE_BRANCH" >/dev/null 2>&1; then
    base_ref="$BASE_BRANCH"
  else
    base_ref="HEAD~1"
  fi

  log_step "Running minimal checks (affected: lint, test, build)"
  pnpm nx affected -t lint --base="$base_ref"
  pnpm nx affected -t test --base="$base_ref" --parallel=3
  pnpm nx affected -t build --base="$base_ref" --parallel=3
  log_success "Minimal checks passed"

  log_step "Pushing to $BASE_BRANCH"
  git push origin "$BASE_BRANCH"
  log_success "Pushed to $BASE_BRANCH"

  echo -e "\n${GREEN}Done.${NC}"
  echo "Tip: pre-push hook will re-run typecheck/tests/build for safety."
}

main "$@"
