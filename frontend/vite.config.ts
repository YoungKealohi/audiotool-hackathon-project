/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // The SDK has a dynamic import to @connectrpc/connect-node for non-browser usage.
      // In browser builds we must force a no-op shim to avoid pulling Node-only modules.
      '@connectrpc/connect-node': path.resolve(__dirname, 'src/shims/connect-node-browser.ts'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    globals: true,
    reporters: ['default', 'junit'],
    outputFile: { junit: '../test-results/frontend-junit.xml' },
  },
});
