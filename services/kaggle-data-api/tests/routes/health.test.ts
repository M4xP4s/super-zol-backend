import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { build } from '../../src/app/app.js';
import { FastifyInstance } from 'fastify';

describe('Health check routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();

    // Mock database for health checks
    app.db = {
      query: vi.fn().mockResolvedValue({ rows: [{ health: 1 }] }),
      connect: vi.fn(),
      end: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return OK on /health', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const json = response.json();
    expect(json).toHaveProperty('status', 'ok');
    expect(json).toHaveProperty('timestamp');
  });

  it('should return alive status on /health/live', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health/live',
    });

    expect(response.statusCode).toBe(200);
    const json = response.json();
    expect(json).toHaveProperty('status', 'alive');
  });

  it('should return ready status on /health/ready', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health/ready',
    });

    expect(response.statusCode).toBe(200);
    const json = response.json();
    expect(json).toHaveProperty('status', 'ready');
    expect(json).toHaveProperty('checks');
    expect(json.checks).toHaveProperty('database');
    expect(json.checks.database).toBe('healthy');
  });

  it('should return detailed health status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health/ready',
    });

    expect(response.statusCode).toBe(200);
    const json = response.json();
    expect(json.status).toBe('ready');
    expect(json.checks).toBeDefined();
    expect(json.checks.database).toBe('healthy');
  });

  it('should return 503 when database is unhealthy', async () => {
    // Mock database failure
    app.db.query = vi.fn().mockRejectedValue(new Error('Connection failed'));

    const response = await app.inject({
      method: 'GET',
      url: '/health/ready',
    });

    expect(response.statusCode).toBe(503);
    const json = response.json();
    expect(json.status).toBe('not_ready');
    expect(json.checks.database).toBe('unhealthy');
    expect(json.error).toBe('Database connectivity check failed');

    // Restore mock
    app.db.query = vi.fn().mockResolvedValue({ rows: [{ health: 1 }] });
  });
});
