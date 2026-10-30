import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    exclude: ['**/node_modules/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/domain/**/*.ts'],
      thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
      exclude: ['src/main.ts', '**/infra/Browser.ts'],
    },
  },
});
