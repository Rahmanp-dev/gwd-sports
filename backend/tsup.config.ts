import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/**/*.ts'],
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  dts: true,
  target: 'esnext',
  minify: true,
  splitting: true,
  watch: process.env.NODE_ENV !== 'production',
});