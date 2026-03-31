import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  base: '/unify-table/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@unify/table-core': path.resolve(__dirname, '../packages/core/src/index.ts'),
      '@unify/table-react/styles': path.resolve(__dirname, '../packages/react/src/panels/panel.css'),
      '@unify/table-react/themes': path.resolve(__dirname, '../packages/react/src/styles/themes.css'),
      '@unify/table-react/displays': path.resolve(__dirname, '../packages/react/src/displays/display.css'),
      '@unify/table-react': path.resolve(__dirname, '../packages/react/src/index.ts'),
      '@unify/table-charts': path.resolve(__dirname, '../packages/charts/src/index.ts'),
    },
  },
  optimizeDeps: {
    exclude: ['@duckdb/duckdb-wasm'],
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'credentialsless',
    },
  },
});
