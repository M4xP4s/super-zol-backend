name: bootstrap-monorepo
allowed-tools: Read, Write, Edit, Bash
argument-hint: "[profile] | --with-python | --minimal"
description: Bootstrap a backend-focused monorepo (Node 22 + pnpm 10) with Nx, using services/libs/jobs layout and shared quality gates; optional Python (uv)
---


# Bootstrap Backend Monorepo

You are the backend monorepo architect ensuring this workspace matches the baseline defined in the external documentation set. Default to a Node + Nx + pnpm pattern optimized for backend services. Add Python (uv) services only when requested.

### Reference Material Locations

- **Documentation repo:** `/Users/max/projects/agents/docs/monorepo/` (e.g. `overview.md`, `plugins.md`, `mcp-integrations.md`). Treat as read-only; pull updates from the `agents` project if paths drift.
- **Alignment notes:** `/Users/max/projects/agents/monorepo-alignment-notes.md`. Update this file when recording follow-up tasks or decisions.
- **Reference workspace:** `/Users/max/projects/node22-nx-pnpm-vitest-monorepo`. Mirror its structure and configuration; do not modify the source copy.
- If any of these paths are unavailable on a new machine, clone or sync the corresponding repositories into the noted locations before running this Skill.

## Current Project State

- Node runtime: !`node -v`
- pnpm version: !`pnpm -v`
- Nx CLI (if initialized): !`pnpm dlx nx@latest --version 2>/dev/null || echo "nx missing"`
- uv toolchain: !`uv --version 2>/dev/null || echo "uv not installed"`
- Workspace manifests: @package.json, @pnpm-workspace.yaml, @nx.json
- Existing projects: !`find services libs packages jobs python -maxdepth 2 -mindepth 1 2>/dev/null | sort`
- Testing hooks: @.husky/pre-commit, @.lintstagedrc.json, @.pre-commit-config.yaml

## Task

Implement the production-ready backend monorepo baseline:

- **Default profile**: Node backend with Nx + pnpm; no frontend. Strict lint/test coverage, service-first layout.
- **Flags**:
  - `--with-python`: scaffold uv-based Python services/packages alongside Node services.
  - `--minimal`: omit Husky, lint-staged, and optional marketplace installs.

### 1. Toolchain Alignment

1. Enforce Node 22 and pnpm 10 via `.nvmrc`, `.node-version`, and `packageManager` in `package.json`.
2. Run `corepack enable pnpm` and `pnpm env use --global 22` so contributors inherit the runtime.
3. Pin Nx 19.8 with `pnpm dlx create-nx-workspace@19.8.0` (if not already) or update `nx.json`/`package.json` devDependencies accordingly.
4. Record versions in `docs/monorepo/dependencies.md` when changes occur.

### 2. Workspace Layout & Scaffolding

1. Use `services/` for deployable backends (APIs, workers), `libs/` for internal shared code, and optionally `packages/` for publishable libraries. Keep `jobs/` for scheduled tasks.
2. Generate base Node services using Nx generators, e.g.:
   - `pnpm nx g @nx/node:application services/api-gateway` (Fastify/Express skeleton; prefer Fastify)
   - `pnpm nx g @nx/node:application services/worker` (queue/cron worker)
   - `pnpm nx g @nx/node:library libs/shared-util`
3. TypeScript: update `tsconfig.base.json` path aliases (e.g., `@services/*`, `@libs/*`), enable `strict`, `noUncheckedIndexedAccess`, and Node-targeted module resolution (`moduleResolution: "bundler"` or `"node16"`).
4. Linting: configure `eslint.config.mjs` with flat config, Nx module-boundary rules, and Node-specific rules; align with `node22-nx-pnpm-vitest-monorepo/docs/engineering-standards.md`.
5. Testing: add Vitest per service/lib (`coverageProvider: "v8"`) enforcing ≥90% lines/statements/functions/branches.

### 3. Backend Essentials (Node)

1. API service (`services/api-gateway`):
   - Framework: Fastify with health route and readiness/liveness endpoints.
   - OpenAPI: `@fastify/swagger` + `@fastify/swagger-ui` or schema-first via Zod + `zod-to-openapi`.
   - Logging: `pino` with sensible redaction; `pino-pretty` in dev.
2. Config & env:
   - Add `.env` + `.env.example`; validate at startup via Zod.
   - Use `dotenv`/`dotenv-flow` and centralize config in `libs/config`.
3. Persistence (optional):
   - Choose Prisma or Drizzle; create `db/` with schema, migrations, and scripts (`db:generate`, `db:migrate`, `db:reset`).
   - For local dev, provide `docker-compose.yml` for database/broker services.
4. Observability (optional):
   - OpenTelemetry SDK with HTTP metrics/traces; exporters toggled by env.
5. Build & runtime:
   - Use `tsup`/`esbuild` for production builds; `tsx` for dev.
   - Nx targets: `serve`, `build`, `lint`, `test`, `migrate` with caching.

### 4. Python uv Services (when `--with-python`)

1. Create `python/services/` and `python/packages/` to mirror `services/` and `libs/`.
2. For each requested component, run `uv init python/services/<name>` or `uv init python/packages/<name>` and set `requires-python = ">=3.11"`.
3. Configure `pyproject.toml` with `ruff`, `mypy`/`pyright`, `pytest`, `coverage`, and scripts (`lint`, `typecheck`, `test`) that match Node service expectations.
4. Define shared tooling in `python/uv.lock` via `uv sync`; add commands to the root `package.json` (e.g., `"py:lint": "uv run ruff check python"`).
5. Install `pre-commit` hooks executing ruff/mypy/pytest unless `--minimal`.

### 5. Workspace & Dependency Management

1. Update `pnpm-workspace.yaml` globs to include `services/*`, `libs/*`, `packages/*`, `jobs/*`, and `python/**` when Python is enabled.
2. Configure `nx.json` `targetDefaults` for `serve`, `build`, `lint`, `test`, and `format` with caching, `dependsOn`, and environment variables for coverage thresholds.
3. Use workspace protocol (`"workspace:*"`) for internal TS libraries; ensure `project.json` files include appropriate tags (`scope:service`, `scope:shared`, `type:api`, `type:lib`) to guard imports.
4. Document dependency additions in `docs/monorepo/overview.md` and `docs/monorepo/plugins.md`.

### 6. Automation & CI/CD

1. Install Husky + lint-staged (`pnpm dlx husky-init && pnpm install lint-staged -D`) unless `--minimal`; ensure pre-commit runs `pnpm lint`, `pnpm test`, and optionally Python hooks.
2. Add CI workflow steps: `pnpm install --frozen-lockfile`, spin up services via `docker compose up -d` when needed (db, broker), then `pnpm nx run-many -t lint test build`. For Python, add `uv sync` + `uv run pytest --cov`.
3. Wire Nx `affected` commands for incremental builds; include `pnpm nx graph --focus` for debugging dependency issues.
4. Surface coverage artifacts and docs in pipeline outputs per `docs/monorepo/roadmap.md` goals. Optionally publish `packages/*` artifacts from release branches.

### 7. Documentation

1. Update or create sections in `docs/monorepo/overview.md`, `docs/monorepo/mcp-integrations.md`, and `docs/monorepo/plugins.md` describing the structure, tooling, and any platform integrations.
2. Capture developer workflow (install, lint, test, build, serve, migrate) in `README.md` and `docs/usage.md`.
3. Note optional add-ons (observability, DB tooling, MCP integrations) only when explicitly installed; keep defaults lean.
4. Record follow-up tasks or decisions in `monorepo-alignment-notes.md`.

## Output

Provide:

- Summary of files created/updated and scripts added.
- Commands executed (in order) for reproducibility.
- Next steps for the team (e.g., `pnpm install`, `docker compose up -d`, `pnpm nx graph`, `uv sync`, `pnpm nx affected:test`).
- Open questions or TODOs that require stakeholder confirmation.
