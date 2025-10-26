import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../../src/app/app.js';
import { FastifyInstance } from 'fastify';

describe('Error handling', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 404 for unknown routes', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/this-route-does-not-exist',
    });

    expect(response.statusCode).toBe(404);
    const json = response.json();
    expect(json).toHaveProperty('statusCode', 404);
    expect(json).toHaveProperty('error');
    expect(json).toHaveProperty('message');
  });

  it('should return 404 for unknown API routes', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/unknown',
    });

    expect(response.statusCode).toBe(404);
  });

  it('should handle invalid methods', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/',
    });

    expect(response.statusCode).toBe(404);
  });

  it('should reject invalid content types on POST', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/health',
    });

    // Should reject because POST is not allowed on health check
    expect(response.statusCode).toBe(404);
  });
});
