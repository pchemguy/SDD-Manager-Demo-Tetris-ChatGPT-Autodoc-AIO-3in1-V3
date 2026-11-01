/** Compile canonical draft-2020-12 schema once; generated ESM requires no runtime compiler/eval. */
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import standaloneCode from 'ajv/dist/standalone/index.js';
const schema=JSON.parse(readFileSync(new URL('../schemas/snapshot.schema.json',import.meta.url),'utf8'));
const ajv=new Ajv2020({strict:true,allErrors:false,ownProperties:true,validateFormats:false,code:{source:true,esm:true}});
const validate=ajv.compile(schema),code=standaloneCode(ajv,validate);
// This schema deliberately uses bounded ASCII patterns, avoiding external Unicode-length helpers.
if(/\brequire\s*\(|\beval\s*\(|\bnew\s+Function\b/.test(code))throw Error('Standalone validator must be self-contained and eval-free.');
const output=new URL('../generated/',import.meta.url);mkdirSync(output,{recursive:true});
writeFileSync(new URL('snapshot-validator.mjs',output),'// Generated from schemas/snapshot.schema.json using pinned Ajv. Do not edit.\n'+code+'\n');
writeFileSync(new URL('snapshot-validator.d.mts',output),'declare function validate(input: unknown): boolean;\nexport default validate;\n');
