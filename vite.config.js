import { defineConfig, loadEnv } from 'vite'
import {
  themePreprocessorPlugin,
  themePreprocessorHmrPlugin
} from "vite-plugin-theme-preprocessor/dist";
import Vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import Components from 'unplugin-vue-components/vite'
import {
  VueUseComponentsResolver,
  VueUseDirectiveResolver,
} from 'unplugin-vue-components/resolvers'
import {BootstrapVueNextResolver} from 'bootstrap-vue-next/resolvers'
import IconsResolve from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import * as path from "node:path";
import * as fs from "node:fs";
import { ExternalPackageIconLoader } from "unplugin-icons/loaders";
import AutoImport from 'unplugin-auto-import/vite'
import { autoImportEntries } from './auto-imports.config.js'
import VueRouter from 'vue-router/vite'
import { insertHandWrittenRoutes } from './vite/typed-routes.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  const allowedHosts = [
    'stormy.my24service-dev.com',
    'riedel.my24service-dev.com',
    'amex.my24service-dev.com',
    'gls.my24service-dev.com',
  ]

  if (env.VITE_ALLOWED_HOSTS_EXTRA) {
    allowedHosts.push(...env.VITE_ALLOWED_HOSTS_EXTRA.split(","))
  }

  const hmrHost = env.VITE_HMR_HOST || "amex.my24service-dev.com"

  return {
    base: '',
    // build: {
    //   sourcemap: true
    // },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts,
      fs: {
        // A worktree symlinks node_modules to the main checkout, and Vite
        // serves a dependency's own assets (bootstrap-icons' woff2, pulled in
        // by its css) from the resolved real path, which lies outside the
        // worktree. Allow the real node_modules alongside the project root.
        // Under Yarn PnP there is no node_modules dir, so only add it when present.
        allow: [
          '.',
          ...(fs.existsSync(path.resolve('node_modules'))
            ? [fs.realpathSync(path.resolve('node_modules'))]
            : []),
        ],
      },
      proxy: {
        // in production the Django backend serves /media on the same origin,
        // locally it runs separately so forward it to the backend
        '/media': {
          target: env.VITE_BACKEND_URL || 'http://localhost:8000',
          // keep the original Host header so tenant resolution keeps working
          changeOrigin: false,
        }
      },
      hmr: {
        // VITE_HMR_HOST=auto lets the HMR client connect back to whatever host
        // the page was loaded from, instead of pinning a single tenant
        ...(hmrHost === 'auto' ? {} : {host: hmrHost}),
        port: 3000
      }
    },
    plugins: [
      VueRouter({
        dts: 'src/route-map.d.ts',
        routesFolder: [],
        beforeWriteFiles: (root) => insertHandWrittenRoutes(root, process.cwd()),
      }),
      Vue(),
      tailwindcss(),
      AutoImport({
        imports: autoImportEntries,
        vueTemplate: true,
        vueDirectives: true,
        viteOptimizeDeps: true,
        dumpUnimportItems: './auto-imports.json',
      }),
      Components({
        resolvers: [
          BootstrapVueNextResolver(),
          VueUseComponentsResolver(),
          VueUseDirectiveResolver(),
          IconsResolve()
        ],
        dts: true,
        // No `types` entry for vue-router: it declares RouterLink/RouterView
        // in GlobalComponents itself, and the plugin auto-detects it anyway.
        // The empty array switches that auto-detection off.
        types: [],
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
      extensions: ['.ts', '.js', '.json', '.vue'],
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
  }
})
