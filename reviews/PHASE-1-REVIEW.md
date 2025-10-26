# Phase 1 Review

Status: Ready for merge

## P1 — Nx flags forwarding in test wrapper

- Severity: P1 (Must Fix Before Merge)
- Affected: `scripts/run-tests.mjs`
- Symptom:
  - Adding `--` before forwarded args made Nx treat them as executor flags, so `pnpm test --skip-nx-cache` (and similar) were sent to Vitest instead of Nx.
  - Vitest then printed `Unknown option --skip-nx-cache`, and Nx did not disable its cache.
  - Related to earlier hang root cause where watch flags could be misrouted; we now also filter `-w/--w/--watch` and force CI env to avoid watch mode entirely.
- Root cause:
  - The wrapper appended `'--', ...filtered` to the Nx command, which bypasses Nx CLI parsing for those flags.
- Fix:
  - Forward flags directly to Nx (no `--` sentinel) and keep stripping watch flags.
  - Force `CI=1` and `VITEST_WATCH=false` to prevent accidental watch.
- Patch summary:
  - `scripts/run-tests.mjs`
    - Before:
      ```js
      const args = ['nx', 'run-many', '-t', 'test'];
      if (filtered.length) args.push('--', ...filtered);
      ```
    - After:
      ```js
      const args = ['nx', 'run-many', '-t', 'test'];
      if (filtered.length) args.push(...filtered);
      ```
- Verification:
  - `node scripts/run-tests.mjs --skip-nx-cache` runs with Nx parsing `--skip-nx-cache`; Vitest no longer reports unknown option, and tests exit cleanly.
  - Full chain runs non-interactively and exits: `helm lint` (libs + job), `pnpm -s lint`, `pnpm -s test -w`, `pnpm -s nx build fetch-kaggle --configuration=production`.
- PR: https://github.com/M4xP4s/super-zol-backend/pull/14

## Notes

- Phase 1 deliverables (generators + fetch-kaggle chart) landed; CI validations (title/body, lint, test, build) all green.
- Helm chart placement updated per guidelines: `services/*/helm`, `jobs/*/helm`.
