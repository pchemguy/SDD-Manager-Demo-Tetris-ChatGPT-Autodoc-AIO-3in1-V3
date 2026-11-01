/** Static application bundling; relative URLs support all delivery shells. */
import { defineConfig } from 'vite';

export default defineConfig({ base: './', build: { outDir: 'dist/browser', emptyOutDir: true } });
