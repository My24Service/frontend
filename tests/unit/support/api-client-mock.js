/**
 * The generated client's half of the client fake (support/fake-http.js).
 *
 * The generated SDK calls `client.{verb}({ url, path, query, body })` where
 * `path` carries the `{id}` route params. This interpolates them back into the
 * URL and forwards a plain `(url[, body])` call to the same fake the spec uses
 * for `@/services/api`, so `urlsOf`/payload assertions work unchanged.
 * `useFakeHttp` installs these as spies on the real client.
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
      /**
       * The generated `*QueryKey` factories read the client's own config for the
       * key's `baseURL` (`(options?.client ?? client).getConfig().baseURL`), so a
       * screen that reads through `*Options` needs it here as well as the four
       * verbs. `/api` is the base the real client is built with.
       */
      getConfig: () => ({baseURL: '/api'}),
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
