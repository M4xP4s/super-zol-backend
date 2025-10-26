import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@libs/shared-util': resolve(__dirname, 'libs/shared-util/src'),
      '@libs/test-lib': resolve(__dirname, 'libs/test-lib/src'),
      '@libs/test-utils': resolve(__dirname, 'libs/test-utils/src'),
      '@services/kaggle-data-api': resolve(__dirname, 'services/kaggle-data-api/src'),
      'shared-util': resolve(__dirname, 'libs/shared-util/src/index.ts'),
      'test-lib': resolve(__dirname, 'libs/test-lib/src/index.ts'),
      'test-utils': resolve(__dirname, 'libs/test-utils/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['node_modules/', 'dist/', '**/*.spec.ts', '**/*.test.ts', '**/main.ts'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
