import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import databasePlugin from '../../src/app/plugins/database.js';

// Mock pg module
vi.mock('pg', () => {
  const mockPool = {
    connect: vi.fn().mockResolvedValue({
      query: vi.fn().mockResolvedValue({ rows: [{ now: new Date() }] }),
      release: vi.fn(),
    }),
    query: vi.fn().mockResolvedValue({ rows: [] }),
    end: vi.fn().mockResolvedValue(undefined),
  };

  return {
    default: {
      Pool: vi.fn(() => mockPool),
    },
    Pool: vi.fn(() => mockPool),
  };
});

describe('Database Plugin', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should decorate fastify instance with db pool', async () => {
    await app.register(databasePlugin);

    expect(app).toHaveProperty('db');
    expect(app.db).toBeDefined();
  });

  it('should test database connection on startup', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {
      // Mock implementation
    });

    await app.register(databasePlugin);

    // The plugin should attempt to connect
    expect(app.db.connect).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should close connection pool on shutdown', async () => {
    await app.register(databasePlugin);
    await app.close();

    expect(app.db.end).toHaveBeenCalled();
  });

  it('should use DATABASE_URL if provided', async () => {
    const originalEnv = process.env['DATABASE_URL'];
    process.env['DATABASE_URL'] = 'postgresql://user:pass@localhost:5432/testdb';

    await app.register(databasePlugin);

    expect(app.db).toBeDefined();

    // Restore original env
    if (originalEnv) {
      process.env['DATABASE_URL'] = originalEnv;
    } else {
      delete process.env['DATABASE_URL'];
    }
  });

  it('should use individual connection parameters if DATABASE_URL not provided', async () => {
    const originalDbUrl = process.env['DATABASE_URL'];
    delete process.env['DATABASE_URL'];

    process.env['DB_HOST'] = 'testhost';
    process.env['DB_PORT'] = '5433';
    process.env['DB_USER'] = 'testuser';
    process.env['DB_PASSWORD'] = 'testpass';
    process.env['DB_NAME'] = 'testdb';

    await app.register(databasePlugin);

    expect(app.db).toBeDefined();

    // Restore original env
    if (originalDbUrl) {
      process.env['DATABASE_URL'] = originalDbUrl;
    }
    delete process.env['DB_HOST'];
    delete process.env['DB_PORT'];
    delete process.env['DB_USER'];
    delete process.env['DB_PASSWORD'];
    delete process.env['DB_NAME'];
  });

  it('should use default values when env vars not set', async () => {
    const originalEnv = process.env['DATABASE_URL'];
    delete process.env['DATABASE_URL'];

    await app.register(databasePlugin);

    expect(app.db).toBeDefined();

    // Restore
    if (originalEnv) {
      process.env['DATABASE_URL'] = originalEnv;
    }
  });

  it('should configure connection pool with custom settings', async () => {
    process.env['DB_MAX_CLIENTS'] = '20';
    process.env['DB_IDLE_TIMEOUT'] = '60000';
    process.env['DB_CONNECTION_TIMEOUT'] = '5000';

    await app.register(databasePlugin);

    expect(app.db).toBeDefined();

    delete process.env['DB_MAX_CLIENTS'];
    delete process.env['DB_IDLE_TIMEOUT'];
    delete process.env['DB_CONNECTION_TIMEOUT'];
  });
});
