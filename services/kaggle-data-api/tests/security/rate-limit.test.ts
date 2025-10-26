import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../../src/app/app.js';
import { FastifyInstance } from 'fastify';

describe('Rate limiting', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should have rate limit plugin registered', async () => {
    expect(app.hasPlugin('@fastify/rate-limit')).toBe(true);
  });

  it('should include rate limit headers', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers).toHaveProperty('x-ratelimit-limit');
    expect(response.headers).toHaveProperty('x-ratelimit-remaining');
    expect(response.headers).toHaveProperty('x-ratelimit-reset');
  });

  it('should track rate limit consumption', async () => {
    const response1 = await app.inject({
      method: 'GET',
      url: '/',
    });

    const response2 = await app.inject({
      method: 'GET',
      url: '/',
    });

    const limit1 = parseInt(response1.headers['x-ratelimit-remaining'] as string);
    const limit2 = parseInt(response2.headers['x-ratelimit-remaining'] as string);

    // Second request should have fewer remaining requests
    expect(limit2).toBeLessThan(limit1);
  });
});
