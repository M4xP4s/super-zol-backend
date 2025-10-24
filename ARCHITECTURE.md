# Monorepo Architecture

This document explains the file structure, configuration patterns, and architectural decisions in this monorepo.

## Table of Contents

- [Component Structure](#component-structure)
- [TypeScript Configuration](#typescript-configuration)
- [Testing Setup](#testing-setup)
- [Version Management](#version-management)
- [Git Hooks and Linting](#git-hooks-and-linting)

## Component Structure

Each component (service, library, or job) follows a consistent, deterministic structure:

```
component-name/
├── src/                    # Source code
│   ├── main.ts            # Entry point (services/jobs)
│   ├── lib/               # Library code (libs only)
│   └── app/               # Application code (services)
├── tests/                  # Test files (separate from src)
│   └── *.test.ts          # Test files
├── project.json           # Nx project configuration
├── tsconfig.json          # TypeScript root config
├── tsconfig.app.json      # TypeScript app compilation (services/jobs)
├── tsconfig.lib.json      # TypeScript library compilation (libs)
├── vitest.config.ts       # Component-specific test config
├── eslint.config.js       # ESLint configuration
└── README.md              # Component documentation
```

### Why This Structure?

- **Separate `tests/` folder**: Keeps test code organized and separate from source code
- **Component-specific configs**: Each component can override root configurations as needed
- **Deterministic**: Generators create the same structure every time
- **Clear boundaries**: Easy to understand what belongs where

## TypeScript Configuration

The TypeScript configuration uses a layered approach:

### Root Level

#### `tsconfig.base.json`

The **single source of truth** for TypeScript settings across the entire monorepo:

```json
{
  "compilerOptions": {
    "strict": true, // Strict type checking
    "noUncheckedIndexedAccess": true, // Safety for array/object access
    "target": "ES2022", // Modern JavaScript
    "module": "ES2022", // ESM modules
    "moduleResolution": "node", // Node.js resolution
    "paths": {
      // Path aliases
      "@services/*": ["services/*/src"],
      "@libs/*": ["libs/*/src"],
      "@packages/*": ["packages/*/src"]
    }
  }
}
```

**Why it exists**: Centralizes all TypeScript compiler options to ensure consistency across the entire monorepo.

#### `tsconfig.json` (root)

References workspace projects:

```json
{
  "extends": "./tsconfig.base.json",
  "files": [],
  "references": [{ "path": "./services/api-gateway" }, { "path": "./libs/shared-util" }]
}
```

**Why it exists**: Enables TypeScript project references for faster incremental builds and better IDE support.

### Component Level

Each component has multiple TypeScript configs:

#### `tsconfig.json` (component)

The component's root configuration:

```json
{
  "extends": "../../tsconfig.base.json",
  "files": [],
  "references": [
    { "path": "./tsconfig.lib.json" } // or tsconfig.app.json
  ]
}
```

**Why it exists**: Acts as the entry point for the component's TypeScript setup and references specific compilation configs.

#### `tsconfig.lib.json` (for libraries)

Configuration for building libraries:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../dist/libs/my-lib",
    "declaration": true, // Generate .d.ts files
    "types": ["node"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["tests/**/*", "**/*.spec.ts", "**/*.test.ts"]
}
```

**Why it exists**: Libraries need to generate type declarations and have different build requirements than applications.

#### `tsconfig.app.json` (for services/jobs)

Configuration for building applications:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../dist/services/my-service",
    "types": ["node"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["tests/**/*", "**/*.spec.ts", "**/*.test.ts"]
}
```

**Why it exists**: Applications don't need to generate type declarations and may have different compilation settings.

### Why Multiple tsconfig Files?

1. **Separation of Concerns**: Different compilation targets (lib vs app) have different requirements
2. **Incremental Compilation**: TypeScript can compile only what changed
3. **Better IDE Support**: IDEs understand project boundaries and provide better autocomplete
4. **Type Safety**: Each component can be type-checked independently
5. **Nx Integration**: Nx uses these configs to understand project dependencies and enable caching

## Testing Setup

### Root Configuration

#### `vitest.config.ts` (root)

Shared test configuration for the entire monorepo:

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
```

**Why it exists**: Ensures consistent test behavior and coverage requirements across all components.

### Component Configuration

#### `vitest.config.ts` (component)

Each component extends the root config:

```typescript
import baseConfig from '../../vitest.config';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    coverage: {
      ...baseConfig.test?.coverage,
      include: ['src/**/*.ts'],
    },
  },
});
```

**Why it exists**: Components can:

- Override coverage thresholds if needed
- Specify custom test patterns
- Add component-specific test setup
- Keep test output directories separate

### Test Organization

Tests live in `tests/` folder separate from `src/`:

```
component/
├── src/
│   └── lib/
│       └── util.ts
└── tests/
    └── util.test.ts
```

**Benefits**:

- Clear separation between production and test code
- Easier to exclude tests from builds
- Simpler glob patterns for coverage
- Better organization for integration tests

## Version Management

### `.nvmrc` and `.node-version`

Both files specify Node.js version (e.g., `22`):

```
22
```

## Git Hooks and Linting

This monorepo uses **three git hooks** to enforce code quality at different stages:

### 1. Pre-Commit Hook (Code Style)

**File**: `.husky/pre-commit`

Runs **lint-staged** to check code style on staged files only:

```bash
pnpm exec lint-staged
```

**What it checks**: Code style and formatting (via `.lintstagedrc.json`)

**When it runs**: Before every commit

**What it prevents**: Poorly formatted or styled code from entering the repository

**Performance**: Fast (1-5 seconds) - only checks files you changed

#### `.lintstagedrc.json` Configuration

```json
{
  "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,yaml,yml}": ["prettier --write"]
}
```

**Why staged files only?**

- ⚡ **Performance**: Linting 5 files takes seconds, 100+ files takes minutes
- 🎯 **Focused**: Only see issues in your changes
- 📈 **Incremental**: Improves code quality gradually without requiring full codebase cleanup

### 2. Pre-Push Hook (Tests & Build)

**File**: `.husky/pre-push`

Runs comprehensive checks before pushing to remote:

```bash
#!/usr/bin/env sh
echo "🔍 Running pre-push checks..."

# Type checking
echo "📝 Type checking..."
pnpm exec tsc --noEmit

# Run affected tests
echo "🧪 Running tests on affected projects..."
pnpm nx affected -t test --base=origin/main --parallel=3

# Build affected projects
echo "🏗️  Building affected projects..."
pnpm nx affected -t build --base=origin/main --parallel=3

echo "✅ All pre-push checks passed!"
```

**What it checks**:

1. **Type safety** - No TypeScript errors (`tsc --noEmit`)
2. **Tests pass** - All affected tests pass
3. **Builds succeed** - All affected projects build successfully

**When it runs**: Before `git push`

**What it prevents**:

- ❌ Broken code from reaching the remote repository
- ❌ Type errors that would fail in CI
- ❌ Failing tests that would block deployments
- ❌ Build errors that would break production

**Performance**: Moderate (30-120 seconds) - only checks affected projects using Nx

**Why affected only?**

- If you changed `libs/shared-util`, Nx tests all projects that depend on it
- If you changed `services/api-gateway`, Nx only tests that service
- Much faster than testing everything every time

### 3. Commit Message Hook (Conventional Commits)

**File**: `.husky/commit-msg`

Enforces **Conventional Commits** format:

```bash
#!/usr/bin/env sh
# Format: type(scope?): subject
# Example: feat(api): add user authentication endpoint

if ! echo "$commit_msg" | grep -qE "^(feat|fix|docs|...)(\(.+\))?: .{3,}"; then
  echo "❌ Invalid commit message format!"
  echo "Use: <type>(<scope>): <subject>"
  exit 1
fi
```

**Valid commit types**:

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, semicolons, etc)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks
- `ci` - CI/CD changes
- `build` - Build system changes
- `perf` - Performance improvements

**Examples**:

```bash
✅ feat(api): add user authentication endpoint
✅ fix(worker): resolve memory leak in job processor
✅ docs: update README with setup instructions
✅ refactor(shared): simplify utility functions
✅ test(api): add integration tests for auth flow
❌ added some stuff
❌ fixed bug
❌ WIP
```

**When it runs**: Before commit is created (after pre-commit hook)

**What it prevents**:

- ❌ Unclear commit history
- ❌ Difficulty understanding what changed
- ❌ Problems generating changelogs
- ❌ Confusion when reviewing git history

**Benefits**:

- 📝 Clear, searchable commit history
- 🤖 Automatic changelog generation
- 🔍 Easy to find specific types of changes (`git log --grep "^feat"`)
- 📊 Better understanding of project evolution

## Skipping Hooks (Emergency Use Only)

**When you might need to skip hooks**:

- Emergency hotfix that needs to go out immediately
- Known issue that's being tracked but not blocking
- Temporary work-in-progress commit

**How to skip**:

```bash
# Skip pre-commit and commit-msg hooks
git commit --no-verify -m "WIP: debugging issue"

# Skip pre-push hook
git push --no-verify
```

⚠️ **Warning**: Use sparingly! Skipped hooks mean:

- Code quality checks were bypassed
- CI might fail
- Other developers might pull broken code

## Git Hooks Summary

| Hook         | When          | What It Checks                | Duration | Scope             |
| ------------ | ------------- | ----------------------------- | -------- | ----------------- |
| `pre-commit` | Before commit | Code style (ESLint, Prettier) | 1-5s     | Staged files only |
| `commit-msg` | Before commit | Commit message format         | <1s      | Commit message    |
| `pre-push`   | Before push   | Types, tests, builds          | 30-120s  | Affected projects |

**Philosophy**:

- **pre-commit**: Fast style checks on what you changed
- **commit-msg**: Ensure commit history is readable
- **pre-push**: Comprehensive checks before code reaches others

## Pull Request Checks

Two repository-level checks enforce PR hygiene:

- Semantic PR title: GitHub Action validates that the PR title follows Conventional Commits (e.g., `feat(api): add auth`).
- Template sections: GitHub Action ensures required sections exist in the PR body.

Files:

- `.github/PULL_REQUEST_TEMPLATE.md` — Standard template with required sections
- `.github/workflows/semantic-pr.yml` — CI workflow validating title and required sections

## File Organization Summary

```
backend/
├── .nvmrc & .node-version      # Version management (both needed for compatibility)
├── tsconfig.base.json          # Central TypeScript config
├── tsconfig.json               # Root TS project references
├── vitest.config.ts            # Root test config
├── .lintstagedrc.json          # Lint only changed files (performance)
├── .husky/                     # Git hooks
│   ├── pre-commit              # Code style (lint-staged)
│   ├── pre-push                # Tests + build (affected)
│   └── commit-msg              # Conventional commits format
├── scripts/                    # Generator and utility scripts
│   ├── gen-service.sh          # Service generator
│   ├── gen-lib.sh              # Library generator
│   └── gen-job.sh              # Job generator
├── services/                   # Deployable applications
│   └── my-service/
│       ├── src/               # Source code
│       ├── tests/             # Test files (separate)
│       ├── tsconfig.json      # Component root
│       ├── tsconfig.app.json  # App compilation settings
│       └── vitest.config.ts   # Component test config
├── libs/                       # Shared libraries
│   └── my-lib/
│       ├── src/               # Source code
│       ├── tests/             # Test files (separate)
│       ├── tsconfig.json      # Component root
│       ├── tsconfig.lib.json  # Library compilation settings
│       └── vitest.config.ts   # Component test config
└── jobs/                       # Scheduled tasks
    └── my-job/
        ├── src/               # Source code
        ├── tests/             # Test files (separate)
        ├── tsconfig.json      # Component root
        ├── tsconfig.app.json  # App compilation settings
        └── vitest.config.ts   # Component test config
```

## Key Principles

1. **DRY (Don't Repeat Yourself)**: Base configs are extended, not duplicated
2. **Convention over Configuration**: Consistent structure makes navigation easy
3. **Layered Configuration**: Root → Component → Specific (lib/app)
4. **Separation of Concerns**: Source, tests, and build artifacts are clearly separated
5. **Tool Compatibility**: Support multiple version managers and workflows
6. **Performance**: Incremental builds, selective linting, shared caching

## Questions?

- **Q: Why not put tests next to source files?**
  - A: Separate `tests/` folder keeps source clean, makes test exclusion simpler, and clearly separates concerns.

- **Q: Why both .nvmrc and .node-version?**
  - A: Different version managers support different files. Both ensures everyone uses the correct Node version.

- **Q: Why so many tsconfig files?**
  - A: Each serves a specific purpose: sharing base config, defining references, separating lib vs app compilation.

- **Q: Can I skip .lintstagedrc.json and just run linters on everything?**
  - A: You can, but it's slow. Linting 100+ files on every commit is painful. lint-staged keeps it fast.

- **Q: Why not use Jest instead of Vitest?**
  - A: Vitest is faster, has native ESM support, better TypeScript integration, and matches our Vite-based build system.
