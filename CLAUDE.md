# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Session Workflow

**IMPORTANT - Start Every Session:**

1. **Check TODO.md** - Review the current state of tasks, progress, and Definition of Done criteria
   - Understand what phase we're in
   - Identify completed tasks (✅) and pending tasks ([ ])
   - Note any blockers or dependencies
   - See what's next in the migration plan

2. **Before Planning Code Work** - Review TIME_SAVE.md for:
   - Available Claude Code plugins and skills that can accelerate work
   - MCP integrations (GitHub, etc.) for repo automation
   - Recommended workflows and commands for this monorepo
   - Time-saving patterns and optimization tips
   - Solo development strategies and batching techniques

3. **Review Past Phase Implementations** - Check `reviews/` directory for reference:
   - Read review documents from completed phases (e.g., `PHASE-2-REVIEW.md`)
   - Understand quality standards, patterns, and best practices
   - Learn from previous implementations and avoid repeated issues
   - Reference implementation on corresponding branch (e.g., `codex-p2` for Phase 2)

4. **After Completing Each Task** - Create a commit immediately:
   - Use Conventional Commits format: `type(scope): subject`
   - Keep commits atomic and focused on one logical change
   - **ALWAYS update TODO.md** when task state changes:
     - Mark tasks as completed ([x]) when done
     - Update phase completion status (add ✅ to phase titles)
     - Add notes about deviations from original plan
     - Keep TODO.md in sync with actual progress
   - **ALWAYS update CHANGELOG.md** with a concise entry for the change:
     - If `CHANGELOG.md` does not exist, create it
     - Prefer Keep a Changelog + SemVer style
     - Add entries under appropriate section (Added/Changed/Fixed/Security)
     - Be specific about what changed and why it matters
   - Push regularly to create backup points
   - Example: `feat(api): add user authentication endpoint`

**Why?** This ensures you have full context on project status and available tools before proposing solutions. Frequent commits create checkpoints, make it easier to track progress, and provide rollback points if needed.

## Quick Reference

For detailed command documentation, see [DEVELOPMENT.md](DEVELOPMENT.md).

### Essential Commands

```bash
# Quality Checks
just check              # Run all quality checks (lint + typecheck + test)
just test               # Run all tests
just test-watch <name>  # Run tests in watch mode for a specific project

# Development
just serve-api          # Start API gateway service
just infra-up           # Start Docker infrastructure

# Code Quality
just lint               # Lint all code
just typecheck          # Type check all TypeScript
just format             # Format all code

# Building
just build              # Build all projects
just build-prod         # Build for production

# Visualization
just graph              # View dependency graph in browser
```

### Quick Commit Workflow

For rapid iteration on main branch (solo development):

```bash
# Quick commit: format + commit + affected checks + push
./scripts/quick-commit.sh "feat(api): add health check"

# Without message (defaults to "chore(repo): quick commit")
./scripts/quick-commit.sh

# Non-conventional messages are auto-prefixed
./scripts/quick-commit.sh "update docs"  # → "chore(repo): update docs"
```

**When to use:** Fast iteration on main for solo development. For collaborative work or feature branches, use the standard git workflow or `just merge-to-main`.

See [CONTRIBUTING.md](CONTRIBUTING.md) for complete git workflow and commit guidelines.

### Automated PR Workflow

```bash
# Automated workflow: push, create PR, wait for CI, auto-merge, cleanup
just merge-to-main                    # Use current branch
just merge-to-main <branch-name>      # Specify branch
just merge-to-main-with squash <branch>  # Custom merge method
just merge-to-main-keep <branch>      # Keep local branch after merge
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for complete PR process and requirements.

## Architecture Overview

This is an **Nx-powered TypeScript monorepo** with strict typing, comprehensive testing, and deterministic structure.

### Monorepo Structure

```
backend/
├── services/       # Deployable Fastify services (kaggle-data-api)
├── libs/          # Shared internal libraries (shared-util)
├── jobs/          # Scheduled tasks/batch jobs (fetch-kaggle)
└── packages/      # Optional publishable packages
```

For detailed architecture information, see [ARCHITECTURE.md](ARCHITECTURE.md).

### Path Aliases (tsconfig.base.json)

All imports use path aliases defined in `tsconfig.base.json:19-26`:

```typescript
// Import from libraries
import { something } from '@libs/shared-util';
import { util } from 'shared-util'; // Also available

// Import from services (for testing/tooling only)
import { handler } from '@services/kaggle-data-api';
```

**Important**: Services should NOT import from other services. Only libs can be shared.

### Component Structure

Every service/lib/job follows this **deterministic structure**:

```
component-name/
├── src/               # Source code
│   ├── main.ts       # Entry point (services/jobs)
│   └── lib/          # Library code (libs)
├── tests/            # Tests separate from src (NOT src/**/*.test.ts)
│   └── *.test.ts
├── project.json      # Nx configuration
├── tsconfig.json     # Root TS config (extends base)
├── tsconfig.app.json # App compilation (services/jobs)
├── tsconfig.lib.json # Library compilation (libs)
└── vitest.config.ts  # Test configuration
```

**Why tests/ is separate**: Cleaner source, simpler build exclusion, easier coverage patterns.

For detailed TypeScript configuration layers and testing setup, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Key Principles

1. **Strict typing**: `strict: true` + `noUncheckedIndexedAccess: true`
2. **Deterministic structure**: Generators ensure consistency
3. **Separation of concerns**: Source, tests, and configs clearly separated
4. **Performance**: Nx caching, affected commands, lint-staged
5. **Quality gates**: Automated checks at commit and push
6. **Path aliases**: Always use `@libs/*`, `@services/*`, `@packages/*`
7. **Pure ESM**: Native ECMAScript Modules throughout
   - All imports use `.js` extensions (even for `.ts` sources)
   - Use `import.meta.url` instead of `__dirname`
   - Use `getDirname()` helper from `@libs/shared-util` for ESM-compatible directory resolution
   - No `require()` or `module.exports` in source code

## Common Patterns

### Creating a New Service

```bash
just gen-service my-service
# Creates: services/my-service with Fastify, tests/, configs
```

This generates:

- Fastify app with AutoLoad for plugins and routes
- Separate tests/ directory
- Full TypeScript configuration
- Vitest setup with 90% coverage
- ESLint configuration

### Creating a Shared Library

```bash
just gen-lib my-lib
# Creates: libs/my-lib with exports, tests/, configs
```

Then add to `tsconfig.base.json` paths for convenient imports:

```json
"my-lib": ["libs/my-lib/src/index.ts"]
```

### Adding a Route to a Service

Create a file in `services/<name>/src/app/routes/`:

```typescript
// services/kaggle-data-api/src/app/routes/users.ts
import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
  fastify.get('/users', async () => {
    return { users: [] };
  });
}
```

AutoLoad automatically registers it.

For more patterns and examples, see [DEVELOPMENT.md](DEVELOPMENT.md#common-patterns).

## Testing

### Test Configuration

- **Framework**: Vitest (faster than Jest, native ESM, better TS integration)
- **Coverage**: 90% threshold enforced (lines, functions, branches, statements)
- **Location**: All tests in `tests/` folder (NOT co-located with source)

### Running Tests

```bash
# All tests
just test

# Single project
pnpm nx test kaggle-data-api

# Watch mode
just test-watch kaggle-data-api

# Coverage
just test-coverage

# Affected tests only
pnpm nx affected -t test --base=origin/main
```

For detailed testing guidelines and best practices, see [CONTRIBUTING.md](CONTRIBUTING.md#testing-requirements).

## Code Reviews & Reference Implementations

### Review Process

Each completed phase should have a comprehensive code review document in the `reviews/` directory:

**Review Document Template:** `reviews/PHASE-{N}-REVIEW.md`

**Contents:**

- Executive summary with merge verdict
- Quality metrics (coverage, test results, build status)
- Detailed analysis of all modules/changes
- Test quality assessment
- Security and performance analysis
- Definition of Done verification
- Issue classification (critical/minor)
- Recommendations for future phases

**When to Create Reviews:**

- After completing each major phase
- Before merging phase branch to main
- When establishing new patterns or standards
- For complex implementations that serve as references

### Reference Implementations

**Phase 2 (Utility Functions) - Branch: `codex-p2`**

- **Review**: [reviews/PHASE-2-REVIEW.md](reviews/PHASE-2-REVIEW.md)
- **Branch**: `codex-p2` (reference implementation)
- **Demonstrates**:
  - TDD methodology (RED-GREEN-REFACTOR)
  - 100% statement coverage, >90% branch coverage
  - Comprehensive test suites with edge cases
  - Proper TypeScript strict mode usage
  - Atomic commits with Conventional Commits format
  - Streaming implementations for large files
  - Proper async/await patterns
  - Mock strategies for testing (console output capture)
  - Temporary file handling in tests with cleanup

**How to Use Reference Implementations:**

1. Check out the reference branch: `git checkout codex-p2`
2. Review the code structure and patterns
3. Read test files to understand testing approach
4. Note commit history for workflow examples
5. Return to your working branch: `git checkout <your-branch>`

**Quality Standards from Phase 2:**

- ✅ 100% statement coverage
- ✅ ≥90% branch coverage
- ✅ Zero `any` types in implementation code
- ✅ All edge cases tested (empty, missing, malformed, large files)
- ✅ Proper error handling (try-catch or null returns)
- ✅ Streaming for large file operations
- ✅ Atomic commits with clear messages
- ✅ All DoD criteria verified before merge

## Documentation Resources

### For Development

- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Complete command reference, workflows, debugging tips, and troubleshooting
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Git workflow, commit conventions, PR process, code quality standards
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical deep-dive: tsconfig layers, testing setup, git hooks philosophy

### For Project Context

- **[README.md](README.md)** - Project overview, quick start, and navigation hub
- **[TODO.md](TODO.md)** - Current roadmap, completed work, upcoming epics
- **[CHANGELOG.md](CHANGELOG.md)** - Detailed change history

### For AI Agents

- **[AGENTS.md](AGENTS.md)** - Concise guidelines for AI agents working with this codebase

## Stack & Tools

- **Runtime**: Node.js 22 (enforced via .nvmrc and .node-version)
- **Package Manager**: pnpm 10 (enforced via packageManager field)
- **Build System**: Nx 19.8 with esbuild (services) and tsc (libs)
- **Language**: TypeScript 5.6 with strict mode + noUncheckedIndexedAccess
- **Testing**: Vitest with 90% coverage requirement
- **Linting**: ESLint 9 (flat config) + TypeScript ESLint
- **Formatting**: Prettier
- **API Framework**: Fastify 4 with autoload, sensible defaults

## CI/CD

```bash
just ci  # Runs affected lint, test, and build

# Manual CI pipeline
pnpm install --frozen-lockfile
pnpm nx affected -t lint --base=origin/main
pnpm nx affected -t test --base=origin/main --coverage
pnpm nx affected -t build --base=origin/main
```

For complete CI/CD setup and troubleshooting, see [DEVELOPMENT.md](DEVELOPMENT.md).
