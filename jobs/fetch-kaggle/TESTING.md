# Testing Guide (fetch-kaggle)

This project uses Vitest with strict TypeScript and high coverage targets. Tests are split into unit, integration, and opt-in performance suites.

## Commands

- Run all tests: `pnpm nx test fetch-kaggle`
- Watch mode: `pnpm nx test fetch-kaggle --watch`
- With coverage: `pnpm nx test fetch-kaggle --coverage --run`
- Only perf (opt-in): `RUN_BENCHMARKS=1 pnpm nx test fetch-kaggle --run --testPathPattern=tests/perf`

Coverage thresholds (enforced in vitest.config.ts):

- Lines: 90%
- Statements: 90%
- Functions: 90%
- Branches: 80%

## Structure

- `tests/unit/` – pure units, fast and isolated
- `tests/integration/` – modules working together (no network)
- `tests/fixtures/` – deterministic datasets for repeatable tests
- `tests/helpers/` – reusable helpers (tmp dirs, CSV writer)
- `tests/perf/` – large I/O or perf baselines (guarded by env)

## Conventions

- Use `vi.spyOn` and module mocks (e.g., `execa`) with cleanup per test
- Avoid real network and system side-effects; use adapters and mocks
- Keep fixtures tiny and deterministic; synthesize larger ones on demand
- Reset environment variables in tests that modify `process.env`

## Helper APIs

`tests/helpers/tmp.ts` exposes:

- `makeTempDir(): Promise<string>` – create a temp workspace
- `cleanupTempDir(dir: string): Promise<void>` – remove temp workspace
- `writeCSV(filePath: string, rows: string[][]): Promise<void>` – synthesize small CSVs
- `createDirStructure(base: string, spec: Record<string, any>): Promise<void>` – build nested dirs/files

## Tips

- If a mock is not applied, ensure `vi.mock()` runs before importing modules that consume it
- Increase timeouts sparingly: `it('...', async () => { ... }, 30000)`
- For OS-specific behaviors (chmod on Windows), guard with `process.platform`

## CLI Integration

Prefer importing orchestrators for integration tests. For CLI E2E style tests, build once and execute Node on the dist bundle:

```bash
pnpm nx build fetch-kaggle
node dist/jobs/fetch-kaggle/src/cli/index.js auth --check-only || true
```

## Reports

- HTML coverage: `coverage/jobs/fetch-kaggle/index.html`
- Summary JSON: `coverage/jobs/fetch-kaggle/coverage-summary.json`
