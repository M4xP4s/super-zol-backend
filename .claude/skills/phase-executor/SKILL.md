---
name: phase-executor
description: Automates end-to-end execution of phases from TODO.md including implementation, code review, PR creation, and CI monitoring until all checks pass. Use when user requests to "run Phase X", "execute Phase X", or "complete Phase X from TODO.md".
---

# Phase Executor

## Overview

Automates the complete workflow for executing project phases defined in TODO.md. Takes a phase from planning to production-ready PR with all CI checks passing, following best practices for implementation, testing, documentation, and code review.

## When to Use This Skill

Activate this skill when the user requests:

- "Run Phase X from TODO.md"
- "Execute Phase X"
- "Complete Phase X end-to-end"
- "Implement Phase X"
- Any variation asking to complete a phase from TODO.md

## Workflow

### 1. Phase Discovery & Planning

**Read TODO.md to understand the phase:**

```bash
# Read the entire TODO.md file
Read TODO.md

# Identify the phase section (e.g., "## Phase 1: Service Chart Templates")
# Extract all tasks, deliverables, and testing requirements
# Note the Definition of Done criteria
```

**Create implementation plan:**

- List all steps within the phase (e.g., Step 1.1, Step 1.2, etc.)
- Identify dependencies and order of execution
- Note files that need to be created/modified
- Plan documentation updates (TODO.md, CHANGELOG.md)

**Use TodoWrite tool to track progress:**

```javascript
TodoWrite({
  todos: [
    { content: 'Step X.1: Task description', activeForm: 'Doing Step X.1', status: 'pending' },
    { content: 'Step X.2: Task description', activeForm: 'Doing Step X.2', status: 'pending' },
    // ... all tasks
    {
      content: 'Update TODO.md and CHANGELOG.md',
      activeForm: 'Updating documentation',
      status: 'pending',
    },
    { content: 'Create PR', activeForm: 'Creating PR', status: 'pending' },
  ],
});
```

### 2. Branch Creation

**Branch naming convention:**

- Format: `<project-prefix>-p<phase-number>`
- Examples: `keg-api-p1`, `keg-api-p2`, `infra-p3`
- Use project context to determine prefix

**Create and switch to branch:**

```bash
git checkout -b <branch-name>
```

### 3. Implementation

**For each step in the phase:**

1. **Mark task as in_progress** using TodoWrite
2. **Implement the task:**
   - Create/modify files as specified
   - Follow existing patterns and architecture
   - Use path aliases from tsconfig.base.json
   - Maintain strict TypeScript typing
   - Follow ESM conventions (`.js` extensions in imports)

3. **Test the implementation:**
   - Run affected tests: `pnpm nx affected -t test`
   - Run linting: `pnpm nx affected -t lint`
   - Run type checking if applicable
   - Verify builds: `pnpm nx affected -t build`

4. **Commit immediately after completing each logical unit:**

   ```bash
   git add -A
   git commit -m "type(scope): description

   Detailed explanation of changes.

   Addresses Step X.Y of Phase X."
   ```

   Commit types:
   - `feat`: New features
   - `fix`: Bug fixes
   - `refactor`: Code refactoring
   - `docs`: Documentation only
   - `test`: Test additions/changes
   - `chore`: Maintenance tasks

5. **Mark task as completed** using TodoWrite

6. **Move to next task**

### 4. Documentation Updates

**Update TODO.md:**

- Mark completed tasks with `[x]`
- Update phase status to `[✅] Completed` when done
- Add any notes about deviations from plan
- Document new deliverables

**Update CHANGELOG.md:**

- Add entry under `## [Unreleased]` section
- Use appropriate category: Added/Changed/Fixed/Security
- Provide specific details about changes
- List deliverables and impacts
- Example:

  ```markdown
  ### Added

  - **Phase X: Description** - Complete implementation of...
    - Feature 1 with details
    - Feature 2 with details
    - Quality improvements and testing
  ```

**Commit documentation updates:**

```bash
git add TODO.md CHANGELOG.md
git commit -m "docs: update TODO.md and CHANGELOG.md for Phase X completion"
```

### 5. Code Review (Self-Review)

**Run comprehensive code review using specialized agents:**

Use the Task tool to launch code review agents in parallel:

```javascript
Task({
  subagent_type: 'code-review-ai:architect-review',
  prompt:
    'Review all changes on branch <branch-name> compared to main. Analyze architecture, patterns, security, and provide detailed feedback with severity ratings (P0/P1/P2).',
  description: 'Architecture code review',
});

Task({
  subagent_type: 'project-health-auditor:reviewer',
  prompt:
    'Review code health metrics for changes on branch <branch-name>. Focus on: test coverage, code duplication, complexity, maintainability. Provide specific improvement suggestions.',
  description: 'Code health review',
});
```

**Address review findings:**

For each finding:

1. **Assess severity:**
   - P0 (Critical): Must fix before PR
   - P1 (High): Should fix before PR
   - P2 (Nice-to-have): Can defer to future phases

2. **Implement fixes for P0 and P1 findings:**
   - Create focused commits for each fix
   - Update TodoWrite with fix tasks
   - Example fixes from Phase 0:
     - Code duplication → Extract to common library
     - Test coverage → Add schema validation + idempotent tests
     - Configuration management → Centralize in config file

3. **Document improvements in TODO.md and CHANGELOG.md**

4. **Commit fixes:**

   ```bash
   git add -A
   git commit -m "fix(scope): address P1 review finding

   - Specific change made
   - Why it was needed
   - Impact of the change

   Addresses code review finding on [issue]."
   ```

### 6. Push Branch

```bash
git push origin <branch-name>
```

### 7. Create Pull Request

**PR Requirements (MUST include all these sections):**

1. **Title:** Conventional Commits format
   - `feat(scope): Phase X - Description`
   - Example: `feat(infra): Phase 0 - Infrastructure Foundation`

2. **Required PR Body Sections:**

```markdown
## Problem Statement

[Explain why this phase was needed, what problem it solves]

## Summary of Changes

### [Major Component 1]

- Deliverable 1 with details
- Deliverable 2 with details

### [Major Component 2]

- Deliverable 1 with details

### Code Quality Improvements

[If applicable, describe code review improvements]

## Tests + Coverage

**Manual Testing Completed:**

- [x] Test 1 description
- [x] Test 2 description

**Test Results:**
```

[Paste test output if applicable]

```

**Automated Testing:**

- ✅ TypeScript type checking
- ✅ ESLint validation
- ✅ Prettier formatting
- ✅ Affected tests passing
- ✅ Affected builds passing

## Docs Updates

**New Documentation:**

- `path/to/new/doc.md` - Description
- `path/to/another/doc.md` - Description

**Updated Documentation:**

- `TODO.md` - Marked Phase X as completed
- `CHANGELOG.md` - Added comprehensive Phase X entry

**Documentation Metrics:**
- New documentation: ~X lines across Y files
- README files: Z new files

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Create the PR:**

```bash
gh pr create \
  --base main \
  --head <branch-name> \
  --title "feat(scope): Phase X - Description" \
  --body "$(cat <<'EOF'
[Full PR body from template above]
EOF
)"
```

### 8. CI Monitoring & Iteration

**Check CI status:**

```bash
gh pr view <PR-number> --json statusCheckRollup
```

**Expected checks:**

- `lint`: Code linting
- `test`: Unit tests
- `build`: Build process
- `Validate PR title (Conventional Commits)`: Title format
- `Validate PR body has required sections`: Body format

**If checks fail:**

1. **Review failure details:**

   ```bash
   gh pr checks <PR-number>
   gh run view <run-id> --log
   ```

2. **Fix the issue:**
   - For lint failures: Fix code style issues
   - For test failures: Fix broken tests
   - For build failures: Fix compilation errors
   - For PR validation: Update PR title/body with correct format

3. **Commit and push fix:**

   ```bash
   git add -A
   git commit -m "fix(ci): address CI check failure

   - Specific fix applied
   - Root cause of failure

   Fixes CI check: [check name]"
   git push origin <branch-name>
   ```

4. **Wait for checks to re-run** and repeat until all pass

**Handle PR body validation failures:**

The PR body MUST include these exact headings:

- `## Problem Statement`
- `## Summary of Changes`
- `## Tests + Coverage`
- `## Docs Updates`

If validation fails, update the PR body:

```bash
gh pr edit <PR-number> --body "$(cat <<'EOF'
[Corrected PR body with all required sections]
EOF
)"
```

### 9. Review Comments Response

**If reviewers provide feedback:**

1. **Read review comments carefully**
2. **Categorize by severity** (P0/P1/P2)
3. **Implement fixes:**
   - Address all P0 issues immediately
   - Address P1 issues before merge
   - Acknowledge P2 issues (can defer)

4. **Example from Phase 0 - P1 Review Comment:**

   > "Preserve shell state when sourcing versions - load-versions.sh uses `set -euo pipefail` and `exit 1` which mutates caller's shell and terminates interactive shells."

   **Fix:**
   - Remove `set -euo pipefail` (caller's responsibility)
   - Change `exit 1` to `return 1`
   - Add documentation explaining sourcing behavior
   - Add interactive shell usage examples

   **Commit:**

   ```bash
   git commit -m "fix(infra): preserve shell state when sourcing load-versions.sh

   BREAKING FIX: load-versions.sh is designed to be sourced but was
   using set -euo pipefail and exit 1, which would:
   - Mutate the caller's shell options
   - Terminate interactive shells on error

   Changes:
   - Remove set -euo pipefail (caller's responsibility)
   - Change exit 1 to return 1 (preserve shell session)
   - Add documentation clarifying sourcing behavior

   Addresses P1 review comment."
   ```

5. **Push and verify CI passes**

### 10. Definition of Done

**Verify all criteria met before considering phase complete:**

✅ All phase steps implemented and tested
✅ All code committed with Conventional Commits format
✅ TODO.md updated with completed tasks
✅ CHANGELOG.md updated with comprehensive entry
✅ Code review conducted and P0/P1 findings addressed
✅ PR created with all required sections
✅ All CI checks passing (lint, test, build, PR validation)
✅ No open review comments with P0/P1 severity
✅ Branch pushed to remote
✅ PR ready for merge

## Best Practices

### Commit Hygiene

- **Commit frequently:** After each logical unit of work
- **Atomic commits:** One conceptual change per commit
- **Descriptive messages:** Explain what and why
- **Reference context:** Mention step numbers, issues, review findings

### Error Handling

- **Pre-commit hooks:** Will run automatically, fix any issues
- **Pre-push hooks:** Run affected tests/builds, must pass
- **CI failures:** Address immediately, don't accumulate technical debt

### Documentation

- **Update as you go:** Don't save documentation for the end
- **Be specific:** List actual files, line counts, features
- **Include examples:** Show usage, commands, outputs
- **Document deviations:** Note any changes from original plan

### Code Review Integration

- **Run reviews early:** Before PR creation when possible
- **Address findings systematically:** Prioritize by severity
- **Document improvements:** Track before/after metrics
- **Commit fixes separately:** One fix per commit for clarity

## Common Patterns

### Multi-Step Phases

For phases with multiple steps (e.g., Phase 1 with Steps 1.1, 1.2, 1.3):

1. Complete Step 1.1 fully (implement + test + commit)
2. Complete Step 1.2 fully (implement + test + commit)
3. Complete Step 1.3 fully (implement + test + commit)
4. Update documentation (TODO.md + CHANGELOG.md + commit)
5. Run code review
6. Address findings
7. Create PR

### Infrastructure Phases

For infrastructure setup (Helm charts, Kubernetes, scripts):

- **Lint after each chart:** `helm lint path/to/chart`
- **Test locally:** Deploy to kind cluster if applicable
- **Validate configuration:** Check YAML syntax, schema compliance
- **Integration tests:** Create/update tests in `infrastructure/local-env/tests/`

### Service/Library Phases

For TypeScript services or libraries:

- **Type check continuously:** `pnpm nx affected -t lint`
- **Run tests in watch mode:** During development
- **Build before committing:** Ensure no compilation errors
- **Update exports:** Add to index.ts if library

## Troubleshooting

### "PR body validation failed"

**Issue:** Missing required sections in PR body

**Fix:** Ensure PR body includes ALL these exact headings:

- `## Problem Statement`
- `## Summary of Changes`
- `## Tests + Coverage`
- `## Docs Updates`

Update PR:

```bash
gh pr edit <PR-number> --body "$(cat <<'EOF'
[Fixed PR body]
EOF
)"
```

### "Pre-commit hooks failing"

**Issue:** Code doesn't meet formatting/linting standards

**Fix:**

```bash
# Format code
pnpm nx format:write

# Fix lint issues
pnpm nx affected -t lint --fix

# Commit again
git add -A
git commit -m "fix(lint): address linting issues"
```

### "Tests failing in CI but passing locally"

**Issue:** Environment differences or stale cache

**Fix:**

```bash
# Clear Nx cache
pnpm nx reset

# Run tests with coverage
pnpm nx affected -t test --coverage

# Verify build
pnpm nx affected -t build
```

### "Merge conflicts with main"

**Issue:** Main branch has diverged

**Fix:**

```bash
# Fetch latest main
git fetch origin main

# Rebase on main
git rebase origin/main

# Resolve conflicts
# ... fix conflicts ...
git add .
git rebase --continue

# Force push (with caution)
git push origin <branch-name> --force-with-lease
```

## Examples

### Example 1: Running Phase 1

**User:** "Run Phase 1 from TODO.md"

**Workflow:**

1. Read TODO.md, found "Phase 1: Service Chart Templates"
2. Identified 3 steps: 1.1 (Generator), 1.2 (Job Generator), 1.3 (Update fetch-kaggle)
3. Created branch `keg-api-p1`
4. Implemented Step 1.1:
   - Created `scripts/new-service-chart.sh`
   - Made executable
   - Tested generator
   - Committed: `feat(scripts): add service chart generator`
5. Implemented Steps 1.2 and 1.3 similarly
6. Updated TODO.md marking all tasks complete
7. Updated CHANGELOG.md with Phase 1 deliverables
8. Ran code review (found 2 P1 issues)
9. Fixed issues and committed
10. Pushed branch
11. Created PR with all required sections
12. All CI checks passed ✅
13. Phase 1 complete!

### Example 2: Handling Review Comments

**User:** "Run Phase 2"

**During execution:**

- PR created successfully
- Reviewer commented: "P1: Shell script uses `exit` instead of `return` when sourced"

**Response:**

1. Read review comment
2. Identified issue in `load-versions.sh`
3. Fixed: Changed `exit 1` to `return 1`
4. Added documentation about sourcing behavior
5. Committed: `fix(scripts): preserve shell state when sourcing`
6. Pushed fix
7. CI re-ran and passed
8. Reviewer approved ✅

## Success Criteria

A phase is successfully completed when:

✅ **Implementation Complete**

- All tasks in TODO.md implemented
- All deliverables created
- All tests passing

✅ **Quality Verified**

- Code review conducted
- P0/P1 findings addressed
- Code meets project standards

✅ **Documentation Updated**

- TODO.md reflects completion
- CHANGELOG.md includes comprehensive entry
- New READMEs created where needed

✅ **CI Passing**

- All automated checks green
- PR validation passed
- No blocking review comments

✅ **Ready for Merge**

- PR created with proper format
- All required sections included
- Mergeable status confirmed
