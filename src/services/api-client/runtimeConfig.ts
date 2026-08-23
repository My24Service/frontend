// Configuration for the generated client, applied when the client is created.
//
// Wired up through `runtimeConfigPath` in ../../../openapi-ts.config.ts, which
// makes `src/api/client.gen.ts` call this instead of bare `createConfig()`.
// That is the point of using it rather than `client.setConfig()` at startup:
// the client is configured before it exists, so there is no window in which an
// import-time call could go out unconfigured, and no ordering requirement on
// main.ts.
//
// It lives outside `src/api/` because that directory is the generator's output
// and is emptied on every `npm run codegen` — a hand-written file there is
// deleted at the next run.
//
// Only what must be right from the very first request belongs here. The
// interceptors (auth header, 401 handling, CSRF) attach to `client.instance`
// in ./interceptors.ts, because they need the axios instance the client builds
// from this config.
import type { CreateClientConfig } from '@/api/client.gen'
import BASE_URL from '@/services/base-url'

/**
 * `BASE_URL` is the origin, not `${BASE_URL}/api` as in
 * `src/services/api.ts` — the generated operations carry the full path
 * including the prefix (`url: '/api/order/cost/'`, straight off the OpenAPI
 * document), so prefixing again would request `/api/api/order/cost/`.
 */
export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseURL: BASE_URL,
  withCredentials: false,
})
