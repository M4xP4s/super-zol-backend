/**
 * Test Configuration
 * Environment-specific configuration for integration tests
 */

export interface TestConfig {
  api: {
    baseUrl: string;
  };
  database: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
}

/**
 * Get configuration for local K8s environment (Kind cluster)
 */
export function getLocalConfig(): TestConfig {
  return {
    api: {
      // Assumes kubectl port-forward or direct access to service
      baseUrl: process.env.API_BASE_URL ?? 'http://localhost:3001',
    },
    database: {
      host: process.env.POSTGRES_HOST ?? 'localhost',
      port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
      database: process.env.POSTGRES_DB ?? 'kaggle_data',
      user: process.env.POSTGRES_USER ?? 'postgres',
      password: process.env.POSTGRES_PASSWORD ?? 'postgres',
    },
  };
}

/**
 * Get configuration for CI environment (GitHub Actions)
 */
export function getCiConfig(): TestConfig {
  return {
    api: {
      // In CI, we'll use direct service URL
      baseUrl: process.env.API_BASE_URL ?? 'http://localhost:3001',
    },
    database: {
      // GitHub Actions service containers use localhost
      host: process.env.POSTGRES_HOST ?? 'localhost',
      port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
      database: process.env.POSTGRES_DB ?? 'test_db',
      user: process.env.POSTGRES_USER ?? 'test_user',
      password: process.env.POSTGRES_PASSWORD ?? 'test_password',
    },
  };
}

/**
 * Get test configuration based on environment
 */
export function getTestConfig(): TestConfig {
  const isCI = process.env.CI === 'true';
  return isCI ? getCiConfig() : getLocalConfig();
}
