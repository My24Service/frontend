/**
 * The `@/api/client.gen` mock factory, kept dependency-free on purpose.
 *
 * The generated SDK calls `client.{verb}({ url, path, query, body })` where
 * `path` carries the `{id}` route params. This interpolates them back into the
 * URL and forwards a plain `(url[, body])` call to the same vi.hoisted axios
 * fake the spec uses for `@/services/api`, so `urlsOf`/payload assertions keep
 * working unchanged.
 *
 * It must import nothing from the app, and in particular NOT from
 * `form-harness.js`. It is loaded through an async `vi.mock` factory while the
 * spec's import graph is still being evaluated, so awaiting any module whose
 * transitive deps reach `@/api/client.gen` deadlocks the run (no test output,
 * just a hang). `form-harness.js` reaches it through
 * `@/mixins/common` -> `@/utils` -> `./api/sdk.gen` -> `./client.gen`, which is
 * why this lives in its own file rather than in the harness.
 *
 * Use it from an async factory - a sync factory cannot see a statically
 * imported binding, because `vi.mock` is hoisted above the imports:
 *
 *   vi.mock('@/api/client.gen', async () => {
 *     const { apiClientMock } = await import('../../support/api-client-mock.js')
 *     return apiClientMock(fakeHttp)
 *   })
 */
export function apiClientMock(fakeHttp) {
  const resolve = (url, opts) => {
    const path = url.replace(/\{([^}]+)\}/g, (m, key) => opts.path?.[key] ?? m)
    const qs = serializeQuery(opts.query)
    return qs ? `${path}?${qs}` : path
  }

  return {
    client: {
      get: (opts) => fakeHttp.get(resolve(opts.url, opts)),
      post: (opts) => fakeHttp.post(resolve(opts.url, opts), opts.body),
      patch: (opts) => fakeHttp.patch(resolve(opts.url, opts), opts.body),
      delete: (opts) => fakeHttp.delete(resolve(opts.url, opts)),
    },
  }
}

/**
 * Serialize a generated op's `query` object the way the generated client
 * would: one `k=v` pair per defined value, `&`-joined, URL-encoded. `undefined`
 * and `null` are dropped (an absent filter must not send `customer=`); array
 * values repeat the key. Call-shape specs depend on this because they assert
 * the full request URL including its query string.
 */
function serializeQuery(query) {
  if (!query) return ''
  const parts = []
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      for (const item of value) parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(item)}`)
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    }
  }
  return parts.join('&')
}
