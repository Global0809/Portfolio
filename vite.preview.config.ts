import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Portfolio/',
  build: { outDir: 'pages-dist' },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
});
