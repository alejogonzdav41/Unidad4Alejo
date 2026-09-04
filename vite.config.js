import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/chunk-[name]-[hash].js'
      }
    }
  }
});