# Integration Tests via Docker Compose

This document describes how the kaggle-data-api integration tests run both locally and in CI using Docker Compose, the service Docker image, and a real PostgreSQL instance.

## Overview

- Orchestration: `docker-compose.integration.yml` (root)
- Services:
  - `postgres` → PostgreSQL 16 with healthcheck
  - `kaggle-data-api` → Built from `services/kaggle-data-api/Dockerfile`
- Test runner: `scripts/run-integration-tests.sh`
- Test suite: Vitest tests under `tests/integration/**`

## Service Orchestration

- `postgres`
  - Image: `postgres:16-alpine`
  - Env: `POSTGRES_USER=test_user`, `POSTGRES_PASSWORD=test_password`, `POSTGRES_DB=test_db`
  - Healthcheck: `pg_isready -U test_user -d test_db`
  - Port: `5432:5432` (host:container)

- `kaggle-data-api`
  - Built from source using the multi-stage Dockerfile
  - Env: database connection via `DB_*` variables
  - Port: `3001:3001` (service listens on `PORT=3001`)
  - Depends on postgres health; service has HTTP healthcheck to `/health/live`

Note on env vars: the service’s database plugin expects `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`. CI tests use `PG*` env vars for the test process itself, but the service container uses `DB_*`.

## Database Migrations

For Compose-based runs, migrations are applied by piping SQL into the `postgres` container:

- SQL files:
  - `services/kaggle-data-api/helm/migrations/001-create-datasets-table.sql`
  - `services/kaggle-data-api/helm/migrations/002-seed-mock-data.sql`

These files create the `datasets` table, indexes, trigger, and seed 10 mock datasets that the tests assert against.

## Local Execution

Prerequisites:

- Docker Desktop or Docker Engine with Compose v2
- Node.js 22 + pnpm (see `.nvmrc`, `package.json.engines`), run `pnpm install`

Run tests locally with one command:

```bash
just test-integration
# or
./scripts/run-integration-tests.sh
```

What the script does:

1. Builds the service via Nx (bundled output)
2. Starts `postgres` and `kaggle-data-api` with Compose
3. Waits for both containers to be healthy
4. Applies SQL migrations using `psql` inside the `postgres` container
5. Runs Vitest integration tests (`tests/integration/**`)
6. Tears down Compose stack and volumes

Ports after start:

- API: `http://localhost:3001`
- PostgreSQL: `localhost:5432` (test user/db/password as above)

## CI Execution (GitHub Actions)

We run the exact same flow in CI. The workflow invokes the same script which uses Docker Compose to orchestrate services, apply migrations, and run tests.

Key points:

- CI runner exposes the API at `http://localhost:3001`
- Tests use `CI=true` to read `PG*` environment variables
- The service container always uses `DB_*` variables

Example job outline:

```yaml
jobs:
  integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'pnpm'

      - name: Install deps
        run: pnpm install --frozen-lockfile

      - name: Run Docker Compose integration tests
        run: ./scripts/run-integration-tests.sh
```

## Troubleshooting

- Containers not healthy:
  - `docker compose -f docker-compose.integration.yml ps`
  - `docker compose -f docker-compose.integration.yml logs postgres`
  - `docker compose -f docker-compose.integration.yml logs kaggle-data-api`

- Test DB connection issues:
  - Ensure migrations ran successfully (see logs)
  - Confirm `DB_*` env vars on the service container

- Port conflicts:
  - Ensure nothing uses `5432` or `3001` locally
  - Adjust ports in `docker-compose.integration.yml` if needed

## Artifacts and Ownership

- Orchestration: `docker-compose.integration.yml`
- Runner: `scripts/run-integration-tests.sh`
- Tests: `tests/integration/**`
- Service Dockerfile: `services/kaggle-data-api/Dockerfile`
- Migrations: `services/kaggle-data-api/helm/migrations/*.sql`
