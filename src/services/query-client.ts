import type {App} from 'vue'
import {VueQueryPlugin, type VueQueryPluginOptions} from '@tanstack/vue-query'

/**
 * Vue Query as the application's fetching layer.
 *
 * The generated query options in `src/api/@tanstack/` have existed since the
 * API layer was generated, but were never usable: every composable they return
 * calls `useQueryClient()`, which throws unless the plugin is installed on the
 * app. This is that installation, and nothing else — no screen and no model
 * touches the client yet, deliberately, so that a regression at startup has
 * exactly one candidate cause.
 *
 * See docs/adr/0001-vue-query-as-fetching-layer.md.
 */

/** Whether a failed request is worth trying again. */
const isWorthRetrying = (failureCount: number, error: unknown): boolean => {
  if (failureCount >= 2) return false

  // A 4xx is the server saying the request itself is wrong — a missing record,
  // a forbidden branch, a bad filter. Repeating it produces the same answer
  // three times and delays the error the user needs to see. Everything else
  // (a 5xx, a dropped connection) can plausibly succeed on a second attempt.
  const status = (error as {response?: {status?: number}})?.response?.status

  return !(typeof status === 'number' && status >= 400 && status < 500)
}

export const queryClientOptions: VueQueryPluginOptions = {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        // The app is a long-lived admin UI whose lists are re-entered
        // constantly; a short stale window keeps navigation instant without
        // showing figures that are meaningfully out of date.
        staleTime: 30_000,
        retry: isWorthRetrying,

        // Refetching whenever the tab regains focus is a poor fit here:
        // engineers leave order screens open beside other applications all
        // day, and the burst of requests on every alt-tab buys nothing that
        // the stale window does not already cover.
        refetchOnWindowFocus: false,
      },
    },
  },
}

/** Installs the query client on `app`, with the defaults above. */
export const installQueryClient = (app: App): App => app.use(VueQueryPlugin, queryClientOptions)
