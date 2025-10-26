import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../../src/app/app.js';
import { FastifyInstance } from 'fastify';

describe('Root routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return API info on root endpoint', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/',
    });

    expect(response.statusCode).toBe(200);
    const json = response.json();
    expect(json).toHaveProperty('message', 'Hello from Kaggle Data API');
    expect(json).toHaveProperty('version', '0.1.0');
    expect(json).toHaveProperty('timestamp');
  });

  it('should return detailed info on /v1/info', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/info',
    });

    expect(response.statusCode).toBe(200);
    const json = response.json();
    expect(json).toHaveProperty('name', 'Kaggle Data API');
    expect(json).toHaveProperty('version', '0.1.0');
    expect(json).toHaveProperty('description');
    expect(json).toHaveProperty('uptime');
    expect(json).toHaveProperty('timestamp');
  });
});
