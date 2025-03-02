import * as esbuild from "esbuild";

await esbuild.build({
    entryPoints: ['src/webmain.ts'],
    bundle     : true,
    outfile    : 'docs/chip8.js',
    platform   : 'browser',
    format     : 'esm',
}).catch(() => process.exit(1));