# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Session Workflow

**IMPORTANT - Start Every Session:**

1. **Check TODO.md** - Review the current state of tasks, progress, and Definition of Done criteria
   - Understand what phase we're in
   - Identify completed tasks (✅) and pending tasks ([ ])
   - Note any blockers or dependencies
   - See what's next in the migration plan

2. **Before Planning Code Work** - Review TIME_SAVE.md and skills for:
   - Available Claude Code plugins and skills that can accelerate work
   - **phase-executor skill** - Use for implementing phases from TODO.md
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
// services/kaggle-data-api/src/app/routes/example.ts
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

### Integration Test Best Practices

**CRITICAL: Integration tests MUST work without external dependencies**

Tests that require external services (databases, APIs) must:

1. **Check availability and skip gracefully:**

   ```typescript
   let databaseAvailable = false;

   beforeAll(async () => {
     try {
       await testConnection();
       databaseAvailable = true;
     } catch (error) {
       console.warn('⚠️  Database unavailable. Tests will be skipped.');
       databaseAvailable = false;
     }
   });

   it('test with DB', () => {
     if (!databaseAvailable) return; // Runtime skip
     // Test implementation
   });
   ```

2. **Use correct import extensions:**
   - Static imports: Use `.js` extension
   - Dynamic imports in tests: Use `.ts` extension

3. **Test CI compatibility before committing:**
   ```bash
   # Without external services (as CI would run)
   pnpm nx affected -t test
   # ✅ All tests should PASS or SKIP (not FAIL)
   ```

For detailed testing guidelines and best practices, see [CONTRIBUTING.md](CONTRIBUTING.md#testing-requirements).

**Common mistakes and prevention:** See `.claude/skills/phase-executor/SKILL.md` section "Common Mistakes to Avoid"

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

## Using with Cursor IDE

Cursor IDE automatically reads `.cursorrules` at the workspace root for real-time coding assistance. This section explains how Cursor integrates with this project's workflows.

### How `.cursorrules` and `CLAUDE.md` Work Together

- **`.cursorrules`** (workspace root): Concise, actionable rules automatically read by Cursor's AI assistant during coding. Focuses on "what to do" when suggesting code.

- **`CLAUDE.md`** (this file): Comprehensive workflow documentation with context, history, best practices, and detailed explanations. Provides "why" and "how" for deeper understanding.

**Complementary Relationship**:

- `.cursorrules` = Quick reference guide for AI during real-time assistance
- `CLAUDE.md` = Complete handbook with workflows, patterns, and project context

### Workflow Mapping: Claude Code → Cursor

| Claude Code (claude.ai/code)             | Cursor IDE                                         |
| ---------------------------------------- | -------------------------------------------------- |
| `/research_codebase`                     | Use chat (Cmd+L) to ask about codebase structure   |
| `/create_plan`                           | Use Composer (Cmd+I) to draft implementation plans |
| `/implement_plan`                        | Use Composer or inline chat to write code          |
| `/validate_plan`                         | Use chat to verify tests and run quality checks    |
| Skills in `.claude/skills/`              | Referenced in `CLAUDE.md`, usable via chat context |
| Hooks in `.claude/claude-code-workflow/` | Claude Code-specific (not used by Cursor)          |

### Using Both Tools

You can use **both Cursor and Claude Code** in your workflow:

- **Cursor IDE**: Day-to-day coding with real-time AI assistance
  - Fast inline suggestions and chat
  - Composer for multi-file changes
  - Automatic `.cursorrules` integration
  - Best for: Quick iterations, debugging, refactoring

- **Claude Code**: Structured workflow with plugins
  - Four-phase workflow (research → plan → implement → validate)
  - Custom skills and agents in `.claude/` directory
  - Context management and checkpoints
  - Best for: Large features, systematic refactoring, documentation

### Cursor-Specific Features

**Chat (Cmd+L)**: Ask questions about the codebase, get explanations, or request code changes.

**Composer (Cmd+I)**: Create multi-file changes, implement features, or refactor code across the monorepo.

**Quick Commands in Chat**:

- "Create a new service using `just gen-service` pattern"
- "Add a route to kaggle-data-api following Fastify AutoLoad pattern"
- "Write tests for this function in the `tests/` directory"
- "Check if this follows our ESM import conventions"

**Key Differences from Claude Code**:

- No slash commands (`/research`, `/plan`) - use natural language in chat
- `.claude/` directory plugins work only in Claude Code web interface
- Cursor reads `.cursorrules` automatically (no setup needed)
- Both tools can read `CLAUDE.md` for context, but Cursor primarily uses `.cursorrules`

### Before Coding in Cursor

1. Cursor automatically reads `.cursorrules` - you're already set up!
2. When you need detailed context, reference `CLAUDE.md` in chat
3. Check `TODO.md` for current project state (same as Claude Code workflow)
4. Use path aliases (`@libs/*`, `@services/*`) - Cursor will suggest these automatically

### Best Practices

- **For quick changes**: Use Cursor's inline chat and suggestions
- **For large features**: Consider using Claude Code's structured workflow
- **For documentation**: Reference `CLAUDE.md` sections in Cursor chat
- **For consistency**: Both tools follow the same conventions (ESM, path aliases, test structure)

The project's coding standards are the same regardless of which tool you use - `.cursorrules` ensures Cursor follows them automatically.

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

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

<!-- nx configuration end-->
