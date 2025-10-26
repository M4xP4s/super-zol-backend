import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../../src/app/app.js';
import { FastifyInstance } from 'fastify';

describe('CORS configuration', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should include CORS headers', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/',
      headers: {
        origin: 'http://localhost:3000',
      },
    });

    expect(response.statusCode).toBe(200);
    // In development mode, CORS should allow all origins
    expect(response.headers).toHaveProperty('access-control-allow-origin');
  });

  it('should handle preflight OPTIONS requests', async () => {
    const response = await app.inject({
      method: 'OPTIONS',
      url: '/',
      headers: {
        origin: 'http://localhost:3000',
        'access-control-request-method': 'GET',
      },
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers).toHaveProperty('access-control-allow-origin');
    expect(response.headers).toHaveProperty('access-control-allow-methods');
  });
});
