# Repository Guidelines

## Project Structure & Module Organization

- Monorepo managed by Nx; Node.js 22 + pnpm 10.
- Services live in `services/` (e.g., `api-gateway`, `worker`); shared code in `libs/`; scheduled tasks in `jobs/`; generators and utilities in `scripts/`; docs in `docs/`.
- Each project follows: `src/`, `tests/`, `project.json`, `tsconfig.*`, `vitest.config.ts`.
- Path aliases: `@services/*`, `@libs/*`, `@packages/*` (see `tsconfig.base.json`).

## Build, Test, and Development Commands

- Setup: `pnpm install` then `cp .env.example .env` and optionally `just infra-up` (or `docker compose up -d`).
- Run all services: `pnpm dev`; specific: `pnpm nx serve api-gateway` or `pnpm nx serve worker`.
- Build: `pnpm build` (all) or `pnpm nx build <project>`; prod: `pnpm nx build <project> --configuration=production`.
- Quality: `pnpm lint`, `pnpm test`, `pnpm format`, affected-only: `pnpm affected:test|build|lint`.
- Just (optional): `just check`, `just serve-api`, `just test-coverage`, `just graph`.

## Coding Style & Naming Conventions

- TypeScript strict; 2-space indent; single quotes; semicolons; 100-char line width (see `.prettierrc`).
- ESLint enforces Nx module boundaries and TS rules (`no-any`, explicit returns, no non-null assertions).
- Naming: files/dirs `kebab-case` (e.g., `shared-util`); variables/functions `camelCase`; types/interfaces `PascalCase`.
- Do not import across service boundaries; share via `libs/` only.

## Testing Guidelines

- Framework: Vitest. Place tests in `tests/**/*.test.ts` (preferred) or colocated under `src/**` when necessary.
- Run: `pnpm test` or `pnpm nx test <project>`; watch: `pnpm nx test <project> --watch`.
- Coverage thresholds: 90% lines/func/branches/statements (see `vitest.config.ts`). Use `just test-coverage` for reports.

## Commit & Pull Request Guidelines

- Conventional Commits enforced by Husky: `type(scope): subject` (e.g., `feat(api): add auth endpoint`).
- **Commit after completing each task**: Create atomic commits as you finish logical units of work. This creates checkpoints, makes progress tracking easier, and provides rollback points.
- Before pushing, ensure `just check` (or `pnpm lint && pnpm test && pnpm nx build <affected>`) passes; pre-push hook runs typecheck, tests, and builds for affected projects.
- PRs: include problem statement, summary of changes, linked issues, test notes/coverage, and docs updates if applicable. For API changes, add example request/response.

## Security & Configuration

- Use `.env` (template: `.env.example`); never commit secrets. Start local infra with `docker compose up -d`.
- Honor versions in `.nvmrc`/`.node-version` and `package.json.engines`.
