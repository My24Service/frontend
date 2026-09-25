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

/**
 * Give every SFC a `__name` derived from its filename, the way the compiler
 * already does for `<script setup>` components.
 *
 * Without this, a component used through auto-import cannot be stubbed. The
 * component plugin rewrites `<WorkOrdersTable />` into a direct import binding
 * rather than a `resolveComponent('WorkOrdersTable')` call, so the component
 * never lands in any `components` registry. Vue Test Utils resolves a stub by
 * the name it is registered under, then by the component's own `name`/`__name`
 * (see its getComponentName) - and an Options-API SFC that declares no `name`
 * has none of the three. The stub silently misses and the real component
 * mounts, fetches included.
 *
 * `_sfc_main` is the object the SFC's default export is built from, and
 * `_export_sfc` returns that same object, so assigning to it here reaches the
 * exported component. Appending leaves every existing line in place, which is
 * why no source map is rewritten. Components that already carry a `name` or a
 * `__name` are left alone.
 *
 * Test-only, and deliberately so: the app build has no stubs to resolve, and
 * this should not be a reason for production output to differ.
 */
function nameSfcsForStubbing() {
  return {
    name: 'name-sfcs-for-stubbing',
    enforce: 'post',
    transform(code, id) {
      const [file, query] = id.split('?')
      // Only the SFC's main request; its `?vue&type=template` etc. blocks have
      // already been folded into this one.
      if (query !== undefined || !file.endsWith('.vue')) return null
      if (!/\b_sfc_main\b/.test(code)) return null

      const name = path.basename(file, '.vue')
      return {
        code:
          code +
          `\n;if (_sfc_main && typeof _sfc_main === 'object' && !_sfc_main.name && !_sfc_main.__name) ` +
          `_sfc_main.__name = ${JSON.stringify(name)};\n`,
        map: null,
      }
    },
  }
}

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
      // Templates call auto-imported helpers too (`:to="toRoute(...)"`).
      vueTemplate: true,
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
    nameSfcsForStubbing(),
  ],
  resolve: {
    extensions: ['.ts', '.js', '.json', '.vue'],
    // A worktree symlinks node_modules to the main checkout. Without this,
    // vite resolves the theme preprocessor's browser-utils to a realpath
    // outside the project root and every spec that imports src/theme.ts fails.
    preserveSymlinks: true,
    alias: {
      '@': path.resolve('./src'),
      // The real browser-utils imports a file the theme preprocessor plugin
      // generates into node_modules at `vite dev`/`build` time; it is absent
      // after a fresh `npm ci`, so CI fails on every spec reaching src/theme.ts.
      'vite-plugin-theme-preprocessor/dist/browser-utils': path.resolve(
        './tests/unit/__mocks__/theme-preprocessor-browser-utils.js',
      ),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['tests/unit/setupTests.js'],
    include: ['tests/unit/**/*.spec.{js,ts}'],
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
