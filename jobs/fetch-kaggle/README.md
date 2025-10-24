# fetch-kaggle Job

TypeScript migration of Kaggle dataset operations using **Hexagonal Architecture** (Ports & Adapters pattern) with Clean Architecture concepts.

## Architecture Overview

This project uses a **Hexagonal Architecture** to achieve:

- ✅ **Testability**: Business logic isolated from infrastructure
- ✅ **Flexibility**: Easy to swap implementations (mock for tests, real for production)
- ✅ **Maintainability**: Clear boundaries between layers
- ✅ **Type Safety**: Strict TypeScript with value objects and domain entities

### Directory Structure

```
jobs/fetch-kaggle/
├── src/
│   ├── core/                    # APPLICATION CORE (The Hexagon)
│   │   ├── domain/              # Domain layer
│   │   │   ├── entities/        # Business entities (manifest, profile, inventory)
│   │   │   └── value-objects/   # Immutable value objects (credentials, IDs)
│   │   ├── ports/               # Interfaces (contracts)
│   │   │   ├── inbound/        # PRIMARY PORTS (what our app does)
│   │   │   │   └── authenticate-kaggle.port.ts
│   │   │   └── outbound/       # SECONDARY PORTS (what our app needs)
│   │   │       └── kaggle-api.port.ts
│   │   └── services/            # Business logic implementation
│   │       └── auth.service.ts
│   ├── adapters/                # ADAPTERS (Infrastructure)
│   │   ├── primary/             # Inbound adapters (who calls us)
│   │   │   ├── cli/            # CLI commands
│   │   │   └── tests/          # Tests are adapters too!
│   │   └── secondary/           # Outbound adapters (what we call)
│   │       ├── kaggle-cli.adapter.ts    # Real Kaggle CLI
│   │       └── mock-kaggle-cli.adapter.ts  # Mock for tests
│   └── infrastructure/          # Cross-cutting concerns
│       ├── config.ts           # Configuration
│       └── zod-schemas.ts      # Runtime validation
├── tests/
│   ├── unit/                   # Unit tests (core logic)
│   ├── integration/            # Integration tests (adapters)
│   └── e2e/                    # End-to-end tests
├── data/                       # Data directories
│   ├── kaggle_raw/            # Downloaded datasets
│   ├── metadata/              # Profiles, manifests
│   └── reports/               # Generated reports
└── vitest.config.ts           # Vitest configuration (NOT Jest!)
```

## Key Concepts

### Hexagonal Architecture (Ports & Adapters)

**The Hexagon = Application Core**

- Contains business logic, domain entities, and use cases
- No dependencies on external frameworks or libraries
- Defines **ports** (interfaces) for everything it needs

**Primary Adapters (Driving)**

- Who uses our application
- Examples: CLI, REST API, tests
- They call **inbound ports**

**Secondary Adapters (Driven)**

- What our application uses
- Examples: Database, external APIs, file system
- They implement **outbound ports**

### Example: Authentication Flow

```typescript
// 1. PRIMARY PORT (Inbound) - Defines what our app can do
export interface IAuthenticateKaggle {
  execute(request: AuthRequest): Promise<AuthResponse>;
}

// 2. SECONDARY PORT (Outbound) - Defines what we need from external world
export interface IKaggleAPI {
  verify(credentials: KaggleCredentials): Promise<boolean>;
}

// 3. SERVICE (Core) - Implements business logic
export class AuthService implements IAuthenticateKaggle {
  constructor(private kaggleAPI: IKaggleAPI) {} // Depends on port, not implementation

  async execute(request: AuthRequest): Promise<AuthResponse> {
    // Business logic here
  }
}

// 4. SECONDARY ADAPTER - Real implementation
export class KaggleCLIAdapter implements IKaggleAPI {
  async verify(credentials: KaggleCredentials): Promise<boolean> {
    // Real Kaggle CLI call
  }
}

// 5. SECONDARY ADAPTER - Mock for tests
export class MockKaggleCLIAdapter implements IKaggleAPI {
  async verify(credentials: KaggleCredentials): Promise<boolean> {
    return true; // No external dependencies!
  }
}
```

## Testing with Hexagonal Architecture

Tests are **primary adapters** that drive the application core:

```typescript
describe('AuthService', () => {
  it('should authenticate with env credentials', async () => {
    // Arrange - wire up mock adapters
    const mockAPI = new MockKaggleCLIAdapter(true);
    const mockEnvStore = new MockCredentialStore({ username: 'test', apiKey: 'key123' });

    const service = new AuthService(mockAPI, mockEnvStore, mockFileStore);

    // Act
    const result = await service.execute({});

    // Assert
    expect(result.success).toBe(true);
    expect(result.source).toBe('env');
  });
});
```

**Benefits**:

- ✅ No external API calls in tests
- ✅ No file system access needed
- ✅ Fast, deterministic tests
- ✅ Easy to test edge cases

## Running Tests

```bash
# Run all tests
pnpm nx test fetch-kaggle

# Run tests in watch mode
pnpm nx test fetch-kaggle --watch

# Run with coverage (90% threshold enforced)
pnpm nx test fetch-kaggle --coverage
```

All tests use **Vitest** (NOT Jest - this monorepo uses Vitest consistently).

## Development Workflow (TDD)

Follow Test-Driven Development:

1. **RED**: Write failing test

```typescript
it('should download dataset to target directory', async () => {
  const downloader = new DownloadService(mockAPI, mockStorage);
  const result = await downloader.execute({ datasetId: 'test/dataset' });
  expect(result.success).toBe(true);
});
```

2. **GREEN**: Implement minimal code to pass

```typescript
export class DownloadService {
  async execute(request: DownloadRequest): Promise<DownloadResponse> {
    return { success: true }; // Minimal implementation
  }
}
```

3. **REFACTOR**: Clean up code while keeping tests passing

## Dependencies

**Runtime**:

- `zod` - Runtime type validation
- `execa` - Subprocess execution (Kaggle CLI)
- `csv-parse` - CSV parsing
- `date-fns` - Date manipulation
- `chalk` - Terminal colors
- `commander` - CLI framework

**Dev**:

- `vitest` - Test framework (already in monorepo)
- `@nx/vite` - Nx Vite plugin

## Build & Run

```bash
# Build
pnpm nx build fetch-kaggle

# Lint
pnpm nx lint fetch-kaggle

# Type check
tsc --noEmit -p jobs/fetch-kaggle
```

## Migration Status

Based on [TODO.md](TODO.md):

- ✅ **Phase 0**: Project setup, dependencies, directory structure
- ✅ **Phase 1**: Type definitions and Zod schemas
- ✅ **Demo**: Auth service with TDD tests (Hexagonal Architecture)
- ⏳ **Phase 2**: Utility functions (FS, Hash, CSV, Console)
- ⏳ **Phase 3**: Full authentication workflow
- ⏳ **Phase 4**: Dataset download
- ⏳ **Phase 5**: Inventory analysis
- ⏳ **Phase 6**: Schema profiling
- ⏳ **Phase 7**: CLI interface
- ⏳ **Phase 8**: Enhanced testing
- ⏳ **Phase 9**: Documentation
- ⏳ **Phase 10**: CI/CD validation

## Why Hexagonal Architecture?

**Vs. traditional layered architecture**:

- ✅ Better testability (swap adapters easily)
- ✅ Framework independence (not locked to Fastify, Express, etc.)
- ✅ Clear boundaries (ports make dependencies explicit)
- ✅ Pragmatic (simpler than full Clean Architecture)

**For fetch-kaggle specifically**:

- ✅ Easy to mock Kaggle CLI for tests
- ✅ Can swap file system implementation (in-memory for tests)
- ✅ CSV parsing abstracted behind ports
- ✅ Infrastructure-heavy app (benefits from clear adapters)

## References

- [TODO.md](TODO.md) - Full migration plan
- [CLAUDE.md](../../CLAUDE.md) - Project conventions
- [TIME_SAVE.md](../../TIME_SAVE.md) - Development tools
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/) - Original pattern
- [Ports & Adapters](https://herbertograca.com/2017/09/14/ports-adapters-architecture/) - Detailed explanation
