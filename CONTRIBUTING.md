# Contributing to Super Zol Backend

Thank you for contributing! This guide will help you understand our development workflow and quality standards.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Code Quality Standards](#code-quality-standards)
- [Testing Requirements](#testing-requirements)

## Getting Started

Before you start contributing:

1. **Read the documentation**:
   - [README.md](README.md) - Project overview and quick start
   - [ARCHITECTURE.md](ARCHITECTURE.md) - Technical architecture deep-dive
   - [DEVELOPMENT.md](DEVELOPMENT.md) - Detailed development commands and workflows

2. **Set up your environment**:

   ```bash
   # Install dependencies
   pnpm install

   # Copy environment variables
   cp .env.example .env

   # Start local infrastructure (optional)
   just infra-up
   ```

3. **Verify your setup**:
   ```bash
   # Run all quality checks
   just check
   ```

## Development Workflow

We support two workflows depending on your use case:

### Solo Development (Main Branch)

For rapid iteration and small changes:

```bash
# Make your changes
# ...

# Quick commit: format + commit + check + push
./scripts/quick-commit.sh "feat(api): add health check"
```

**What it does automatically**:

1. Syncs with remote main
2. Formats code
3. Stages all changes
4. Creates commit with proper format
5. Runs affected lint, test, and build
6. Pushes to main

**When to use**: Solo work, small changes, rapid iteration

### Feature Branch Workflow (Collaborative)

For larger features and collaborative work:

```bash
# Create feature branch
git checkout -b feat/my-feature

# Make your changes and commit
git add .
git commit -m "feat(api): add authentication"

# Automated PR workflow
just merge-to-main
```

**What it does automatically**:

1. Pushes branch upstream
2. Creates PR with proper format
3. Waits for CI checks (polls every 10s, max 10 min)
4. Auto-merges when green
5. Switches to main and pulls
6. Deletes feature branch
7. Cleans up stale branches

**When to use**: Collaborative work, large features, code review needed

## Commit Guidelines

We enforce [Conventional Commits](https://www.conventionalcommits.org/) format via git hooks.

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring (no functional changes)
- **test**: Adding or updating tests
- **chore**: Maintenance tasks (dependencies, config, etc.)
- **ci**: CI/CD changes
- **build**: Build system changes
- **perf**: Performance improvements

### Examples

```bash
✅ Good commits:
feat(api): add user authentication endpoint
fix(worker): resolve memory leak in job processor
docs(readme): update installation instructions
test(shared-util): add edge case tests for parser
refactor(api): simplify route handlers

❌ Bad commits:
added stuff
fixed bug
WIP
update
```

### Scope Guidelines

- **api**: API Gateway service
- **worker**: Worker service
- **shared-util**: Shared utilities library
- **fetch-kaggle**: Kaggle fetch job
- **repo**: Repository-wide changes (config, tooling)
- **ci**: CI/CD pipelines

### Tips

- Keep subjects under 72 characters
- Use imperative mood ("add" not "added" or "adds")
- Don't end subject with a period
- Capitalize first letter of subject
- Reference issues in footer: `Closes #123`

## Pull Request Process

### 1. Before Creating PR

- [ ] All tests pass locally (`just test`)
- [ ] Code is formatted (`just format`)
- [ ] Linting passes (`just lint`)
- [ ] Type checking passes (`just typecheck`)
- [ ] Build succeeds (`just build`)

Or simply run: `just check`

### 2. PR Title

Must follow Conventional Commits format:

```
feat(api): add user authentication
fix(worker): resolve memory leak
docs: update README
```

### 3. PR Description

Use the provided template (`.github/PULL_REQUEST_TEMPLATE.md`):

**Required sections**:

- **Problem Statement**: What issue does this solve?
- **Summary of Changes**: What did you change?
- **Tests + Coverage**: What tests did you add?
- **Docs Updates**: What documentation changed?

**Optional sections**:

- Related issues (use `Closes #123`)
- Breaking changes
- Migration guide
- Screenshots/recordings

### 4. CI Requirements

All PRs must pass:

- ✅ Semantic PR title validation
- ✅ Required sections in PR body
- ✅ ESLint checks
- ✅ TypeScript type checks
- ✅ All tests pass (90% coverage minimum)
- ✅ All affected projects build successfully

### 5. Code Review

- Address all review comments
- Keep discussions focused and professional
- Update PR description if scope changes
- Squash fixup commits before merge

### 6. Merge

Use the automated workflow:

```bash
just merge-to-main
```

Or manually via GitHub UI (squash and merge).

## Code Quality Standards

### TypeScript

- **Strict mode enabled**: No implicit `any`, proper null checks
- **No `any` types**: Use `unknown` and type guards instead
- **Explicit return types**: All functions must declare return types
- **No non-null assertions**: Use optional chaining or type guards

### Testing

- **Framework**: Vitest (not Jest)
- **Coverage**: 90% minimum (lines, functions, branches, statements)
- **Location**: `tests/` directory (not co-located with source)
- **Organization**: Unit tests for logic, integration tests for APIs

### File Organization

- **Source code**: `src/` directory
- **Tests**: `tests/` directory (separate from source)
- **Naming**:
  - Files/directories: `kebab-case`
  - Variables/functions: `camelCase`
  - Types/interfaces: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`

### Module Boundaries

- ✅ Services can import from `libs/`
- ✅ Libraries can import from other `libs/`
- ❌ Services cannot import from other services
- ❌ No circular dependencies

## Testing Requirements

### Coverage Thresholds

All projects must maintain:

- Lines: ≥90%
- Functions: ≥90%
- Branches: ≥90%
- Statements: ≥90%

### Test Organization

```
tests/
├── unit/           # Unit tests (business logic)
├── integration/    # Integration tests (APIs, databases)
└── e2e/            # End-to-end tests (user flows)
```

### Writing Good Tests

1. **Arrange-Act-Assert pattern**:

   ```typescript
   test('should return user by ID', async () => {
     // Arrange
     const userId = '123';
     const mockUser = { id: userId, name: 'Test' };

     // Act
     const result = await getUserById(userId);

     // Assert
     expect(result).toEqual(mockUser);
   });
   ```

2. **Test edge cases**:
   - Empty inputs
   - Null/undefined values
   - Large datasets
   - Error conditions

3. **Use descriptive test names**:

   ```typescript
   // ✅ Good
   test('should throw error when user ID is empty');

   // ❌ Bad
   test('user test');
   ```

4. **Avoid test interdependence**:
   - Each test should be independent
   - Use `beforeEach` for setup
   - Clean up in `afterEach`

## Git Hooks

Three automated quality gates:

### 1. Pre-Commit (1-5 seconds)

- Runs ESLint and Prettier on staged files
- Fast because it only checks changed files

### 2. Pre-Push (30-120 seconds)

- TypeScript type checking
- Tests on affected projects
- Builds on affected projects

### 3. Commit-Msg (<1 second)

- Validates Conventional Commits format

### Skipping Hooks (Emergency Only)

```bash
# Skip all commit hooks
git commit --no-verify -m "emergency: fix production issue"

# Skip pre-push hook
git push --no-verify
```

⚠️ **Use sparingly!** Skipped hooks may result in CI failures.

## Getting Help

- **Questions?** Open a discussion on GitHub
- **Bug found?** Open an issue with reproduction steps
- **Need clarification?** Ask in PR comments or discussions

## Additional Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Vitest Documentation](https://vitest.dev/)
- [Nx Documentation](https://nx.dev)

---

Thank you for contributing! 🎉
