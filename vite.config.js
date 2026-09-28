import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 8192,
    cssMinify: true,
    minify: 'esbuild',
    target: 'es2019'
  },
  server: {
    port: 5173
  }
})
