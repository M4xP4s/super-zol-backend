/**
 * API Security Integration Tests
 * Tests CORS, rate limiting, and security headers
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { ApiClient } from '../helpers/api-client.js';
import { getTestConfig } from '../helpers/test-config.js';

describe('API Security', () => {
  let apiClient: ApiClient;

  beforeAll(() => {
    const config = getTestConfig();
    apiClient = new ApiClient({ baseUrl: config.api.baseUrl });
  });

  it('OPTIONS / includes CORS headers', async () => {
    const response = await fetch(`${getTestConfig().api.baseUrl}/`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
      },
    });

    const corsHeader = response.headers.get('access-control-allow-origin');
    expect(corsHeader).toBeTruthy();
  });

  it('GET / includes rate limit headers', async () => {
    // Make a few requests to trigger rate limiting headers
    for (let i = 0; i < 3; i++) {
      await apiClient.get('/');
    }

    const response = await apiClient.get('/');
    const rateLimitHeader =
      response.headers.get('x-ratelimit-limit') || response.headers.get('x-ratelimit-remaining');

    expect(rateLimitHeader).toBeTruthy();
  });
});
