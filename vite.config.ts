/** Static application bundling; relative URLs support all delivery shells. */
import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

export default defineConfig({ base: './', worker:{format:'es'}, plugins:[{name:'portable-schema-asset',apply:'build',generateBundle(){this.emitFile({type:'asset',fileName:'schemas/snapshot.schema.json',source:readFileSync(new URL('./schemas/snapshot.schema.json',import.meta.url))});}}], build: { outDir: 'dist/browser', emptyOutDir: true } });
