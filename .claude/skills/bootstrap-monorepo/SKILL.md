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
3. **Component Structure**: Each component (service/lib/job) must have:
   - `src/` - Source code
   - `tests/` - Test files with at least one example test
   - `vitest.config.ts` - Component-specific Vitest config extending root config
   - `project.json` - Nx project configuration with test target
   - `tsconfig.json` - Extends base, references lib/app configs
   - `tsconfig.lib.json` (for libs) or `tsconfig.app.json` (for services/jobs)
   - `eslint.config.js` - ESLint configuration
   - `README.md` - Component documentation
4. TypeScript Configuration:
   - `tsconfig.base.json` - Shared config for entire monorepo with path aliases (`@services/*`, `@libs/*`, `@packages/*`), strict mode, `noUncheckedIndexedAccess`
   - Each component has layered configs: `tsconfig.json` (root) → `tsconfig.lib.json`/`tsconfig.app.json` (specific)
   - `.nvmrc` and `.node-version` files ensure version manager compatibility (nvm, fnm, asdf, nodenv)
5. Linting: configure `eslint.config.mjs` with flat config, Nx module-boundary rules, and Node-specific rules; align with `node22-nx-pnpm-vitest-monorepo/docs/engineering-standards.md`.
6. Testing:
   - Root `vitest.config.ts` with shared defaults (90% coverage thresholds, v8 provider)
   - Each component has its own `vitest.config.ts` extending root config
   - `tests/` folder in each component with at least one example test (`*.test.ts` or `*.spec.ts`)
   - `.lintstagedrc.json` to run linters only on staged files (performance optimization for pre-commit hooks)

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

1. **Task Runner (Justfile)**: Create a `justfile` with essential commands for developer workflow:
   - Core commands: `install`, `check`, `lint`, `typecheck`, `test`, `test-coverage`, `build`, `build-prod`, `format`, `clean`, `clean-all`
   - Service commands: `serve-api`, `serve-worker`, `serve-all`
   - CI commands: `affected-test`, `affected-build`, `affected-lint`, `ci`
   - Infrastructure: `infra-up`, `infra-down`, `infra-logs`
   - **Deterministic Generators**: `gen-service <name>`, `gen-lib <name>`, `gen-job <name>` - Must create complete component structure:
     - Run Nx generator to scaffold base structure
     - Create `tests/` directory with example test file (`<name>.test.ts`)
     - Create component-specific `vitest.config.ts` extending root config
     - Add test target to `project.json` if missing
     - Create `README.md` with component description and usage
     - Generators must be idempotent and create consistent structure every time
   - Utilities: `graph`, `show <project>`, `bundle <service>`, `dev-setup`, `update-deps`, `audit`
   - Python commands when `--with-python`: `py:lint`, `py:test`, `py:typecheck`
   - Include helpful comments and installation instructions at the top
2. **Git Hooks (Husky)**: Install Husky + lint-staged (`pnpm dlx husky-init && pnpm install lint-staged -D`) unless `--minimal`. Configure three essential hooks:
   - **`.husky/pre-commit`**: Run `pnpm exec lint-staged` to enforce code style on staged files only (ESLint + Prettier)
   - **`.husky/pre-push`**: Run comprehensive checks before pushing:
     - Type checking: `pnpm exec tsc --noEmit`
     - Affected tests: `pnpm nx affected -t test --base=origin/main --parallel=3`
     - Affected builds: `pnpm nx affected -t build --base=origin/main --parallel=3`
     - Exit with clear error messages if any check fails
   - **`.husky/commit-msg`**: Enforce Conventional Commits format (type(scope?): subject)
     - Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `build`, `perf`
     - Example: `feat(api): add user authentication endpoint`
     - Reject commits that don't follow format with helpful error message
3. Configure `.lintstagedrc.json` to run ESLint and Prettier on staged TypeScript/JavaScript files, and Prettier on JSON/Markdown/YAML files.
4. Add CI workflow steps: `pnpm install --frozen-lockfile`, spin up services via `docker compose up -d` when needed (db, broker), then `pnpm nx run-many -t lint test build`. For Python, add `uv sync` + `uv run pytest --cov`.
5. Wire Nx `affected` commands for incremental builds; include `pnpm nx graph --focus` for debugging dependency issues.
6. Surface coverage artifacts and docs in pipeline outputs per `docs/monorepo/roadmap.md` goals. Optionally publish `packages/*` artifacts from release branches.

### 7. Documentation

1. Update or create sections in `docs/monorepo/overview.md`, `docs/monorepo/mcp-integrations.md`, and `docs/monorepo/plugins.md` describing the structure, tooling, and any platform integrations.
2. Capture developer workflow (install, lint, test, build, serve, migrate) in `README.md` and `docs/usage.md`. Include `justfile` usage with examples like `just check`, `just dev-setup`, `just serve-api`.
3. Add a "Task Runner" section in `README.md` explaining Just installation and common commands.
4. Document Git Hooks in `README.md` and `ARCHITECTURE.md`:
   - Explain three hooks: pre-commit (lint), pre-push (test+build), commit-msg (format)
   - Show how to skip hooks when needed (emergency situations): `git commit --no-verify`
   - Explain why each hook exists and what it prevents
5. Note optional add-ons (observability, DB tooling, MCP integrations) only when explicitly installed; keep defaults lean.
6. Record follow-up tasks or decisions in `monorepo-alignment-notes.md`.

## Output

Provide:

- Summary of files created/updated and scripts added.
- Commands executed (in order) for reproducibility.
- Next steps for the team (e.g., `pnpm install`, `docker compose up -d`, `pnpm nx graph`, `uv sync`, `pnpm nx affected:test`).
- Open questions or TODOs that require stakeholder confirmation.
