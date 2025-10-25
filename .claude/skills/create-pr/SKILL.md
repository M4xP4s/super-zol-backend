---
name: create-pr
description: Automate GitHub pull request creation following repository CI validation requirements. Use when creating or editing pull requests to ensure compliance with semantic-pr workflow validation (Conventional Commits title format and required PR body sections).
---

# Create PR

## Overview

Automate creation of GitHub pull requests that comply with repository CI validation rules. This skill ensures PRs pass validation checks for title format (Conventional Commits) and required body sections.

## Validation Requirements

The repository enforces two key validations via `.github/workflows/semantic-pr.yml`:

1. **PR Title**: Must follow Conventional Commits format: `<type>(<scope>): <subject>`
   - Valid types: feat, fix, docs, style, refactor, test, chore, ci, build, perf
   - Scope is optional
   - Subject must be ≥3 characters

2. **PR Body**: Must include exactly four section headers (case-sensitive):
   - `## Problem Statement`
   - `## Summary of Changes`
   - `## Tests + Coverage`
   - `## Docs Updates`

## Workflow

### Creating a New PR

Execute these steps when creating a pull request:

1. **Prepare PR content**:
   - Draft title in Conventional Commits format
   - Write body with all four required sections
   - Add Claude Code attribution footer

2. **Create PR using gh CLI**:

   ```bash
   gh pr create --title "<type>(<scope>): <subject>" --body "$(cat <<'EOF'
   ## Problem Statement
   [Describe the issue or requirement being addressed]

   ## Summary of Changes
   [List of changes made, organized by category]

   ## Tests + Coverage
   [Test results, coverage metrics, verification steps]

   ## Docs Updates
   [Documentation changes, file updates, reference links]

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>
   EOF
   )"
   ```

3. **Verify CI checks pass**:

   ```bash
   sleep 10
   gh pr checks <pr-number>
   ```

4. **If validation fails, fix and update**:

   ```bash
   # Fix title
   gh pr edit <pr-number> --title "<correct-format>"

   # Fix body
   gh pr edit <pr-number> --body "$(cat <<'EOF'
   [content with all four sections]
   EOF
   )"
   ```

### Common Mistakes to Avoid

**Incorrect Section Headers** (causes validation failure):

- `## Summary` ❌ (must be `## Summary of Changes`)
- `## Testing` ❌ (must be `## Tests + Coverage`)
- `## Documentation` ❌ (must be `## Docs Updates`)
- `### Problem Statement` ❌ (must be `##`, not `###`)

**Missing Sections** (causes validation failure):

- Omitting any of the four required sections

**Wrong Title Format** (causes validation failure):

- `Added new CLI tests` ❌ (no type)
- `test - add CLI tests` ❌ (wrong delimiter)
- `Test(cli): add tests` ❌ (capitalized type)

## Required PR Body Template

```markdown
## Problem Statement

[Describe what problem exists, why it needs solving, and relevant context]

## Summary of Changes

### Category 1

- Change 1
- Change 2

### Category 2

- Change 3
- Change 4

## Tests + Coverage

### Test Results

- **Total Tests**: X (up from Y, +Z new tests)
- **Status**: ✅ All passing
- **Execution Time**: Xs

### Coverage Metrics

**Before:**

- Statements: X%
- Branches: Y%

**After:**

- Statements: X% ✅ (target: N%, +M%)
- Branches: Y% ✅ (target: N%, +M%)

## Docs Updates

### Updated Documentation

- ✅ `file1.md`: Description of changes
- ✅ `TODO.md`: Updated task status

### Files Changed

- `path/to/file1.ts` (new/enhanced)
- `path/to/file2.ts` (updated)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Pre-Flight Checklist

Before creating any PR, verify:

- [ ] Title follows Conventional Commits: `<type>(<scope>): <subject>`
- [ ] Body includes `## Problem Statement`
- [ ] Body includes `## Summary of Changes`
- [ ] Body includes `## Tests + Coverage`
- [ ] Body includes `## Docs Updates`
- [ ] Footer includes Claude Code attribution
- [ ] All commits follow Conventional Commits format
- [ ] Branch is up to date with base branch

## Success Criteria

PR is ready when:

- ✅ All CI checks pass (title validation, body validation, lint, test, build)
- ✅ No validation errors in `gh pr checks`
- ✅ PR description clearly communicates changes

## Resources

### References

See `references/semantic-pr-workflow.md` for the complete validation workflow specification from `.github/workflows/semantic-pr.yml`.
