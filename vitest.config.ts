import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['**/src/**/*.ts', '**/src/**/*.tsx'],
      exclude: ['apps/**'],
    },
    projects: ['packages/*'],
    testTimeout: 60_000,
  },
});
