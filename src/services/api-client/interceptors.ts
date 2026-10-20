// This file lives here rather than next to the client it configures,
// because `src/api/` is the generator's output directory and is emptied on
// every `npm run codegen`.
import type { InternalAxiosRequestConfig } from 'axios'

import setInterceptors from '@/services/auth/clientDriver'
import { client } from '@/api/client.gen'

const UNSAFE_METHODS = new Set(['post', 'put', 'patch', 'delete'])

let csrfToken: string | null = null
let installed = false

/**
 * The CSRF token answer: `{token}`, read defensively off the wire rather
 * than off the untyped response body.
 */
function readCsrfToken(data: unknown): string | null {
  if (typeof data !== 'object' || data === null || !('token' in data)) {
    return null
  }
  const token: unknown = data.token
  return typeof token === 'string' ? token : null
}

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
    csrfToken = readCsrfToken(response.data)
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
