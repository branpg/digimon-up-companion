import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  // Set publicDir to a non-existent directory during tests so Vite doesn't
  // block imports from the actual public/ directory
  publicDir: false,
  resolve: {
    alias: {
      '/js/': path.resolve(__dirname, 'public/js/') + '/',
    }
  },
  test: {
    // Allow tests to import from public/ via aliases
  }
});
