const sassPlugin = require( 'esbuild-sass-plugin')

require('esbuild').build({
  entryPoints: ['src/pdp11_playground.js'],
  bundle: true,
  plugins: [sassPlugin.default()],
  outdir: 'dist',
  sourcemap: true,
  minify: false,
  target: ['esnext'],
}).catch(() => process.exit(1))

