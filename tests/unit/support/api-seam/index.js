import { afterAll, afterEach, beforeAll, expect } from 'vitest'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import * as v from 'valibot'

import { operations } from './operations.js'

/**
 * The test seam, at the network boundary.
 *
 * Every other spec in this suite replaces an HTTP *client* — `@/services/api`,
 * or `@/api/client.gen`, or both stitched into one fake. That seam sits above
 * the code that builds a request, so a spec records whatever request the code
 * made and asserts it as correct; a query parameter the code stopped sending
 * is invisible by construction. That is how a customer-facing list lost its
 * pagination, search and sorting with a green suite (#313).
 *
 * This one intercepts below both clients, so a spec sees the request that
 * would go on the wire — the full URL, the query string as serialized, the
 * body as encoded. Nothing about which client made it is visible here, which
 * is the property that makes it survive a call-site migration.
 *
 * Handlers are **strict**, and generated from `openapi/schema.yaml`:
 *
 *   - a request to a path the schema does not declare fails the test
 *   - a query parameter the operation does not declare fails the test
 *   - a body that fails the operation's generated request schema fails the test
 *   - a declared path with no response registered fails the test
 *
 * Lenient handlers are what already exists, and are what let the regression
 * through. Strictness is self-limiting: where a parameter is legitimate, the
 * schema gains it, and the schema becomes more truthful as a result.
 *
 * Migration is incremental. Existing specs keep their client fakes and come
 * across as their own Slice is converted; `support/api-client-mock.js` and
 * `support/request-recorder.js` die when the last one does.
 *
 * Usage:
 *
 *     const api = installApiSeam()
 *
 *     beforeEach(() => {
 *       api.get('/api/member/contract/', paginated([{id: 1, name: 'A'}]))
 *     })
 *
 * Paths are the schema's own templates (`/api/member/member/{id}/`), so a stub
 * for an endpoint that does not exist is caught where it is written rather
 * than by a silent 404 later.
 */

/** The CSRF handshake BaseModel issues before every write. Not part of any call shape. */
const CSRF_PATH = '/api/get-csrf-token/'

export function installApiSeam() {
  /** `${method} ${template}` -> responder. Cleared between tests. */
  const responders = new Map()
  /** Requests seen at the boundary, in call order. */
  const recorded = []
  /** Strictness failures, reported as one assertion after the test body. */
  const violations = []

  const server = setupServer(
    ...operations.map((operation) =>
      http[operation.method](operation.pattern, ({ request, params }) =>
        handle(operation, request, params),
      ),
    ),
  )

  async function handle(operation, request, params) {
    const url = new URL(request.url)
    const { body, decoded } = await readBody(request)

    for (const name of url.searchParams.keys()) {
      if (!operation.declaredQuery.has(name)) {
        violations.push(
          `${label(operation, url)} carries the query parameter '${name}', which the schema does not declare. ` +
            `Declared: ${[...operation.declaredQuery].join(', ') || '(none)'}.`,
        )
      }
    }

    // `decoded` gates validation rather than `body !== undefined`: a body the
    // seam could not turn back into an object (a multipart upload) would fail
    // every schema, and reporting that as "your body is wrong" would send the
    // reader after a bug that is not there.
    if (operation.bodySchema && decoded) {
      const result = v.safeParse(operation.bodySchema, body)
      if (!result.success) {
        violations.push(
          `${label(operation, url)} sends a body its request schema rejects: ` +
            result.issues.map((issue) => `${pathOf(issue)}: ${issue.message}`).join('; '),
        )
      }
    }

    if (url.pathname !== CSRF_PATH) {
      recorded.push({ method: operation.method, path: url.pathname, query: queryOf(url), body })
    }

    const responder = responders.get(`${operation.method} ${operation.path}`)

    if (!responder) {
      if (url.pathname === CSRF_PATH) return HttpResponse.json({ token: 'csrf-token' })

      violations.push(
        `${label(operation, url)} has no response registered. ` +
          `Add one with api.${operation.method}('${operation.path}', ...).`,
      )
      return HttpResponse.json({ detail: 'no response registered' }, { status: 501 })
    }

    const answer = await responder({ request, params, query: queryOf(url), body })

    return answer instanceof HttpResponse ? answer : HttpResponse.json(answer ?? null)
  }

  beforeAll(() => {
    server.listen({
      onUnhandledRequest: (request) => {
        const url = new URL(request.url)
        const message =
          `${request.method} ${url.pathname} is not declared in openapi/schema.yaml. ` +
          `Either the request is wrong, or the schema is missing an endpoint.`
        violations.push(message)
        // Thrown as well as recorded: a callback that returns lets MSW perform
        // the request for real, and a test suite must not reach the network.
        throw new Error(message)
      },
    })
  })

  afterEach(() => {
    server.resetHandlers()
    responders.clear()
    recorded.length = 0

    const seen = [...violations]
    violations.length = 0
    expect(seen, 'requests rejected by the API seam').toEqual([])
  })

  afterAll(() => server.close())

  const api = {
    /**
     * The requests the application made, in call order, as
     * `{method, path, query, body}`. The CSRF handshake is left out.
     */
    requests: () => recorded.map((entry) => structuredClone(entry)),

    /**
     * Drain the strictness failures recorded so far.
     *
     * Only the seam's own spec has any business calling this: a drained
     * violation no longer fails the test, which is exactly what a spec
     * asserting that the seam *does* reject something needs, and exactly what
     * a spec must never do to hide a real one.
     */
    takeViolations: () => violations.splice(0, violations.length),
  }

  for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
    /**
     * Answer `template` with `response` — a value, or a function of
     * `{request, params, query, body}` returning one (or an `HttpResponse`).
     */
    api[method] = (template, response) => {
      const known = operations.some(
        (operation) => operation.method === method && operation.path === template,
      )
      if (!known) {
        throw new Error(
          `openapi/schema.yaml declares no ${method.toUpperCase()} ${template}. ` +
            `A stub for an endpoint that does not exist would pass a test the application cannot.`,
        )
      }

      responders.set(
        `${method} ${template}`,
        typeof response === 'function' ? response : () => response,
      )
      return api
    }
  }

  return api
}

/**
 * The request body as the handler should judge it, and whether it came back as
 * a structure the request schema can be run against.
 *
 * JSON and url-encoded forms decode; an empty body is `undefined`; anything
 * else (a multipart upload) is recorded as the raw text and left unvalidated.
 *
 * Both encodings matter because `BaseModel` posts through axios defaults while
 * the generated SDK sends JSON — the boundary is the one place where that
 * difference is visible, and the schema does not care which was used.
 */
async function readBody(request) {
  const type = request.headers.get('content-type') ?? ''
  const raw = await request.clone().text()
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
 * The query string as an object, a repeated key collecting its values into an
 * array.
 *
 * `Object.fromEntries(searchParams)` keeps only the last value, which would
 * make `?id=1&id=2` and `?id=2` record identically — a difference the seam
 * exists to notice.
 */
function queryOf(url) {
  const query = {}
  for (const key of new Set(url.searchParams.keys())) {
    const values = url.searchParams.getAll(key)
    query[key] = values.length > 1 ? values : values[0]
  }
  return query
}

function label(operation, url) {
  return `${operation.method.toUpperCase()} ${url.pathname}`
}

function pathOf(issue) {
  return issue.path?.map((segment) => segment.key).join('.') || '(body)'
}
