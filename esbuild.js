require('esbuild').build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'pdp11-playground.js',
}).catch(() => process.exit(1))
