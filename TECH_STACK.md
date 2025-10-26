# Tech Stack Inventory

Comprehensive inventory of technologies, tools, and configurations in this repository.

## Runtime & Language

- Node.js 22 (enforced via `.nvmrc`, `.node-version`, `package.json.engines`)
- TypeScript 5.6, strict, pure ESM across projects

## Monorepo & Build System

- Nx 19.8 for monorepo orchestration, caching, and generators
- pnpm 10 as package manager
- Path aliases: `@services/*`, `@libs/*`, `@packages/*` (`tsconfig.base.json`)
- Per‑project `project.json` targets (`build`, `serve`, `test`, etc.)

## Services & Frameworks

- Fastify 4 (API): `fastify`, `@fastify/autoload`, `@fastify/sensible`, `fastify-plugin`
- ESM application entrypoints (e.g., `services/api-gateway/src/main.ts`)

## Jobs & Data Processing

- Zod for runtime validation
- execa for subprocess management
- commander for CLI scaffolding
- chalk for terminal output
- axios for HTTP calls
- csv-parse for CSV handling
- date-fns for date utilities
- Hexagonal architecture (ports/adapters) in `jobs/fetch-kaggle`

## Shared Libraries

- `libs/shared-util` with ESM helpers (`getDirname`, `getFilename`) and shared utilities

## Build & Bundling

- Esbuild via `@nx/esbuild` for applications (non-bundled ESM outputs)
- TypeScript compiler via `@nx/js:tsc` for libraries

## Testing

- Vitest 2 with V8 coverage
- Root config enforces 90% thresholds (lines, functions, branches, statements)
- Per-project Vitest configs merge base configuration
- `@nx/vite` test executor and `nxViteTsPaths` plugin where applicable

## Linting & Formatting

- ESLint 9 (flat config) with `@typescript-eslint` and Nx module boundary rules
- Prettier 3 (100-char width, single quotes, 2-space indent)
- lint-staged for staged file formatting and linting

## Git Hooks & Commit Conventions

- Husky hooks: `pre-commit`, `pre-push`, `commit-msg`
- Conventional Commits enforced by `commit-msg` hook
- Pre-commit runs lint-staged, typecheck, affected lint/test/build
- Pre-push runs typecheck, affected test/build

## CI/CD

- GitHub Actions workflows:
  - CI (lint → test → build) with Node 22 and pnpm cache
  - Semantic PR title validation (Conventional Commits)
  - PR body section validation

## Local Infrastructure

- Docker Compose (commented templates) for Postgres and Redis
- Justfile task runner with common workflows (lint, test, build, serve, infra)

## Scripts & Developer Tooling

- `scripts/run-tests.mjs`: forwards Nx CLI flags to Nx (no `--` sentinel), CI mode
- Generators: `gen-service.sh`, `gen-lib.sh`, `gen-job.sh`
- Quick commit workflow: `quick-commit.sh` (format → affected checks → push)
- Automated PR workflow: `merge-to-main.sh` (gh CLI)

## Configuration & Environment

- `pnpm-workspace.yaml`: packages under `services/*`, `libs/*`, `packages/*`, `jobs/*`
- `.env.example` with API/Worker and Kaggle variables
- `eslint.config.mjs` + `eslint.config.js` for TypeScript and Nx rules

## Observability & Logging

- Fastify logger enabled (Pino via Fastify)

## Notes

- No ORM or database client configured yet; Postgres/Redis are optional and currently commented in `docker-compose.yml`.
- Swagger/OpenAPI is referenced in docs/TODOs but not installed or wired in code.
- Nx cache control respected through the test runner wrapper; `pnpm test --skip-nx-cache` disables Nx cache as expected.

