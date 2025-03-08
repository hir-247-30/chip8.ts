import * as esbuild from 'esbuild';

await esbuild.build({
    entryPoints: ['src/main/web.ts'],
    bundle     : true,
    outfile    : 'public/chip8.js',
    platform   : 'browser',
    format     : 'esm',
}).catch(() => process.exit(1));