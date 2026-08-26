import { afterAll, afterEach, beforeAll, expect } from 'vitest'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import * as v from 'valibot'

import { operations } from './operations.js'
import { CSRF_PATH, decodeBody, entryFor, queryOf } from './normalize.js'

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
 *   - a *stubbed response* the endpoint's own schema rejects fails the test
 *
 * That last one is not about the code under test — it is about the spec. A
 * fixture the backend could not have sent is a spec asserting behaviour against
 * data that does not exist, which is the same green-while-wrong failure one
 * layer down. `tests/unit/helpers/schema-fixture.js` builds a conforming
 * response from the generated component, so paying for this is a one-liner.
 * An explicit `HttpResponse` opts out, for error envelopes and for the
 * deliberately malformed payload a failure-path spec needs.
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

/**
 * Let every request in flight reach the seam and come back.
 *
 * **Use this, not a microtask flush.** The suite's older
 * `for (i…) await Promise.resolve()` idiom works against a client fake, whose
 * responses resolve on the microtask queue. A real request does not: it crosses
 * the XHR interceptor and comes back on a macrotask, so a microtask flush
 * returns before the request has even been recorded.
 *
 * That fails in the worst direction. An assertion that a request *was* made
 * fails loudly and gets fixed; an assertion that a request was **not** made —
 * a short company code, a debounce that should have suppressed a lookup —
 * passes vacuously, and a spec that certifies suppression it never observed is
 * the same green-while-wrong failure this seam exists to end.
 */
/**
 * A 204, for an endpoint whose generated response schema is `void`.
 *
 * A DELETE answered with `null` fails the seam's own response check — `void`
 * is not `null` — and the reflex repair is to loosen that check, which would
 * cost the spec the thing it is there for. What the backend actually sends is
 * an empty 204, so a spec should say so.
 */
export function noContent() {
  return new HttpResponse(null, { status: 204 })
}

export async function settle() {
  for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0))
}

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
    const { body, decoded } = decodeBody(
      request.headers.get('content-type'),
      await request.clone().text(),
    )

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
      recorded.push(entryFor(operation.method, url, body))
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

    // An explicit HttpResponse is the author taking control — an error status,
    // a DRF validation envelope, a deliberately malformed payload — so it goes
    // out as written. Everything else is a claim about what this endpoint
    // returns, and is held to it.
    if (answer instanceof HttpResponse) return answer

    if (operation.responseSchema) {
      const result = v.safeParse(operation.responseSchema, answer ?? null)
      if (!result.success) {
        violations.push(
          `${label(operation, url)} is stubbed with a response its own schema rejects: ` +
            result.issues.map((issue) => `${pathOf(issue)}: ${issue.message}`).join('; ') +
            `. Build the fixture from the generated component — see tests/unit/helpers/schema-fixture.js.`,
        )
      }
    }

    return HttpResponse.json(answer ?? null)
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

function label(operation, url) {
  return `${operation.method.toUpperCase()} ${url.pathname}`
}

function pathOf(issue) {
  return issue.path?.map((segment) => segment.key).join('.') || '(body)'
}
