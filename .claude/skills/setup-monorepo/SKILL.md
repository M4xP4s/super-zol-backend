name: setup-monorepo
allowed-tools: Read, Write, Edit, Bash
argument-hint: "[profile] | --typescript-only | --polyglot | --with-python | --minimal"
description: Align Nx + uv monorepo scaffolding with pnpm 10, Node 22, and shared quality gates
---

# Setup Polyglot Monorepo

You are the monorepo architect ensuring this workspace matches the baseline defined in the external documentation set. Default to the Nx + pnpm pattern from the reference workspace, adding Python uv packages only when requested.

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
- Existing projects: !`find apps libs python -maxdepth 2 -mindepth 1 2>/dev/null | sort`
- Testing hooks: @.husky/pre-commit, @.lintstagedrc.json, @.pre-commit-config.yaml

## Task

Implement the production-ready polyglot monorepo baseline:

- **Default profile**: Nx + pnpm TypeScript stack with strict lint/test coverage.
- **Flags**:
  - `--typescript-only`: skip Python steps.
  - `--with-python` / `--polyglot`: scaffold uv-based Python packages mirroring the Nx layout.
  - `--minimal`: omit Husky, lint-staged, and optional marketplace installs.

### 1. Toolchain Alignment

1. Enforce Node 22 and pnpm 10 via `.nvmrc`, `.node-version`, and `packageManager` in `package.json`.
2. Run `corepack enable pnpm` and `pnpm env use --global 22` so contributors inherit the runtime.
3. Pin Nx 19.8 with `pnpm dlx create-nx-workspace@19.8.0` (if not already) or update `nx.json`/`package.json` devDependencies accordingly.
4. Record versions in `docs/monorepo/dependencies.md` when changes occur.

### 2. Scaffold Nx Workspace

1. Maintain `apps/` and `libs/` directories with tags (`scope:app`, `scope:shared`, `type:api`, etc.) like the reference monorepo.
2. Generate base projects (`apps/api`, `apps/web`, `libs/backend/core`, `libs/shared/util`) using `pnpm nx g` schematics.
3. Copy strict TypeScript configuration: update `tsconfig.base.json` path aliases, enable `strict`, `noUncheckedIndexedAccess`, and module resolution that matches the baseline.
4. Configure `eslint.config.mjs` with flat config, Nx module-boundary rules, and formatting commands aligned with the reference `node22-nx-pnpm-vitest-monorepo/docs/engineering-standards.md`.
5. Add Vitest configs for each app/lib (`coverageProvider: "v8"`) enforcing ≥90 % lines/statements/functions/branches.

### 3. Python uv Packages (when `--with-python` or `--polyglot`)

1. Create `python/services/` and `python/packages/` to mirror Nx `apps`/`libs`.
2. For each requested component, run `uv init python/services/<name>` or `uv init python/packages/<name>` and set `requires-python = ">=3.11"`.
3. Configure `pyproject.toml` with `ruff`, `mypy`/`pyright`, `pytest`, `coverage`, and scripts (`lint`, `typecheck`, `test`) that match TypeScript expectations.
4. Define shared tooling in `python/uv.lock` via `uv sync`; add commands to the root `package.json` (e.g., `"py:lint": "uv run ruff check python"`).
5. Install `pre-commit` hooks executing ruff/mypy/pytest unless `--minimal`.

### 4. Workspace & Dependency Management

1. Update `pnpm-workspace.yaml` globs to include `python/**` when polyglot workflow requires Node tooling to trigger Python scripts.
2. Configure `nx.json` `targetDefaults` for `lint`, `test`, `build`, and `format` with caching, `dependsOn`, and environment variables for coverage thresholds.
3. Use workspace protocol (`"workspace:*"`) for shared TypeScript libraries; ensure `project.json` files include appropriate tags to guard imports.
4. Document dependency additions in `docs/monorepo/overview.md` and `docs/monorepo/plugins.md` (especially when enabling optional marketplace plugins).

### 5. Automation & CI/CD

1. Install Husky + lint-staged (`pnpm dlx husky-init && pnpm install lint-staged -D`) unless `--minimal`; ensure pre-commit runs `pnpm lint`, `pnpm test`, and optionally Python hooks.
2. Add CI workflow steps: `pnpm install --frozen-lockfile`, `pnpm nx run-many -t lint test build`, and, for polyglot setups, `uv sync` + `uv run pytest --cov`.
3. Wire Nx `affected` commands for incremental builds; include `pnpm nx graph --focus` for debugging dependency issues.
4. Surface coverage artifacts and docs in pipeline outputs per `docs/monorepo/roadmap.md` goals.

### 6. Documentation & Integrations

1. Update or create sections in `docs/monorepo/overview.md`, `docs/monorepo/mcp-integrations.md`, and `docs/monorepo/plugins.md` describing the resulting structure, tooling, and active MCP servers.
2. Capture developer workflow (install, lint, test, build commands) in `README.md` and `docs/usage.md`.
3. Note optional add-ons (Zen MCP, NotebookLM skill, etc.) only when explicitly installed; keep contexts lean by default.
4. Record follow-up tasks or decisions in `monorepo-alignment-notes.md`.

## Output

Provide:

- Summary of files created/updated and scripts added.
- Commands executed (in order) for reproducibility.
- Next steps for the team (e.g., `pnpm install`, `pnpm nx graph`, `uv sync`, `pnpm nx affected:test`).
- Open questions or TODOs that require stakeholder confirmation.
