# Super Zol Backend Monorepo

A production-ready TypeScript/Node.js monorepo using Nx, pnpm, and Vitest.

> 📖 **New to this monorepo?** Read [docs/architecture.md](docs/architecture.md) to understand the file structure, why we have multiple tsconfig files, and how everything fits together.

## Stack

- **Runtime**: Node.js 22
- **Package Manager**: pnpm 10
- **Build System**: Nx 19.8
- **Language**: TypeScript 5.6
- **Testing**: Vitest
- **Linting**: ESLint 9 (flat config)
- **Formatting**: Prettier
- **API Framework**: Fastify

## Project Structure

```
backend/
├── services/          # Deployable backend services
│   ├── api-gateway/  # Fastify API service
│   └── worker/       # Background worker
├── libs/             # Shared internal libraries
│   └── shared-util/  # Common utilities
├── packages/         # Publishable packages (optional)
└── jobs/             # Scheduled tasks
```

## Getting Started

### Prerequisites

- Node.js >= 22
- pnpm >= 10
- (Optional) [Just](https://github.com/casey/just) - Command runner for common tasks

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
```

## Task Runner (Just)

This project includes a `justfile` with common commands for easier development workflow.

**Install Just:**

```bash
# macOS
brew install just

# Other platforms: https://github.com/casey/just#installation
```

**Quick Commands:**

```bash
just              # List all available commands
just check        # Run lint + typecheck + test
just dev-setup    # Complete dev environment setup
just serve-api    # Start API gateway
just test         # Run all tests
just build        # Build all projects
just graph        # View dependency graph
```

**All Available Commands:**

- `just install` - Install dependencies
- `just check` - Run all quality checks (lint, typecheck, test)
- `just lint` - Lint all code
- `just typecheck` - Type check all TypeScript
- `just test` - Run all tests
- `just test-coverage` - Run tests with coverage
- `just build` - Build all projects
- `just build-prod` - Build for production
- `just format` - Format all code
- `just clean` - Clean build outputs and caches
- `just serve-api` - Start API gateway
- `just serve-worker` - Start worker service
- `just infra-up` - Start local infrastructure (Docker)
- `just infra-down` - Stop local infrastructure
- `just gen-service <name>` - Generate new service
- `just gen-lib <name>` - Generate new library
- `just ci` - Run CI pipeline locally

### Development

**Using Just (recommended):**

```bash
# Run all quality checks
just check

# Start services
just serve-api
just serve-worker

# Build, test, lint
just build
just test
just lint
just format
```

**Using pnpm directly:**

```bash
# Start all services
pnpm dev

# Start specific service
pnpm nx serve api-gateway
pnpm nx serve worker

# Build all projects
pnpm build

# Build specific project
pnpm nx build api-gateway

# Run tests
pnpm test

# Run tests for specific project
pnpm nx test api-gateway

# Lint all code
pnpm lint

# Format code
pnpm format
```

### Working with Nx

```bash
# View project graph
pnpm graph

# Run affected tests only
pnpm affected:test

# Run affected builds only
pnpm affected:build

# Show project details
pnpm nx show project api-gateway
```

## Quality Gates

This monorepo enforces code quality through automated checks:

- **Vitest**: Coverage thresholds at 90%
- **ESLint**: Strict TypeScript rules with Nx module boundaries
- **Prettier**: Consistent code formatting
- **Git Hooks**: Automated quality checks at different stages (see below)

### Git Hooks (Enforced Quality)

Three git hooks automatically enforce quality standards:

#### 1. Pre-Commit (Fast Style Check)

**What**: ESLint + Prettier on staged files only
**When**: Before every commit
**Duration**: 1-5 seconds
**How**: Uses `lint-staged` for performance

#### 2. Pre-Push (Comprehensive Check)

**What**: TypeScript checks + Tests + Builds (affected projects only)
**When**: Before `git push`
**Duration**: 30-120 seconds
**Prevents**: Broken code from reaching the remote repository

#### 3. Commit Message (Format Check)

**What**: Enforces Conventional Commits format
**When**: Before commit is created
**Format**: `type(scope): subject`
**Examples**: `feat(api): add auth`, `fix(worker): memory leak`

**Skipping hooks (emergency only)**:

```bash
git commit --no-verify  # Skip pre-commit + commit-msg
git push --no-verify    # Skip pre-push
```

> 📖 **Full details**: See [docs/architecture.md#git-hooks-and-linting](docs/architecture.md#git-hooks-and-linting) for complete explanation of all hooks, why they exist, and best practices.

### Component Structure

Each component (service/lib/job) follows a deterministic structure:

- `src/` - Source code
- `tests/` - Test files (separate from src)
- `vitest.config.ts` - Component-specific test configuration
- `tsconfig.json` + `tsconfig.app.json`/`tsconfig.lib.json` - TypeScript configs
- `project.json` - Nx project configuration

See [docs/architecture.md](docs/architecture.md) for detailed explanation.

## Adding New Projects

### Create a new service

**Using Just:**

```bash
just gen-service my-service
```

**Using Nx directly:**

```bash
pnpm nx g @nx/node:application services/my-service --framework=fastify --bundler=esbuild
```

### Create a new library

**Using Just:**

```bash
just gen-lib my-lib
```

**Using Nx directly:**

```bash
pnpm nx g @nx/node:library libs/my-lib --bundler=tsc
```

## Docker Support

Start local infrastructure:

**Using Just:**

```bash
just infra-up    # Start infrastructure
just infra-down  # Stop infrastructure
just infra-logs  # View logs
```

**Using Docker directly:**

```bash
docker compose up -d
docker compose down
docker compose logs -f
```

## Scripts Reference

| Command               | Description                            |
| --------------------- | -------------------------------------- |
| `pnpm dev`            | Start all services in development mode |
| `pnpm build`          | Build all projects                     |
| `pnpm test`           | Run all tests                          |
| `pnpm lint`           | Lint all code                          |
| `pnpm format`         | Format all code                        |
| `pnpm graph`          | View dependency graph                  |
| `pnpm affected:test`  | Test only affected projects            |
| `pnpm affected:build` | Build only affected projects           |

## CI/CD

**Using Just:**

```bash
just ci  # Runs affected lint, test, and build
```

**Manual CI pipeline:**

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Lint & test
pnpm affected:lint --base=origin/main
pnpm affected:test --base=origin/main --coverage

# Build
pnpm affected:build --base=origin/main
```

## Environment Variables

See [.env.example](./.env.example) for all available environment variables.

## Architecture

### Services

- **api-gateway**: REST API using Fastify with OpenAPI documentation
- **worker**: Background job processor

### Libraries

- **shared-util**: Common utilities and helpers used across services

## Contributing

1. Create a feature branch
2. Make your changes
3. Run `pnpm lint` and `pnpm test`
4. Commit your changes (pre-commit hooks will run automatically)
5. Push and create a pull request

## Troubleshooting

### Nx cache issues

```bash
pnpm nx reset
```

### Dependency issues

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Resources

- [Nx Documentation](https://nx.dev)
- [Fastify Documentation](https://fastify.dev)
- [Vitest Documentation](https://vitest.dev)
- [TypeScript Documentation](https://www.typescriptlang.org)
