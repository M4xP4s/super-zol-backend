# Development Guide

Complete guide for developing in the Super Zol backend monorepo.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Command Reference](#command-reference)
- [Development Workflows](#development-workflows)
- [Working with Nx](#working-with-nx)
- [Creating New Components](#creating-new-components)
- [Common Patterns](#common-patterns)
- [Debugging](#debugging)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required

- **Node.js** ≥22 (use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm))
- **pnpm** ≥10 (installed automatically via corepack)

### Optional

- **[Just](https://github.com/casey/just)** - Command runner (makes life easier)
- **[Docker](https://www.docker.com/)** - For local infrastructure (PostgreSQL, Redis, etc.)
- **[GitHub CLI](https://cli.github.com/)** - For automated PR workflows

### Installing Just

```bash
# macOS
brew install just

# Linux
cargo install just

# Other platforms
# See: https://github.com/casey/just#installation
```

## Command Reference

### Quick Reference

| Task                    | Just Command                | Direct Command                                           |
| ----------------------- | --------------------------- | -------------------------------------------------------- |
| Run all checks          | `just check`                | `pnpm lint && pnpm typecheck && pnpm test`               |
| Install deps            | `just install`              | `pnpm install`                                           |
| Start all services      | -                           | `pnpm dev`                                               |
| Start API               | -                           | `pnpm nx serve kaggle-data-api`                          |
| Run all tests           | `just test`                 | `pnpm test`                                              |
| Run tests with coverage | `just test-coverage`        | `pnpm test -- --coverage`                                |
| Watch tests             | `just test-watch <project>` | `pnpm nx test <project> --watch`                         |
| Lint code               | `just lint`                 | `pnpm lint`                                              |
| Format code             | `just format`               | `pnpm format`                                            |
| Type check              | `just typecheck`            | `pnpm exec tsc --noEmit`                                 |
| Build all               | `just build`                | `pnpm build`                                             |
| Build for production    | `just build-prod`           | `pnpm nx run-many -t build --configuration=production`   |
| View graph              | `just graph`                | `pnpm graph`                                             |
| Clean caches            | `just clean`                | `pnpm nx reset`                                          |
| Run CI checks           | `just ci`                   | `pnpm nx affected -t lint test build --base=origin/main` |

### Development Setup

**Complete setup** (install + docker + env):

```bash
just dev-setup
```

Or manually:

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Start infrastructure
just infra-up
# or: docker compose up -d
```

### Infrastructure Commands

```bash
# Start all infrastructure (PostgreSQL, Redis, etc.)
just infra-up

# Stop infrastructure
just infra-down

# View logs
just infra-logs

# Restart infrastructure
just infra-restart
```

### Testing Commands

```bash
# Run all tests
just test
# or: pnpm test

# Run tests for specific project
pnpm nx test kaggle-data-api

# Watch mode for specific project
just test-watch kaggle-data-api
# or: pnpm nx test kaggle-data-api --watch

# Run with coverage
just test-coverage
# or: pnpm test -- --coverage

# Run only affected tests
pnpm nx affected -t test --base=origin/main
```

### Integration Testing Commands

Integration tests run against real services provisioned with docker-compose (PostgreSQL, API service, etc.).

**Recommended approach** - One command that handles setup, test, and cleanup:

```bash
# Complete integration test cycle (setup → test → teardown)
just integ-test-full
```

**Manual workflow** - For iterative development:

```bash
# Start integration test services (PostgreSQL + kaggle-data-api)
just integ-setup

# Run tests against running services
just test-integration

# Or watch mode while developing
just test-integration-watch

# View service logs
just integ-logs

# Stop services when done
just integ-down
```

**Available integration test commands**:

| Command                       | Purpose                                                      |
| ----------------------------- | ------------------------------------------------------------ |
| `just integ-test-full`        | Complete cycle: setup → test → teardown (recommended for CI) |
| `just integ-setup`            | Start services only (for manual testing)                     |
| `just integ-down`             | Stop services                                                |
| `just integ-logs`             | Stream live logs                                             |
| `just test-integration`       | Run tests (requires services running)                        |
| `just test-integration-watch` | Run tests in watch mode                                      |

See [tests/integration/README.md](tests/integration/README.md) for detailed integration testing guide.

### Building

```bash
# Build all projects
just build
# or: pnpm build

# Build specific project
pnpm nx build kaggle-data-api

# Build for production
just build-prod
# or: pnpm nx run-many -t build --configuration=production

# Build only affected projects
pnpm nx affected -t build --base=origin/main
```

### Code Quality

```bash
# Run all quality checks (recommended before committing)
just check

# Lint all code
just lint
# or: pnpm lint

# Lint specific project
pnpm nx lint kaggle-data-api

# Format all code
just format
# or: pnpm format

# Type check all code
just typecheck
# or: pnpm exec tsc --noEmit
```

## Development Workflows

### Quick Iteration Workflow (Solo Development)

For rapid iteration on the main branch:

```bash
# 1. Make your changes
vim services/kaggle-data-api/src/app/routes/example.ts

# 2. Quick commit and push
./scripts/quick-commit.sh "feat(api): add user endpoint"
```

**What happens**:

1. Syncs with remote main (fast-forward)
2. Formats code (`pnpm nx format:write`)
3. Stages all changes (`git add -A`)
4. Creates commit (validates Conventional Commits format)
5. Runs affected lint, test, and build checks
6. Pushes to main

**When to use**: Solo development, small changes, experiments

### Feature Branch Workflow (Collaborative)

For larger features or collaborative work:

```bash
# 1. Create feature branch
git checkout -b feat/user-authentication

# 2. Make changes and commit regularly
git add .
git commit -m "feat(api): add JWT middleware"
git commit -m "test(api): add auth tests"

# 3. Automated PR workflow
just merge-to-main

# Alternative: specify branch explicitly
just merge-to-main feat/user-authentication

# Keep branch after merge (for reference)
just merge-to-main-keep feat/user-authentication
```

**What happens**:

1. Pushes branch upstream (with `-u` if needed)
2. Creates PR with Conventional Commits title
3. Polls CI every 10s (max 10 minutes)
4. Auto-merges when all checks pass
5. Switches to main and pulls
6. Deletes feature branch locally
7. Cleans up stale remote branches

**When to use**: Collaborative work, large features, when code review is beneficial

### Testing Workflow

```bash
# 1. Run tests in watch mode while developing
just test-watch kaggle-data-api

# 2. Make changes to code
vim services/kaggle-data-api/src/app/routes/example.ts

# 3. Make changes to tests
vim tests/routes/users.test.ts

# 4. Tests automatically re-run

# 5. Check coverage when done
just test-coverage

# 6. Commit when ready
git commit -m "feat(api): add user endpoint"
```

## Working with Nx

### Viewing the Dependency Graph

```bash
# Open interactive graph in browser
just graph
# or: pnpm nx graph

# Show project details
pnpm nx show project kaggle-data-api

# Show project dependencies
pnpm nx show project kaggle-data-api --json | jq '.dependencies'
```

### Affected Commands

Nx tracks changes and only runs tasks on affected projects:

```bash
# Test only affected projects
pnpm nx affected -t test --base=origin/main

# Build only affected projects
pnpm nx affected -t build --base=origin/main

# Lint only affected projects
pnpm nx affected -t lint --base=origin/main

# Multiple tasks on affected projects
pnpm nx affected -t lint test build --base=origin/main --parallel=3
```

### Understanding "Affected"

Nx determines affected projects by:

1. Finding changed files since `--base` commit
2. Tracing dependency graph to find dependent projects
3. Running tasks only on those projects

**Example**: If you change `libs/shared-util`:

- `kaggle-data-api` is affected (imports `shared-util`)
- Nx tests and builds the affected services

### Caching

Nx caches task results for performance:

```bash
# View cache info
pnpm nx show cache

# Reset cache (useful after config changes)
pnpm nx reset
# or: just clean

# Run task without cache
pnpm nx test kaggle-data-api --skip-nx-cache
```

## Creating New Components

### Generate a New Service

**Using Just**:

```bash
just gen-service my-service
```

**Using Nx directly**:

```bash
pnpm nx g @nx/node:application services/my-service \
  --framework=fastify \
  --bundler=esbuild
```

**What gets created**:

- `services/my-service/src/` - Source code
- `services/my-service/tests/` - Test directory
- `services/my-service/src/main.ts` - Entry point
- `services/my-service/src/app/app.ts` - Fastify app with AutoLoad
- `services/my-service/src/app/routes/` - Route handlers (auto-loaded)
- `services/my-service/src/app/plugins/` - Plugins (auto-loaded)
- TypeScript configs, Vitest config, ESLint config

### Generate a New Library

**Using Just**:

```bash
just gen-lib my-lib
```

**Using Nx directly**:

```bash
pnpm nx g @nx/node:library libs/my-lib --bundler=tsc
```

**What gets created**:

- `libs/my-lib/src/lib/` - Library code
- `libs/my-lib/src/index.ts` - Public exports
- `libs/my-lib/tests/` - Test directory
- TypeScript configs, Vitest config, ESLint config

**After creating**, add to `tsconfig.base.json` for convenient imports:

```json
{
  "compilerOptions": {
    "paths": {
      "my-lib": ["libs/my-lib/src/index.ts"],
      "@libs/my-lib": ["libs/my-lib/src/index.ts"]
    }
  }
}
```

### Generate a New Job

**Using Just**:

```bash
just gen-job my-job
```

**Using Nx directly**:

```bash
pnpm nx g @nx/node:application jobs/my-job \
  --bundler=esbuild
```

## Common Patterns

### Adding a Route to a Service

Create a file in `services/<name>/src/app/routes/`:

```typescript
// services/kaggle-data-api/src/app/routes/example.ts
import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
  // GET /users
  fastify.get('/users', async (request, reply) => {
    return { users: [] };
  });

  // GET /users/:id
  fastify.get<{ Params: { id: string } }>('/users/:id', async (request, reply) => {
    const { id } = request.params;
    return { id, name: 'User' };
  });

  // POST /users
  fastify.post<{ Body: { name: string } }>('/users', async (request, reply) => {
    const { name } = request.body;
    return { id: '123', name };
  });
}
```

AutoLoad automatically registers routes from `src/app/routes/`.

### Adding a Plugin to a Service

Create a file in `services/<name>/src/app/plugins/`:

```typescript
// services/kaggle-data-api/src/app/plugins/auth.ts
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

async function authPlugin(fastify: FastifyInstance) {
  fastify.decorate('authenticate', async (request, reply) => {
    // Authentication logic
    const token = request.headers.authorization;
    if (!token) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });
}

export default fp(authPlugin);
```

AutoLoad automatically registers plugins from `src/app/plugins/`.

### Importing from Libraries

```typescript
// ✅ Good: Import from libraries
import { myUtil } from '@libs/shared-util';
import { myUtil } from 'shared-util'; // If alias configured

// ❌ Bad: Import from other services
import { something } from '@services/kaggle-data-api';
```

**Rule**: Services can import from `libs/`, but not from other services.

### Using Path Aliases

Defined in `tsconfig.base.json`:

```typescript
// Instead of relative imports:
import { util } from '../../../libs/shared-util/src/lib/util';

// Use path aliases:
import { util } from '@libs/shared-util';
// or:
import { util } from 'shared-util';
```

### Environment Variables

```typescript
// Load from .env file
import { config } from 'dotenv';
config();

// Access variables
const port = process.env.PORT || 3000;
const dbUrl = process.env.DATABASE_URL;

// Type-safe config (recommended)
import { z } from 'zod';

const configSchema = z.object({
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string(),
});

const config = configSchema.parse(process.env);
```

### ESM Patterns

This project uses **pure ESM**:

```typescript
// ✅ Use import/export
import { something } from './module.js'; // Note .js extension

// ✅ Use import.meta.url instead of __dirname
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Or use helper from shared-util
import { getDirname } from '@libs/shared-util';
const __dirname = getDirname(import.meta.url);

// ❌ Don't use require
const something = require('./module'); // Error!

// ❌ Don't use module.exports
module.exports = { something }; // Error!
```

## Debugging

### Debugging with VS Code

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug API Gateway",
      "runtimeArgs": ["--loader", "tsx"],
      "args": ["${workspaceFolder}/services/kaggle-data-api/src/main.ts"],
      "cwd": "${workspaceFolder}",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "runtimeArgs": ["nx", "test", "kaggle-data-api"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Debugging Tests

```bash
# Run tests with Node debugger
node --inspect-brk node_modules/.bin/vitest run

# Or use VS Code's built-in debugger
# Set breakpoints and run "Debug Tests" configuration
```

### Verbose Logging

```bash
# Enable Nx verbose output
NX_VERBOSE_LOGGING=true pnpm nx test kaggle-data-api

# Enable Vitest verbose output
pnpm nx test kaggle-data-api -- --reporter=verbose

# Enable Fastify logging
# In your service main.ts:
const app = Fastify({ logger: true });
```

## Troubleshooting

### Nx Cache Issues

If builds or tests are returning stale results:

```bash
# Clear Nx cache
pnpm nx reset
# or: just clean

# Verify cache cleared
pnpm nx show cache
```

### Dependency Issues

If packages aren't installing correctly:

```bash
# Remove node_modules and lockfile
rm -rf node_modules pnpm-lock.yaml

# Reinstall
pnpm install
```

### Type Errors After Adding Library

If imports show type errors:

1. Check `tsconfig.base.json` has correct path alias
2. Restart TypeScript server in VS Code (Cmd+Shift+P → "Restart TS Server")
3. Check `libs/my-lib/src/index.ts` exports what you need

### Tests Not Running

If tests aren't discovered:

```bash
# Check Vitest config includes correct patterns
# vitest.config.ts should have:
{
  test: {
    include: ['tests/**/*.{test,spec}.{js,ts}']
  }
}

# Verify tests are in correct location
ls tests/

# Run with verbose output
pnpm nx test <project> -- --reporter=verbose
```

### Git Hooks Not Running

If hooks aren't executing:

```bash
# Reinstall husky
pnpm exec husky install

# Verify hooks are executable
ls -la .husky/
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
chmod +x .husky/commit-msg
```

### Build Errors

If builds fail:

```bash
# Check TypeScript errors
pnpm exec tsc --noEmit

# Build specific project with verbose output
NX_VERBOSE_LOGGING=true pnpm nx build <project>

# Check project.json build configuration
cat services/<project>/project.json
```

### Port Already in Use

If service won't start:

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 pnpm nx serve kaggle-data-api
```

## Additional Resources

- [Nx Documentation](https://nx.dev) - Build system and monorepo management
- [Fastify Documentation](https://fastify.dev) - Web framework
- [Vitest Documentation](https://vitest.dev) - Testing framework
- [TypeScript Documentation](https://www.typescriptlang.org) - Language reference
- [ARCHITECTURE.md](ARCHITECTURE.md) - Deep dive into architecture decisions
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
