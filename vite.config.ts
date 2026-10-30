import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: { host: '0.0.0.0', watch: { usePolling: true } },
  build: { outDir: 'dist' },
});
