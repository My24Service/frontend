/**
 * Normalized view of the HTTP requests a call-shape spec's fake client saw.
 *
 * The generated SDK client and the legacy `BaseModel`/`@/services/api` client
 * reach the network through *different* seams, so a call-shape spec mocks both
 * into one shared `vi.hoisted` fake (see `api-client-mock.js`) and then reads
 * that fake through this helper. The two seams disagree on two things this
 * normalizes away, so a spec written against the pre-refactor code still passes
 * against the refactored code:
 *
 * - The `/api` prefix. The generated ops carry it in their URL
 *   (`/api/company/branch/...`); the legacy client kept it in `baseURL` and
 *   called the mock with `/company/branch/...`. We canonicalize to *with* the
 *   prefix.
 * - Query serialization. Both seams land `?a=1&b=2` on the URL, so `query`
 *   here is the parsed object rather than a raw string.
 *
 * It must stay dependency-free, like `api-client-mock.js` (imported from
 * `vi.mock` factories while the spec graph is still resolving).
 */

const API_PREFIX = '/api/'

function split(url) {
  const [rawPath, search = ''] = String(url).split('?')
  const path = rawPath.startsWith(API_PREFIX) ? rawPath : API_PREFIX + rawPath.replace(/^\/+/, '')
  const query = {}
  for (const [key, value] of new URLSearchParams(search)) query[key] = value
  return { path, query }
}

/**
 * The requests `fakeHttp` recorded, as `{method, path, query, body}` in call
 * order, normalized as above. `method` filters to one verb. The CSRF-token
 * handshake (`/get-csrf-token/`) is skipped, since BaseModel issues it on most
 * writes and it is not part of any call-shape contract.
 */
export function requestShapes(fakeHttp, { method } = {}) {
  const shapes = []
  for (const verb of ['get', 'post', 'put', 'patch', 'delete']) {
    for (const call of fakeHttp[verb]?.mock?.calls ?? []) {
      const [url, body] = call
      const { path, query } = split(url)
      if (path === `${API_PREFIX}get-csrf-token/`) continue
      const m = verb.toLowerCase()
      if (method && m !== method) continue
      shapes.push({ method: m, path, query, body })
    }
  }
  return shapes
}
