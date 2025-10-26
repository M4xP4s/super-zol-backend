import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../src/app/app.js';
import { FastifyInstance } from 'fastify';

describe('Kaggle Data API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Root routes', () => {
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

  describe('Health check routes', () => {
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
      expect(json.checks).toHaveProperty('redis');
    });
  });

  describe('Plugins', () => {
    it('should have sensible plugin registered', async () => {
      expect(app.hasPlugin('@fastify/sensible')).toBe(true);
    });

    it('should have CORS plugin registered', async () => {
      expect(app.hasPlugin('@fastify/cors')).toBe(true);
    });

    it('should have Helmet plugin registered', async () => {
      expect(app.hasPlugin('@fastify/helmet')).toBe(true);
    });

    it('should have Swagger plugin registered', async () => {
      expect(app.hasPlugin('@fastify/swagger')).toBe(true);
    });
  });

  describe('Swagger documentation', () => {
    it('should have OpenAPI spec available', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/docs/json',
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json).toHaveProperty('openapi');
      expect(json).toHaveProperty('info');
      expect(json.info.title).toBe('Kaggle Data API');
    });
  });
});
