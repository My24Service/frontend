/**
 * How a request is written down, in one place.
 *
 * Two things record requests and they have to agree exactly: the seam
 * (`./index.js`), which watches a spec's requests in a happy-dom run, and the
 * HAR converter behind `npm run golden`, which reads what a browser saw against
 * a development tenant. A golden written by the second is asserted against the
 * first.
 *
 * If those two normalized a query string or a request body even slightly
 * differently, every recorded golden would fail for a reason that has nothing
 * to do with the application — and the obvious repair would be to edit the
 * golden until it matched the seam, which is deriving the golden from the code
 * again by a slower route. So the shared half lives here and neither side
 * keeps a copy.
 */

/** The CSRF handshake BaseModel issues before every write. Not part of any call shape. */
export const CSRF_PATH = '/api/get-csrf-token/'

/**
 * The query string as an object, a repeated key collecting its values into an
 * array.
 *
 * `Object.fromEntries(searchParams)` keeps only the last value, which would
 * make `?id=1&id=2` and `?id=2` record identically — a difference the seam
 * exists to notice.
 */
export function queryOf(url) {
  const query = {}
  for (const key of new Set(url.searchParams.keys())) {
    const values = url.searchParams.getAll(key)
    query[key] = values.length > 1 ? values : values[0]
  }
  return query
}

/**
 * The request body as a recording should hold it, and whether it came back as
 * a structure a request schema can be run against.
 *
 * JSON and url-encoded forms decode; an empty body is `undefined`; anything
 * else (a multipart upload) is kept as the raw text and left unvalidated.
 *
 * Both encodings matter because `BaseModel` posts through axios defaults while
 * the generated SDK sends JSON — the wire is the one place where that
 * difference is visible, and the schema does not care which was used.
 */
export function decodeBody(contentType, raw) {
  const type = contentType ?? ''
  if (!raw) return { body: undefined, decoded: false }

  if (type.includes('json')) {
    try {
      return { body: JSON.parse(raw), decoded: true }
    } catch {
      return { body: raw, decoded: false }
    }
  }

  if (type.includes('form-urlencoded')) {
    return { body: Object.fromEntries(new URLSearchParams(raw)), decoded: true }
  }

  return { body: raw, decoded: false }
}

/**
 * One entry of a recording: `{method, path, query, body}`, with `body` left out
 * when there was none.
 *
 * `method` is lower-cased and `path` is the pathname alone, so a recording says
 * nothing about which client made the request or which host answered it. That
 * is the property that lets one golden survive the call-site migration the
 * Slices are for.
 */
export function entryFor(method, url, body) {
  const entry = { method: method.toLowerCase(), path: url.pathname, query: queryOf(url) }
  if (body !== undefined) entry.body = body
  return entry
}
