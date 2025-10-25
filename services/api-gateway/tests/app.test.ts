import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../src/app/app.js';
import { FastifyInstance } from 'fastify';

describe('API Gateway', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 200 on root endpoint', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ message: 'Hello API' });
  });

  it('should have sensible plugin registered', async () => {
    expect(app.hasPlugin('@fastify/sensible')).toBe(true);
  });
});
