// Auth and CSRF for the generated client.
//
// The generated client owns its axios instance (`client.instance`), so these
// attach to it rather than to a second instance built here — the client-axios
// docs' interceptor route.
//
// This file and ./runtimeConfig.ts live here rather than next to the client
// they configure, because `src/api/` is the generator's output directory and
// is emptied on every `npm run codegen`. A hand-written file in there
// disappears at the next run, which is a confusing way to find out. `src/services/api.ts`'s instance stays as it is and
// is untouched by this: it has `baseURL: ${BASE_URL}/api`, while the generated
// operations carry the `/api` prefix themselves (see ./runtimeConfig.ts).
//
// Everything the app's own client does has to reach the generated calls too —
// bearer token, the 401→logout redirect, CSRF on writes — or migrating a model
// to the SDK silently drops it.
//
// See ./runtimeConfig.ts for the half that has to be in place before the
// client exists.
import type { InternalAxiosRequestConfig } from 'axios'

import setInterceptors from '@/services/auth/clientDriver'
import { client } from '@/api/client.gen'

/** The methods `BaseModel` fetches a CSRF token for. */
const UNSAFE_METHODS = new Set(['post', 'put', 'patch', 'delete'])

let csrfToken: string | null = null
let installed = false

/** Drop the cached token (after a logout, or between tests). */
export function resetCsrfToken() {
  csrfToken = null
}

/**
 * Attach `X-CSRFToken` to unsafe requests, fetching the token once.
 *
 * `BaseModel` does this inline in `insert`/`delete` — a GET to
 * `/get-csrf-token/` before every write, and none at all on `update`. The
 * generated SDK has no hook for that: an operation function is a thin wrapper
 * around one HTTP call and cannot await a second one first. So it moves here,
 * where it applies uniformly and where the generated code needs to know
 * nothing about it.
 *
 * Two deliberate differences from `BaseModel`:
 *
 * - PATCH gets the header too. `BaseModel#update` never sent one, which is an
 *   inconsistency rather than a decision — Django enforces CSRF per unsafe
 *   method, not per model method.
 * - The token is fetched once per session rather than per write. Django's CSRF
 *   token is stable for the session; re-fetching before each write was one
 *   extra round-trip on every save.
 */
async function withCsrfToken(
  config: InternalAxiosRequestConfig,
): Promise<InternalAxiosRequestConfig> {
  const method = (config.method ?? 'get').toLowerCase()
  if (!UNSAFE_METHODS.has(method)) return config

  if (csrfToken === null) {
    // A GET, so it takes the early return above rather than recursing.
    const response = await client.instance.get('/api/get-csrf-token/')
    csrfToken = response.data.token
  }

  config.headers['X-CSRFToken'] = csrfToken
  return config
}

/**
 * Install them. Call once from main.ts.
 *
 * Unlike the baseURL — which is set as the client is created, in
 * ./runtimeConfig.ts, so that no request can go out without it — interceptors
 * can only attach to an instance that exists. Being idempotent means a second
 * call (an accidental import, a test) does not stack duplicate interceptors,
 * which would fetch the CSRF token twice per write.
 */
export function installApiInterceptors() {
  if (installed) return client

  // Authorization header + the 401→logout redirect, the same function
  // src/services/api.ts uses on its own instance.
  setInterceptors(client.instance)

  // Registered after, so it runs *before* the auth one: axios runs request
  // interceptors in reverse registration order, and `setInterceptors` rebuilds
  // `request.headers` by spreading the existing object — which preserves the
  // CSRF header set here.
  client.instance.interceptors.request.use(withCsrfToken)

  installed = true
  return client
}

export { client }
