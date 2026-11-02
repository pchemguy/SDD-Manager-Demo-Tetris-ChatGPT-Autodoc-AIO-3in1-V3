/** Static application bundling; relative URLs support all delivery shells. */
import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

export default defineConfig(({mode})=>({ base: './', worker:{format:'es'}, plugins:[{name:'desktop-entry',transformIndexHtml:{order:'pre',handler(html){return mode==='desktop'?html.replace('/src/entry/browser.ts','/src/entry/desktop.ts'):html;}},generateBundle(){if(mode==='desktop'&&![...this.getModuleIds()].some(id=>id.endsWith('/src/entry/desktop.ts')))throw Error('Desktop renderer entry was not bundled.');}},{name:'portable-schema-asset',apply:'build',generateBundle(){this.emitFile({type:'asset',fileName:'schemas/snapshot.schema.json',source:readFileSync(new URL('./schemas/snapshot.schema.json',import.meta.url))});}}], build: { outDir: mode==='desktop'?'dist/desktop/renderer':'dist/browser', emptyOutDir: true } }));
