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

## Essential Commands

### Development Workflow

```bash
# Using Just (recommended - faster to type)
just check              # Run all quality checks (lint + typecheck + test)
just test               # Run all tests
just test-watch <name>  # Run tests in watch mode for a specific project
just lint               # Lint all code
just typecheck          # Type check all TypeScript
just build              # Build all projects
just format             # Format all code

# Using pnpm/nx directly
pnpm nx test <project>              # Run tests for specific project
pnpm nx test <project> --watch      # Watch mode for specific project
pnpm nx serve <project>             # Start a service
pnpm nx build <project>             # Build specific project
pnpm nx show project <project>      # Show project details and dependencies
pnpm nx affected -t test --base=origin/main  # Test only affected projects
```

### Generator Commands

```bash
# Generate new components (uses deterministic structure)
just gen-service <name>   # Creates services/<name> with Fastify setup
just gen-lib <name>       # Creates libs/<name> for shared code
just gen-job <name>       # Creates jobs/<name> for scheduled tasks
```

### Development Environment

```bash
just dev-setup      # Complete setup: install + docker up + .env
just infra-up       # Start Docker infrastructure
just infra-down     # Stop Docker infrastructure
just serve-api      # Start API gateway service
just serve-worker   # Start worker service
```

### Automated PR Workflow

```bash
# Automated workflow: push, create PR, wait for CI, auto-merge, cleanup
just merge-to-main                    # Use current branch
just merge-to-main <branch-name>      # Specify branch
just merge-to-main-with squash <branch>  # Custom merge method
just merge-to-main-keep <branch>      # Keep local branch after merge

# What it does:
# 1. Pushes branch upstream (with -u if needed)
# 2. Creates PR with proper Conventional Commits format
# 3. Waits for CI checks to pass (polls every 10s, max 10min)
# 4. Auto-merges when all checks are green
# 5. Switches to main, pulls latest, deletes feature branch
# 6. Cleans up stale remote tracking branches
```

## Architecture Overview

This is an **Nx-powered TypeScript monorepo** with strict typing, comprehensive testing, and deterministic structure.

### Monorepo Structure

```
backend/
├── services/       # Deployable Fastify services (api-gateway, worker)
├── libs/          # Shared internal libraries (shared-util)
├── jobs/          # Scheduled tasks/batch jobs
└── packages/      # Optional publishable packages
```

### Path Aliases (tsconfig.base.json)

All imports use path aliases defined in `tsconfig.base.json:19-26`:

```typescript
// Import from libraries
import { something } from '@libs/shared-util';
import { util } from 'shared-util'; // Also available

// Import from services (for testing/tooling only)
import { handler } from '@services/api-gateway';
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

### TypeScript Configuration Layers

1. **`tsconfig.base.json`** (root): Single source of truth for compiler options, path aliases
2. **`tsconfig.json`** (component): Extends base, defines project references
3. **`tsconfig.app.json`** or **`tsconfig.lib.json`**: Compilation settings for apps vs libraries

**Why multiple configs?**: Enables incremental builds, separate compilation targets, better IDE support.

### Fastify Service Structure

Services use Fastify with autoloading:

- **`src/main.ts`**: Entry point
- **`src/app/app.ts`**: Fastify app setup with AutoLoad
- **`src/app/plugins/`**: Reusable Fastify plugins (auto-loaded)
- **`src/app/routes/`**: Route handlers (auto-loaded)

AutoLoad automatically registers all plugins and routes from their respective directories.

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
pnpm nx test api-gateway

# Watch mode
just test-watch api-gateway

# Coverage
just test-coverage

# Affected tests only
pnpm nx affected -t test --base=origin/main
```

## Git Hooks (Automatic Quality Gates)

Three hooks enforce quality at different stages:

### 1. Pre-Commit (1-5 seconds)

- **What**: ESLint + Prettier on staged files only
- **Tool**: lint-staged for performance
- **Scope**: Only files you changed

### 2. Pre-Push (30-120 seconds)

- **What**: TypeScript check + Tests + Builds
- **Scope**: Affected projects only (via Nx)
- **Purpose**: Prevent broken code from reaching remote

### 3. Commit-Msg (<1 second)

- **What**: Enforces Conventional Commits format
- **Format**: `type(scope): subject`
- **Valid types**: feat, fix, docs, style, refactor, test, chore, ci, build, perf

**Examples**:

```bash
✅ feat(api): add user authentication
✅ fix(worker): resolve memory leak
✅ test(shared-util): add unit tests
❌ added stuff
❌ WIP
```

**Skip hooks** (emergency only):

```bash
git commit --no-verify  # Skip pre-commit + commit-msg
git push --no-verify    # Skip pre-push
```

## Nx Features

### Dependency Graph

```bash
just graph              # Visual graph in browser
pnpm nx graph          # Same as above
pnpm nx show project api-gateway  # Show dependencies for project
```

### Affected Commands (CI Performance)

Nx tracks what changed and only runs tasks on affected projects:

```bash
pnpm nx affected -t test --base=origin/main   # Test only affected
pnpm nx affected -t build --base=origin/main  # Build only affected
pnpm nx affected -t lint --base=origin/main   # Lint only affected
```

### Caching

Nx caches test/build/lint results. To reset:

```bash
pnpm nx reset
# or
just clean
```

## Stack & Tools

- **Runtime**: Node.js 22 (enforced via .nvmrc and .node-version)
- **Package Manager**: pnpm 10 (enforced via packageManager field)
- **Build System**: Nx 19.8 with esbuild (services) and tsc (libs)
- **Language**: TypeScript 5.6 with strict mode + noUncheckedIndexedAccess
- **Testing**: Vitest with 90% coverage requirement
- **Linting**: ESLint 9 (flat config) + TypeScript ESLint
- **Formatting**: Prettier
- **API Framework**: Fastify 4 with autoload, sensible defaults

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
// services/api-gateway/src/app/routes/users.ts
import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
  fastify.get('/users', async () => {
    return { users: [] };
  });
}
```

AutoLoad automatically registers it.

### Importing Shared Code

```typescript
// From a library
import { myUtil } from '@libs/shared-util';
import { myUtil } from 'shared-util'; // If alias configured

// Services should NOT import from other services
// ❌ import { something } from '@services/api-gateway';
```

## Environment & Configuration

- **Environment files**: `.env.example` provided, copy to `.env`
- **Docker**: `docker-compose.yml` for local infrastructure
- **Node version**: Managed via `.nvmrc` and `.node-version` (both point to Node 22)

## Documentation

- **Architecture deep-dive**: `ARCHITECTURE.md` - explains tsconfig layers, why separate tests/, git hooks philosophy
- **README**: `README.md` - full project documentation with all commands

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

## CI/CD

```bash
just ci  # Runs affected lint, test, and build

# Manual CI pipeline
pnpm install --frozen-lockfile
pnpm nx affected -t lint --base=origin/main
pnpm nx affected -t test --base=origin/main --coverage
pnpm nx affected -t build --base=origin/main
```
