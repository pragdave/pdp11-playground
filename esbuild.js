require('esbuild').build({
  entryPoints: ['src/standalone.tsx'],
  bundle: true,
  outfile: 'standalone.js',
}).catch(() => process.exit(1))
