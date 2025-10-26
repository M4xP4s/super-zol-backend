import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../../src/app/app.js';
import { FastifyInstance } from 'fastify';

describe('Plugins', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should have sensible plugin registered', async () => {
    expect(app.hasPlugin('@fastify/sensible')).toBe(true);
  });

  it('should have CORS plugin registered', async () => {
    expect(app.hasPlugin('@fastify/cors')).toBe(true);
  });

  it('should have Helmet plugin registered', async () => {
    expect(app.hasPlugin('@fastify/helmet')).toBe(true);
  });

  it('should have rate limit plugin registered', async () => {
    expect(app.hasPlugin('@fastify/rate-limit')).toBe(true);
  });

  it('should have Swagger plugin registered', async () => {
    expect(app.hasPlugin('@fastify/swagger')).toBe(true);
  });
});
