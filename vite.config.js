import { defineConfig } from 'vite'
import visualizer from 'rollup-plugin-visualizer'
import themePreprocessorPlugin from "@zougt/vite-plugin-theme-preprocessor"
import vue from '@vitejs/plugin-vue2'

const path = require("path");
export default defineConfig({
  base: '',
  // build: {
  //   sourcemap: true
  // },
  server: {
    host: 'demo.my24service.com',
    port: 3000,
    hmr: {
      host: "localhost",
      port: 3000
    }
  },
  plugins: [
    vue(),
    visualizer(),
    themePreprocessorPlugin({
      scss: {
        // close arbitraryMode
        arbitraryMode: false,
        // Provide multiple  LESS/SCSS variable files
        multipleScopeVars: [
          {
            scopeName: "theme-default",
            // path or varscontent must be selected
            path: path.resolve("./src/scss/app.scss"),
            // varsContent same as content in path
            // varsContent:`@primary-color:${defaultPrimaryColor};`
          },
          {
            scopeName: "theme-shltr",
            path: path.resolve("./src/scss/shltr.scss"),
          },
        ],
        // add scopeName to html tag className. default use multipleScopeVars[0].scopeName
        defaultScopeName: "",
        //  extract independent theme CSS files in production mode  extract为true以下属性有效
        extract: true,
        // theme CSS files output dir , default use viteConfig.build.assetsDir
        // outputDir: "",
        // link tag id
        themeLinkTagId: "theme-link-tag",
        // "head"||"head-prepend" || "body" ||"body-prepend"
        themeLinkTagInjectTo: "head",
        // Remove scopeName in the extracted CSS content.
        removeCssScopeName: false,
        // custom css file name.
        customThemeCssFileName: (scopeName) => scopeName,
      }
    })
  ],
  resolve: {
    extensions: ['.js', '.json', '.vue'],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: [
      'tests/unit/setupTests.js',
    ],
    testTimeout: 300000
  },
})
