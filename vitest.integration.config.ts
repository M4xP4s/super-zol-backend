import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@libs/shared-util': resolve(__dirname, 'libs/shared-util/src'),
      '@services/kaggle-data-api': resolve(__dirname, 'services/kaggle-data-api/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    // Integration tests run sequentially to avoid resource conflicts
    threads: false,
    // Longer timeout for integration tests (K8s port-forward, DB queries)
    testTimeout: 30000,
    hookTimeout: 60000,
    coverage: {
      enabled: false, // Coverage is for unit tests, not integration tests
    },
  },
});
