Title: Phase 2 completion — Compose-based integration, CJS bundle stability, and CI updates

Problem Statement

- Finish Phase 2 by ensuring the Kaggle Data API deploys and responds
- Provide reliable integration tests that run locally and in CI using Docker Compose and the service image
- Address bundling/runtime issues discovered during containerization

Summary of Changes

- Integration tests via Docker Compose
  - Added orchestration file: docker-compose.integration.yml
  - New runner: scripts/run-integration-tests.sh (Compose v2 aware, robust health waits, CI=true export)
  - Added SQL migration files for Compose: services/kaggle-data-api/helm/migrations/001-create-datasets-table.sql and 002-seed-mock-data.sql
  - Docs: docs/INTEGRATION-TESTS-DOCKER-COMPOSE.md (local + CI flow and troubleshooting)

- Service runtime stabilization (container)
  - Switch esbuild output to CommonJS for `kaggle-data-api` and adjust base dir for AutoLoad
  - Change main startup to use the manually-registered `build()` (avoids TS autoload at runtime)
  - Disable Swagger UI in bundled runtime; serve lightweight `/docs` placeholder; keep `/json` available
  - Align env for DB: use `DB_*` and `DATABASE_URL`; bind to `HOST=0.0.0.0`; set `NODE_ENV=development` in Compose for permissive CORS
  - Add `BUNDLE_RUNTIME=true` in Dockerfile to signal UI disablement

- CI workflow update
  - .github/workflows/integration.yml updated to run the Compose-based script end-to-end
  - Removes ad-hoc service container setup and background Node process in favor of Docker Compose orchestration

- API fixes for tests and readiness
  - Health readiness now includes top-level `database` field (and keeps nested `checks.database`)
  - CORS preflight succeeds in Compose by using `NODE_ENV=development`

Verification

- Local: just test-integration → builds image, starts Compose, applies migrations, runs Vitest; 24/24 tests pass
- CI: integration workflow invokes the same script; no K8s required

Docs

- Added: docs/INTEGRATION-TESTS-DOCKER-COMPOSE.md with full orchestration details for local and CI

Impact / Notes

- Swagger UI static assets are not served in bundled runtime; `/docs` is a placeholder, `/json` remains available
- Helm/K8s paths are unchanged; Compose exists solely for integration testing

Checklist

- [x] Phase 2 acceptance: API deploys and responds
- [x] Integration tests pass locally (Compose)
- [x] Integration tests configured for CI (Compose)
- [x] Updated CHANGELOG.md
- [x] Added integration test documentation
