/**
 * How a request is written down, in one place.
 *
 * The seam (`./index.js`) builds every entry it records through `entryFor`, so
 * a spec comparing `api.requests()` against a literal sees one shape and only
 * one: `method` lower-cased, `path` the pathname alone, `query` parsed, and
 * `body` left out when the request carried none. Spelling that here rather than
 * inline is what stops the seam's own recording drifting from what its specs
 * expect.
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
 * `method` is lower-cased and `path` is the pathname alone, so an entry says
 * nothing about which client made the request or which host answered it. That
 * is the property that lets one expected list survive the call-site migration
 * the Slices are for.
 */
export function entryFor(method, url, body) {
  const entry = { method: method.toLowerCase(), path: url.pathname, query: queryOf(url) }
  if (body !== undefined) entry.body = body
  return entry
}
