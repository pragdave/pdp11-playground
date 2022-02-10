const path = require('path');
const { defineConfig } = require('vite');

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'),
      name: 'MyLib',
      fileName: (format) => `pdp11_playground.${format}.js`,
    },
    rollupOptions: {
      // external: ['vue'],
      // output: {
      //   // Provide global variables to use in the UMD build
      //   // Add external deps here
      //   globals: {
      //     vue: 'Vue',
      //   },
      // },
    },
  },
  // plugins: [vue()],
})
