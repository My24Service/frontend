import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { BootstrapVueNextResolver } from 'bootstrap-vue-next/resolvers'
import IconsResolve from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import { ExternalPackageIconLoader } from 'unplugin-icons/loaders'
import { globSync, readFileSync } from 'node:fs'
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

const SPECS = 'tests/unit/**/*.spec.{js,ts}'

/**
 * The spec files that need a module graph of their own.
 *
 * Most of the suite runs without isolation (the `shared` project below): each
 * worker evaluates the app's module graph once and every spec file it runs
 * reuses it. Measured on a 4-core box, `import` went from ~790 to ~105
 * CPU-seconds and the full run from ~440s to ~140s. Per-file isolation was
 * costing more than the tests themselves.
 *
 * A spec that replaces an app module with `vi.mock` cannot share. The mock
 * only reaches modules that import the mocked one *after* it is registered,
 * and in a shared graph an earlier spec has already imported them against the
 * real module - so the mock silently misses, and it also leaks into whatever
 * spec that worker runs next. Those files keep full isolation.
 *
 * Detected from the source rather than listed, so a new spec lands in the
 * right project without anyone remembering to put it there. Anything suite-wide
 * that used to be mocked per file (bootstrap-vue-next's useToast) is mocked
 * once in setupTests.js instead, which is what let most specs share at all.
 */
const NEEDS_ISOLATION = /\bvi\.(mock|doMock|unmock|resetModules)\(/

// Comments are stripped first, so a spec explaining why it does *not* use
// vi.mock stays shared. Crude (a `//` inside a string would cut the line
// short), which errs towards sharing a file that then fails loudly.
const withoutComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

const isolatedSpecs = globSync(SPECS).filter((file) =>
  NEEDS_ISOLATION.test(withoutComments(readFileSync(file, 'utf8'))),
)

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
      // Same directory scan as the app build (vite.config.js): `useCommon` and
      // its neighbours in src/composables are auto-imported there, so specs
      // have to see them too or every SFC that reads one fails with
      // "ReferenceError: useCommon is not defined".
      dirs: ['src/composables/**/*'],
      // The app build owns auto-imports.gen.d.ts; tests must not rewrite it.
      dts: false,
    }),
    Components({
      resolvers: [BootstrapVueNextResolver(), IconsResolve()],
      // The app build owns components.gen.d.ts; tests must not rewrite it.
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
    silent: 'passed-only',
    // Every core, not vitest's default of all but one. The main process is
    // near idle during a run (transforms come from the module cache), so the
    // reserved core sat unused: measured 142s -> 117s on 4 cores, and
    // 411s -> 227s on 2 (CircleCI's default medium class, where the default
    // meant a single worker).
    maxWorkers: '100%',
    // Undo every vi.stubGlobal / vi.stubEnv before each test (and, from
    // setupTests.js, after each file). In the shared project a stub left in
    // place outlives its spec file: one spec's fake `location` becomes the next
    // file's `location`, and the router breaks there, far from the cause.
    unstubGlobals: true,
    unstubEnvs: true,

    // Some tests may fail because of vitest's timeout,
    // but only on a cold run, never on a warm run.
    // So an automatic retry in those cases usually fixes the issue.
    retry: 1,

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

    projects: [
      {
        extends: true,
        // `include` is set per project rather than at the root: `extends`
        // concatenates arrays, so a root include would run every spec here too.
        test: {
          name: 'shared',
          include: [SPECS],
          exclude: isolatedSpecs,
          isolate: false,
        },
      },
      {
        extends: true,
        test: { name: 'isolated', include: isolatedSpecs },
      },
    ],
  },
})
