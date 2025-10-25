#!/usr/bin/env bash
# Automated PR workflow: Push, Create PR, Wait for CI, Auto-merge, Cleanup
# Usage: ./scripts/merge-to-main.sh <branch-name> [--no-delete] [--merge-method=squash|merge|rebase]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
MERGE_METHOD="${MERGE_METHOD:-squash}" # Default merge method
DELETE_BRANCH="${DELETE_BRANCH:-true}"
BASE_BRANCH="${BASE_BRANCH:-main}"
MAX_WAIT_SECONDS=600 # 10 minutes max wait for CI
POLL_INTERVAL=10 # Check CI every 10 seconds

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $*"
}

log_success() {
    echo -e "${GREEN}✓${NC} $*"
}

log_error() {
    echo -e "${RED}✗${NC} $*" >&2
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $*"
}

log_step() {
    echo -e "\n${CYAN}==>${NC} ${BLUE}$*${NC}\n"
}

die() {
    log_error "$*"
    exit 1
}

check_dependencies() {
    command -v git >/dev/null 2>&1 || die "git is not installed"
    command -v gh >/dev/null 2>&1 || die "gh (GitHub CLI) is not installed. Install: https://cli.github.com/"

    # Check if gh is authenticated
    if ! gh auth status >/dev/null 2>&1; then
        die "GitHub CLI is not authenticated. Run: gh auth login"
    fi
}

# Parse arguments
BRANCH_NAME=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-delete)
            DELETE_BRANCH=false
            shift
            ;;
        --merge-method=*)
            MERGE_METHOD="${1#*=}"
            shift
            ;;
        *)
            if [[ -z "$BRANCH_NAME" ]]; then
                BRANCH_NAME="$1"
            else
                die "Unknown argument: $1"
            fi
            shift
            ;;
    esac
done

# Validate merge method
if [[ ! "$MERGE_METHOD" =~ ^(squash|merge|rebase)$ ]]; then
    die "Invalid merge method: $MERGE_METHOD. Must be squash, merge, or rebase"
fi

# Main workflow
main() {
    log_step "Starting automated PR workflow"

    check_dependencies

    # If no branch specified, use current branch
    if [[ -z "$BRANCH_NAME" ]]; then
        BRANCH_NAME=$(git branch --show-current)
        log_info "Using current branch: $BRANCH_NAME"
    fi

    # Validate we're not on the base branch
    if [[ "$BRANCH_NAME" == "$BASE_BRANCH" ]]; then
        die "Cannot create PR from $BASE_BRANCH to itself. Please switch to a feature branch."
    fi

    # Check if branch exists
    if ! git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
        die "Branch '$BRANCH_NAME' does not exist locally"
    fi

    # Switch to the branch if not already on it
    current_branch=$(git branch --show-current)
    if [[ "$current_branch" != "$BRANCH_NAME" ]]; then
        log_info "Switching to branch: $BRANCH_NAME"
        git checkout "$BRANCH_NAME"
    fi

    # Step 1: Push branch upstream
    log_step "Step 1/5: Pushing branch upstream"
    push_branch

    # Step 2: Create PR
    log_step "Step 2/5: Creating pull request"
    PR_NUMBER=$(create_pr)
    PR_URL=$(gh pr view "$PR_NUMBER" --json url -q .url)
    log_success "Pull request created: $PR_URL"

    # Step 3: Wait for CI
    log_step "Step 3/5: Waiting for CI checks"
    wait_for_ci "$PR_NUMBER"

    # Step 4: Merge PR
    log_step "Step 4/5: Merging pull request"
    merge_pr "$PR_NUMBER"

    # Step 5: Cleanup
    log_step "Step 5/5: Cleaning up"
    cleanup_local

    log_success "\n✨ Workflow complete! Branch '$BRANCH_NAME' merged to $BASE_BRANCH"
}

push_branch() {
    # Check if branch is already pushed
    if git ls-remote --exit-code --heads origin "$BRANCH_NAME" >/dev/null 2>&1; then
        log_info "Branch already exists on remote, pushing any new commits..."
        git push origin "$BRANCH_NAME"
    else
        log_info "Pushing branch with upstream tracking..."
        git push -u origin "$BRANCH_NAME"
    fi
    log_success "Branch pushed successfully"
}

create_pr() {
    # Check if PR already exists
    existing_pr=$(gh pr list --head "$BRANCH_NAME" --json number -q '.[0].number' 2>/dev/null || echo "")

    if [[ -n "$existing_pr" ]]; then
        log_warning "PR already exists: #$existing_pr"
        echo "$existing_pr"
        return
    fi

    # Generate PR title from branch name
    pr_title=$(generate_pr_title)

    # Generate PR body
    pr_body=$(generate_pr_body)

    # Create PR
    log_info "Creating PR with title: $pr_title"
    pr_number=$(gh pr create \
        --title "$pr_title" \
        --body "$pr_body" \
        --base "$BASE_BRANCH" \
        --head "$BRANCH_NAME" \
        --json number -q .number)

    echo "$pr_number"
}

generate_pr_title() {
    # Try to infer commit type from branch name
    # Examples: feat/user-auth -> feat: add user auth
    #           fix-memory-leak -> fix: resolve memory leak

    local title=""

    # Check for conventional commit prefixes in branch name
    if [[ "$BRANCH_NAME" =~ ^(feat|fix|docs|style|refactor|test|chore|ci|build|perf)[/-] ]]; then
        local type="${BASH_REMATCH[1]}"
        local description="${BRANCH_NAME#*[/-]}"
        description=$(echo "$description" | tr '-_' ' ')
        title="$type: $description"
    else
        # Fallback: ask user or use branch name as-is
        local description=$(echo "$BRANCH_NAME" | tr '-_' ' ')
        title="feat: $description"
    fi

    echo "$title"
}

generate_pr_body() {
    # Get commit messages for context
    local commits=$(git log --oneline "$BASE_BRANCH..HEAD" | head -10)

    # Count changes
    local files_changed=$(git diff --name-only "$BASE_BRANCH...HEAD" | wc -l | tr -d ' ')

    cat <<EOF
## Problem Statement
Merge branch \`$BRANCH_NAME\` into \`$BASE_BRANCH\`.

## Summary of Changes
This PR includes the following changes from \`$BRANCH_NAME\`:

- $files_changed file(s) modified
- Commits included:
$(echo "$commits" | sed 's/^/  - /')

## Tests + Coverage
- [ ] All tests passing
- [ ] Coverage thresholds met (90%+)
- Run tests: \`pnpm nx affected -t test\`

## Docs Updates
- [ ] Documentation updated if needed
- [ ] CHANGELOG.md updated
- [ ] No breaking changes (or documented if present)

---

**Reviewer Notes:**
- Base: \`$BASE_BRANCH\`
- Head: \`$BRANCH_NAME\`
- Merge method: $MERGE_METHOD

**Pre-merge Checklist:**
- [ ] CI is green
- [ ] Code reviewed
- [ ] No secrets committed
EOF
}

wait_for_ci() {
    local pr_number=$1
    local elapsed=0

    log_info "Polling CI status (max wait: ${MAX_WAIT_SECONDS}s, check every ${POLL_INTERVAL}s)..."

    while [[ $elapsed -lt $MAX_WAIT_SECONDS ]]; do
        # Get CI status
        local status=$(gh pr view "$pr_number" --json statusCheckRollup -q '.statusCheckRollup[0].conclusion' 2>/dev/null || echo "PENDING")
        local state=$(gh pr view "$pr_number" --json statusCheckRollup -q '.statusCheckRollup[] | select(.conclusion != null) | .conclusion' 2>/dev/null || echo "")

        # Check if all checks passed
        local all_success=true
        local any_failure=false

        if [[ -n "$state" ]]; then
            while IFS= read -r check_status; do
                if [[ "$check_status" == "FAILURE" || "$check_status" == "CANCELLED" ]]; then
                    any_failure=true
                    all_success=false
                    break
                elif [[ "$check_status" != "SUCCESS" ]]; then
                    all_success=false
                fi
            done <<< "$state"
        else
            all_success=false
        fi

        if [[ "$any_failure" == true ]]; then
            log_error "CI checks failed!"
            gh pr view "$pr_number" --json statusCheckRollup -q '.statusCheckRollup[] | "\(.name): \(.conclusion)"'
            die "Cannot merge PR with failed CI checks. Fix issues and retry."
        fi

        if [[ "$all_success" == true ]]; then
            log_success "All CI checks passed!"
            return 0
        fi

        # Show progress
        echo -ne "\r${YELLOW}⏳${NC} Waiting for CI... (${elapsed}s elapsed)"

        sleep $POLL_INTERVAL
        elapsed=$((elapsed + POLL_INTERVAL))
    done

    echo "" # New line after progress
    log_error "Timeout waiting for CI (${MAX_WAIT_SECONDS}s)"
    die "CI checks did not complete in time. Check status manually: $(gh pr view "$pr_number" --json url -q .url)"
}

merge_pr() {
    local pr_number=$1

    log_info "Merging PR #$pr_number using $MERGE_METHOD method..."

    # Merge PR
    if gh pr merge "$pr_number" --"$MERGE_METHOD" --auto; then
        log_success "PR merged successfully!"
    else
        die "Failed to merge PR. Check for conflicts or permissions."
    fi
}

cleanup_local() {
    # Switch to base branch
    log_info "Switching to $BASE_BRANCH..."
    git checkout "$BASE_BRANCH"

    # Pull latest changes
    log_info "Pulling latest changes..."
    git pull origin "$BASE_BRANCH"

    # Delete local branch if requested
    if [[ "$DELETE_BRANCH" == true ]]; then
        log_info "Deleting local branch: $BRANCH_NAME"
        git branch -d "$BRANCH_NAME" 2>/dev/null || git branch -D "$BRANCH_NAME"
        log_success "Local branch deleted"
    else
        log_info "Keeping local branch: $BRANCH_NAME"
    fi

    # Clean up remote tracking
    log_info "Pruning stale remote branches..."
    git fetch --prune

    log_success "Cleanup complete"
}

# Run main workflow
main
