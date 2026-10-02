import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' keeps every asset path relative, so the same build works at
// https://aditya-eng.github.io/SIH26061/, on Netlify, or opened from a laptop.
export default defineConfig({
  base: './',
  plugins: [react({ jsxImportSource: '@emotion/react' })],
  build: { outDir: 'dist', chunkSizeWarningLimit: 900 },
});
