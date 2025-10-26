/**
 * API Health Check Integration Tests
 * Tests health endpoints against real service
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { ApiClient } from '../helpers/api-client.js';
import { getTestConfig } from '../helpers/test-config.js';

describe('API Health Checks', () => {
  let apiClient: ApiClient;

  beforeAll(() => {
    const config = getTestConfig();
    apiClient = new ApiClient({ baseUrl: config.api.baseUrl });
  });

  it('GET /health returns 200', async () => {
    const response = await apiClient.get('/health');
    expect(response.status).toBe(200);
  });

  it('GET /health/live returns 200', async () => {
    const response = await apiClient.get('/health/live');
    expect(response.status).toBe(200);
  });

  it('GET /health/ready returns 200', async () => {
    const response = await apiClient.get('/health/ready');
    expect(response.status).toBe(200);
  });

  it('GET /health/ready returns database status', async () => {
    const data = await apiClient.getJson<{ status: string; database: string }>('/health/ready');
    expect(data).toHaveProperty('database');
    expect(data.database).toBe('healthy');
  });
});
