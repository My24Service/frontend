import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { parse } from 'yaml'

import * as generatedSchemas from '@/api/valibot.gen'

/**
 * The request side of the committed OpenAPI document, as a table the seam can
 * build handlers from.
 *
 * Read from `openapi/schema.yaml` rather than hand-written per test: the point
 * of the seam is that a request the backend does not declare fails, and a list
 * of declared requests that a human maintains is a list that drifts. The same
 * file is the input to `npm run codegen`, so the handlers and the client the
 * application calls are two views of one document.
 *
 * Only the request side is taken from here. Response *bodies* stay a test's own
 * business — a spec says what the backend answers, and `tests/unit/helpers/
 * schema-fixture.js` builds that answer from the generated valibot component
 * when it needs a whole envelope.
 */

// Resolved from the working directory, not from `import.meta.url`: vitest
// serves this module over its dev server, so `import.meta.url` is an http URL
// here and not a file one. Vitest runs from the repo root.
const SCHEMA_PATH = resolve(process.cwd(), 'openapi/schema.yaml')

const METHODS = ['get', 'post', 'put', 'patch', 'delete']

/**
 * A generated valibot schema for an operation, by role, or null.
 *
 * The valibot plugin names its exports after the operation id in PascalCase
 * (`member_contract_create` -> `vMemberContractCreateBody`), so the two
 * artifacts can be joined on the operation id without a table mapping them.
 * Reaching for the generated schema rather than walking the YAML's JSON Schema
 * keeps one validator in play: the body a spec sends is judged by the same
 * schema that would judge it in the application, where the SDK is configured
 * with `validator: { request: true }`.
 */
function schemaFor(operationId, role) {
  const pascal = operationId
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

  return generatedSchemas[`v${pascal}${role}`] ?? null
}

function buildOperations() {
  const document = parse(readFileSync(SCHEMA_PATH, 'utf8'))
  const operations = []

  for (const [path, item] of Object.entries(document.paths ?? {})) {
    for (const method of METHODS) {
      const operation = item[method]
      if (!operation) continue

      const parameters = [...(item.parameters ?? []), ...(operation.parameters ?? [])]

      operations.push({
        operationId: operation.operationId,
        method,
        path,
        // MSW's matcher syntax. The leading `*` matches any origin: the two
        // clients disagree about the base URL (`${origin}/api` versus
        // `${origin}`), and under happy-dom the origin is whatever the test
        // environment made up.
        pattern: `*${path.replace(/\{([^}]+)\}/g, ':$1')}`,
        declaredQuery: new Set(
          parameters.filter((parameter) => parameter.in === 'query').map((parameter) => parameter.name),
        ),
        bodySchema: schemaFor(operation.operationId, 'Body'),
        responseSchema: schemaFor(operation.operationId, 'Response'),
      })
    }
  }

  // Most specific first. MSW answers with the first handler whose pattern
  // matches, and the document lists `/api/member/member/{id}/` above
  // `/api/member/member/me/` — so in document order the `:id` handler swallows
  // every literal action path under it, and a spec stubbing `.../me/` gets a
  // handler that knows the wrong operation's parameters. Ordering by how many
  // path parameters a route has puts the literal ones in front of the
  // templates that would shadow them.
  return operations.sort((a, b) => paramCount(a.path) - paramCount(b.path))
}

function paramCount(path) {
  return (path.match(/\{[^}]+\}/g) ?? []).length
}

/**
 * Every declared operation, as
 * `{operationId, method, path, pattern, declaredQuery, bodySchema, responseSchema}`.
 */
export const operations = buildOperations()
