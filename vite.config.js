import { defineConfig } from 'vite'
import { createVuePlugin as vue } from "vite-plugin-vue2"
import visualizer from 'rollup-plugin-visualizer'

const path = require("path");
export default defineConfig({
  server: {
    host: 'stormy.my24service.com',
  },
  plugins: [
    vue(),
    visualizer(),
  ],
  resolve: {
    extensions: ['.js', '.json', '.vue'],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
