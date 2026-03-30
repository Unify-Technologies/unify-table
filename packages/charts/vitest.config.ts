import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@unify/table-core': path.resolve(__dirname, '../core/src/index.ts'),
    },
  },
});
