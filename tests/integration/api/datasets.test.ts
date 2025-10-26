/**
 * API Dataset Endpoints Integration Tests
 * Tests dataset CRUD operations against real service and database
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { ApiClient } from '../helpers/api-client.js';
import { getTestConfig } from '../helpers/test-config.js';

describe('API Dataset Endpoints', () => {
  let apiClient: ApiClient;

  beforeAll(() => {
    const config = getTestConfig();
    apiClient = new ApiClient({ baseUrl: config.api.baseUrl });
  });

  it('GET / returns API info', async () => {
    const response = await apiClient.get('/');
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('Kaggle Data API');
  });

  it('GET /v1/info returns version information', async () => {
    const data = await apiClient.getJson<{ version: string }>('/v1/info');
    expect(data).toHaveProperty('version');
  });

  it('GET /docs returns Swagger UI', async () => {
    const response = await apiClient.get('/docs');
    expect(response.status).toBe(200);
  });

  it('GET /datasets returns datasets array', async () => {
    const data = await apiClient.getJson<{ datasets: unknown[]; total: number }>('/datasets');
    expect(data).toHaveProperty('datasets');
    expect(Array.isArray(data.datasets)).toBe(true);
    expect(data).toHaveProperty('total');
  });

  it('GET /datasets returns 10 mock datasets', async () => {
    const data = await apiClient.getJson<{ datasets: unknown[]; total: number }>('/datasets');
    expect(data.total).toBe(10);
  });

  it('GET /datasets/1 returns Titanic dataset', async () => {
    const data = await apiClient.getJson<{ name: string }>('/datasets/1');
    expect(data).toHaveProperty('name');
    expect(data.name).toBe('titanic');
  });

  it('GET /datasets?limit=5 respects pagination limit', async () => {
    const data = await apiClient.getJson<{ datasets: unknown[] }>('/datasets?limit=5&offset=0');
    expect(data.datasets.length).toBeLessThanOrEqual(5);
  });

  it('GET /datasets/9999 returns 404', async () => {
    const response = await apiClient.get('/datasets/9999');
    expect(response.status).toBe(404);
  });
});
