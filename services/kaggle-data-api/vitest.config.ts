import { defineConfig } from 'vitest/config';
import baseConfig from '../../vitest.config.js';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: ['tests/**/*.{test,spec}.{js,ts}', 'src/**/*.{test,spec}.{js,ts}'],
    coverage: {
      ...baseConfig.test?.coverage,
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
    },
  },
});
