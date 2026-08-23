import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { BootstrapVueNextResolver } from 'bootstrap-vue-next/resolvers'
import IconsResolve from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import { ExternalPackageIconLoader } from 'unplugin-icons/loaders'
import * as path from 'node:path'

// Deliberately separate from vite.config.js: the app build pulls in the theme
// preprocessor and tailwind, neither of which the tests need. Vitest 4 no
// longer reads a `test` block out of vite.config.js.
//
// The component/icon auto-import resolvers *are* needed: components render
// <b-form>, <BLink>, <i-bi-trash> etc. without importing them, so without
// these plugins every SFC test floods the output with "Failed to resolve
// component" warnings and renders nothing but empty stubs.
export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [BootstrapVueNextResolver(), IconsResolve()],
      // The app build owns components.d.ts; tests must not rewrite it.
      dts: false,
    }),
    Icons({
      compiler: 'vue3',
      customCollections: {
        ...ExternalPackageIconLoader('bootstrap-icons'),
      },
    }),
  ],
  resolve: {
    extensions: ['.ts', '.js', '.json', '.vue'],
    alias: {
      '@': path.resolve('./src'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['tests/unit/setupTests.js'],
    include: ['tests/unit/**/*.spec.js'],
    silent: 'passed-only',
  },
})
