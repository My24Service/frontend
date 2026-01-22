import { defineConfig } from 'vite'
import {
  themePreprocessorPlugin,
  themePreprocessorHmrPlugin
} from "vite-plugin-theme-preprocessor/dist";
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import {BootstrapVueNextResolver} from 'bootstrap-vue-next/resolvers'
import IconsResolve from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import * as path from "node:path";
import {ExternalPackageIconLoader} from "unplugin-icons/loaders";

export default defineConfig({
  base: '',
  // build: {
  //   sourcemap: true
  // },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: [
      'stormy.my24service-dev.com',
      'riedel.my24service-dev.com',
      'amex.my24service-dev.com',
    ],
    hmr: {
      host: "amex.my24service-dev.com",
      port: 3000
    }
  },
  plugins: [
    vue(),
    Components({
      resolvers: [
        BootstrapVueNextResolver(),
        IconsResolve()
      ],
      dts: true,
    }),
    Icons({
      compiler: 'vue3',
      autoInstall: true,
      customCollections: {
        ...ExternalPackageIconLoader('bootstrap-icons'),
      }
    }),
    themePreprocessorPlugin({
      scss: {
        // close arbitraryMode
        arbitraryMode: false,
        // Provide multiple  LESS/SCSS variable files
        multipleScopeVars: [
          {
            scopeName: "theme-default",
            // path or varsContent must be selected
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
    }),
    themePreprocessorHmrPlugin(),
  ],
  resolve: {
    extensions: ['.js', '.json', '.vue'],
    alias: {
      "@": path.resolve("./src")
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: [
          'import',
          'color-functions',
          'global-builtin',
          'legacy-js-api',
          'if-function'
        ]
      },
    }
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
