// Shared `imports` for unplugin-auto-import, used by the app build
// (vite.config.js) and the test run (vitest.config.js) so specs execute
// under the same globals as the app. Edit here, not in both configs.
//
// Shape follows https://unplugin.unjs.io/showcase/unplugin-auto-import.html:
// preset names, `{package: [...]}` value maps, and
// `{from, imports, type: true}` for type-only imports.
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
  },
  {
    from: '@/router/types',
    imports: ['RouteName', 'RouteTo'],
    type: true,
  },
  {
    from: '@/api/types.gen',
    imports: [['*', 'Api']],
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
]
