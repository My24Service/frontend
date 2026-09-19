import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { BootstrapVueNextResolver } from 'bootstrap-vue-next/resolvers'
import IconsResolve from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import { ExternalPackageIconLoader } from 'unplugin-icons/loaders'
import * as path from 'node:path'
import { autoImportEntries } from './auto-imports.config.js'

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
    // Same auto-imports as the app build (vite.config.js): SFCs and modules
    // use ref/computed/useRouter/... without importing them. Without this,
    // specs fail with "ReferenceError: ref is not defined".
    AutoImport({
      imports: autoImportEntries,
      // The app build owns auto-imports.d.ts; tests must not rewrite it.
      dts: false,
    }),
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
    // A worktree symlinks node_modules to the main checkout. Without this,
    // vite resolves the theme preprocessor's browser-utils to a realpath
    // outside the project root and every spec that imports src/theme.ts fails.
    preserveSymlinks: true,
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

    // Persist transformed modules between runs. Without it every run re-does
    // the whole graph, and this graph is large: the generated API client alone
    // is ~2.7 MB over four files and the test seam reaches it from most specs.
    // Measured back-to-back, transform drops from ~43s to ~5s and the run from
    // ~93s to ~52s once the cache is warm; the first run writes it and is
    // slightly slower than no cache at all.
    //
    // "experimental" is the flag's status, not a caveat about the behaviour: a
    // stale cache would surface as wrong test results, not as silence, and
    // `npx vitest --clearCache` resets it. The cache lives under Vite's
    // `cacheDir` (`node_modules/.vite`), which is already gitignored.
    experimental: { fsModuleCache: true },
  },
})
