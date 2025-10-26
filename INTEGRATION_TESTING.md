# Integration Testing Guide

This document describes how to run and write integration tests for the Super Zol Backend monorepo.

## Quick Start

### Run All Integration Tests

```bash
just test-integration
```

### Run Integration Tests in Watch Mode

```bash
just test-integration-watch
```

### Run Specific Integration Test File

```bash
pnpm exec vitest tests/integration/docker-compose.test.ts --run
```

## Test Structure

Integration tests are located in `tests/integration/` directory at the root of the monorepo, separate from unit tests which live in each project's `tests/` directory.

### Current Integration Tests

1. **Docker Compose Configuration Tests** (`tests/integration/docker-compose.test.ts`)
   - Validates docker-compose configuration syntax and structure
   - Verifies service configuration (ports, environment variables, healthchecks)
   - Checks Dockerfile structure and security settings
   - Validates database module exports and functions
   - Tests route implementations

## Writing Integration Tests

### Best Practices

1. **File Organization**: Place integration tests in `tests/integration/` directory
2. **Naming**: Use `.test.ts` or `.spec.ts` suffix
3. **Test Structure**: Group related tests with `describe()` blocks
4. **Setup/Teardown**: Use `beforeEach()`, `afterEach()` hooks for test fixtures
5. **Assertions**: Use descriptive test names that explain what is being tested

### Example Integration Test

```typescript
import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

describe('MyIntegration', () => {
  it('should verify configuration is valid', async () => {
    const filePath = resolve(process.cwd(), 'config.yml');
    const content = await readFile(filePath, 'utf-8');

    // Assertions
    expect(content).toBeDefined();
    expect(content).toContain('production');
  });
});
```

## CI/CD Integration

Integration tests run as part of the complete test suite:

```bash
# Run all tests (unit + integration)
just test

# Run integration tests only
just test-integration
```

## Troubleshooting

### Module Resolution Issues

If you encounter module resolution errors in tests:

1. Ensure the `vite-tsconfig-paths` plugin is configured in `vitest.config.ts`
2. Check that path aliases in `tsconfig.base.json` are correct
3. Use the `-i` flag with vitest for interactive debugging

### Docker-Related Test Failures

For docker-compose tests:

1. Verify Docker daemon is running
2. Check docker-compose file paths are correct
3. Ensure YAML syntax is valid with: `docker-compose config`

## Performance Considerations

- Integration tests are slower than unit tests due to file I/O and external services
- Run affected tests only during development: `pnpm nx affected -t test`
- Use test filtering to run specific tests: `vitest tests/integration --run -- --grep "pattern"`

## References

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
