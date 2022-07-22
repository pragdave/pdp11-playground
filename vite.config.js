const path = require('path');
const { defineConfig } = require('vite');

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'),
      name: 'pdp11-playground',
      fileName: (format) => `pdp11_playground.${format}.js`,
    },
    rollupOptions: {
    },
  },
})
