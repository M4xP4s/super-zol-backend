# Semantic PR Workflow Reference

This document contains the complete specification from `.github/workflows/semantic-pr.yml` that validates pull requests in this repository.

## Workflow Overview

The `semantic-pr` workflow runs on PR events: `opened`, `edited`, `synchronize`, `reopened`

## Job 1: Validate PR Title (Conventional Commits)

**Action**: `amannn/action-semantic-pull-request@v5`

**Configuration**:

```yaml
types: |
  feat
  fix
  docs
  style
  refactor
  test
  chore
  ci
  build
  perf
requireScope: false
subjectPattern: '.{3,}'
```

**Validation Rules**:

- PR title must match format: `<type>(<scope>): <subject>`
- Type must be one of the 10 allowed types listed above
- Scope is optional (`requireScope: false`)
- Subject must be at least 3 characters (regex: `.{3,}`)

**Valid Examples**:

- `feat(api): add user authentication endpoint`
- `test(fetch-kaggle): add comprehensive CLI tests`
- `fix: resolve memory leak in batch processor`
- `docs(phase-8-9): enhance planning document`

**Invalid Examples**:

- `Added new feature` ❌ (missing type)
- `WIP` ❌ (too short, missing format)
- `Test(cli): add tests` ❌ (capitalized type)
- `feat add feature` ❌ (missing colon)

## Job 2: Validate PR Body Has Required Sections

**Action**: `actions/github-script@v7`

**Validation Script**:

```javascript
const body = (context.payload.pull_request && context.payload.pull_request.body) || '';
const required = [
  '## Problem Statement',
  '## Summary of Changes',
  '## Tests + Coverage',
  '## Docs Updates',
];
const missing = required.filter((h) => !body.includes(h));
if (missing.length) {
  core.setFailed(`PR body is missing required sections: ${missing.join(', ')}`);
}
```

**Validation Rules**:

- PR body must contain ALL four section headers
- Headers are case-sensitive (exact string match via `includes()`)
- Headers must be h2 level (`##`, not `###`)
- Order doesn't matter, but all four must be present

**Required Headers** (exact strings):

1. `## Problem Statement`
2. `## Summary of Changes`
3. `## Tests + Coverage`
4. `## Docs Updates`

**Common Validation Failures**:

| What You Wrote          | Why It Fails                      |
| ----------------------- | --------------------------------- |
| `## Summary`            | Must be `## Summary of Changes`   |
| `## Testing`            | Must be `## Tests + Coverage`     |
| `## Documentation`      | Must be `## Docs Updates`         |
| `### Problem Statement` | Must be `##` (h2), not `###` (h3) |
| Missing any section     | All four sections are required    |

## CI Check Status

After creating or editing a PR, expect these checks:

```bash
$ gh pr checks <pr-number>
Validate PR title (Conventional Commits)    pass/fail
Validate PR body has required sections      pass/fail
lint                                         pass/fail
test                                         pass/fail
build                                        pass/fail
```

All five checks must pass before the PR can be merged.

## Debugging Validation Failures

### Title Validation Failed

**Error Example**: "PR title does not match Conventional Commits format"

**Fix**:

```bash
gh pr edit <pr-number> --title "<type>(<scope>): <subject>"
```

**Check**:

- Is type lowercase?
- Is type one of the 10 allowed types?
- Is there a colon and space after type/scope?
- Is subject at least 3 characters?

### Body Validation Failed

**Error Example**: "PR body is missing required sections: ## Problem Statement, ## Docs Updates"

**Fix**:

```bash
gh pr edit <pr-number> --body "$(cat <<'EOF'
## Problem Statement
[content]

## Summary of Changes
[content]

## Tests + Coverage
[content]

## Docs Updates
[content]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**Check**:

- Are all four section headers present?
- Are they exact matches (case-sensitive)?
- Are they h2 level (`##`)?
- Did you include the space after `##`?

## Source File

Complete workflow specification: `.github/workflows/semantic-pr.yml`
