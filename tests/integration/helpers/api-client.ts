/**
 * API Client Helper for Integration Tests
 * Provides utilities for making HTTP requests to services running in K8s
 */

export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
}

export class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout ?? 5000;
  }

  async get(path: string, options?: RequestInit): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        method: 'GET',
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async post(path: string, body?: unknown, options?: RequestInit): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async getJson<T = unknown>(path: string, options?: RequestInit): Promise<T> {
    const response = await this.get(path, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return (await response.json()) as T;
  }

  async expectStatus(path: string, expectedStatus: number): Promise<boolean> {
    const response = await this.get(path);
    return response.status === expectedStatus;
  }

  async expectJson(path: string, expectedField: string): Promise<boolean> {
    try {
      const data = await this.getJson(path);
      return typeof data === 'object' && data !== null && expectedField in data;
    } catch {
      return false;
    }
  }
}
