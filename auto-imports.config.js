// Shared `imports` for unplugin-auto-import, used by the app build
// (vite.config.js) and the test run (vitest.config.js) so specs execute
// under the same globals as the app. Edit here, not in both configs.
//
// Shape follows https://unplugin.unjs.io/showcase/unplugin-auto-import.html:
// preset names, `{package: [...]}` value maps, and
// `{from, imports, type: true}` for type-only imports.
//
// The generated API is reached as one auto-imported name, as a value and as a
// type at once:
//
//     Api.CompanyBranch.list.options()   // a value: the generated query options
//     Api.CompanyBranch.Record           // a type: the record it answers with
//     Api.Branch                         // a type from types.gen
//
// Two entries make that work, one for each half (see the `*` entries below):
// the value entry emits `const Api: typeof import('...')` and the `type: true`
// entry emits `export type * as Api from '...'`. They merge without conflict
// because a const and a type-only namespace are different declaration spaces,
// so the one name means both. Neither half works alone - the type entry alone
// is unusable as a value (TS1362) and the value entry carries no types - which
// is why both are needed. The explicit
// `import * as Api from '@/services/api-client'` remains the fallback for
// files that would rather say where the name comes from. See
// `src/services/api-client/index.ts`.
export const autoImportEntries = [
  'vue',
  'vue-router',
  '@vueuse/core',
  '@vueuse/head',
  '@vueuse/math',
  {
    'bootstrap-vue-next': ['useToast'],
    '@tanstack/vue-query': ['useMutation', 'useQuery', 'useQueryClient'],
    '@/api/valibot.gen': [['*', 'schemas']],
    '@/stores/main': ['useMainStore'],
    '@/features/auth/store': ['useAuthStore'],
    '@/services/i18n': ['$trans', 'interpolate', 'errorToast', 'infoToast'],
    '@/router/types': ['fromRouteTo', 'toRoute'],
    '@/services/my24': [['default', 'my24']],
    '@/services/api-client': [['*', 'Api']],
  },
  {
    from: '@/router/types',
    imports: ['RouteName', 'RouteTo'],
    type: true,
  },
  {
    from: 'vue',
    imports: ['CSSProperties'],
    type: true,
  },
  {
    from: 'vue-router',
    imports: [
      'RouteLocationRaw',
      'RouteParamValueRaw',
      'LocationQueryValue',
      'RouteLocationNormalizedLoaded',
    ],
    type: true,
  },
  {
    from: '@tanstack/vue-query',
    imports: [
      'DefaultError',
      'InfiniteData',
      'QueryClientConfig',
      'UseMutationOptions',
      'UseQueryOptions',
      'UseQueryReturnType',
      'VueQueryPluginOptions',
    ],
    type: true,
  },
  {
    from: 'type-fest',
    imports: [['*', 'TF']],
    type: true,
  },
  {
    from: '@/services/api-client',
    imports: [['*', 'Api']],
    type: true,
  },
]
