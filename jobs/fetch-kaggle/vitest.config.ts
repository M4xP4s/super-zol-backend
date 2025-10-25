import { defineConfig } from 'vitest/config';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { getDirname } from '../../libs/shared-util/src/lib/esm-utils.js';

const __dirname = getDirname(import.meta.url);

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/jobs/fetch-kaggle',
  plugins: [nxViteTsPaths()],
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/jobs/fetch-kaggle',
      provider: 'v8',
      reporter: ['text', 'lcov', 'html', 'json-summary'],
      include: ['src/lib/**/*.ts', 'src/core/services/**/*.ts', 'src/infrastructure/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/node_modules/**',
        '**/dist/**',
        '**/tests/**',
        '**/ports/**/*.ts', // Exclude interfaces/ports from coverage
        'src/cli/**/*.ts', // CLI tested via integration tests, not unit coverage
        'src/core/domain/**/*.ts', // Domain entities are pure data structures
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 80, // Target 80% - remaining gaps are defensive error handling
        statements: 90,
      },
    },
  },
});
