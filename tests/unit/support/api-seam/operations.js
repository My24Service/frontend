import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

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

/**
 * The reduced table above, cached on disk.
 *
 * The document is 1.4 MB over 53k lines and `YAML.parse` spends ~1.1 s on it.
 * This module is in the graph of ~118 spec files and vitest's isolation
 * re-evaluates that graph for every one of them, so parsing the document here
 * cost ~130 CPU-seconds a run — the largest single item in the suite's import
 * phase, about a third of it. The reduction is a pure function of the file, and
 * `JSON.parse` of the same data is ~20x faster than the YAML parse, so the
 * reduced rows are cached under `node_modules/.cache` (already gitignored) and
 * keyed on the source file's size and mtime, which `npm run codegen` changes.
 *
 * The valibot schemas are deliberately *not* cached: they are live objects, not
 * data. They are looked up by operation id on every load, which is a property
 * access on an already-imported module.
 */
const CACHE_PATH = resolve(process.cwd(), 'node_modules/.cache/my24/schema-operations.json')

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

/**
 * Pull the operation rows out of the parsed document. Everything here is plain
 * data, which is what makes it cacheable; the schemas are attached afterwards.
 */
function reduceDocument(document) {
  const rows = []

  for (const [path, item] of Object.entries(document.paths ?? {})) {
    for (const method of METHODS) {
      const operation = item[method]
      if (!operation) continue

      const parameters = [...(item.parameters ?? []), ...(operation.parameters ?? [])]

      rows.push({
        operationId: operation.operationId,
        method,
        path,
        // MSW's matcher syntax. The leading `*` matches any origin: the two
        // clients disagree about the base URL (`${origin}/api` versus
        // `${origin}`), and under happy-dom the origin is whatever the test
        // environment made up.
        pattern: `*${path.replace(/\{([^}]+)\}/g, ':$1')}`,
        declaredQuery: parameters
          .filter((parameter) => parameter.in === 'query')
          .map((parameter) => parameter.name),
      })
    }
  }

  return rows
}

function readCache(stamp) {
  try {
    const cached = JSON.parse(readFileSync(CACHE_PATH, 'utf8'))
    return cached.stamp === stamp ? cached.rows : null
  } catch {
    // Missing, unreadable or written by an older format: parse the document.
    return null
  }
}

function writeCache(stamp, rows) {
  try {
    mkdirSync(dirname(CACHE_PATH), { recursive: true })
    // Written to a sibling and renamed, so a worker reading concurrently either
    // sees the previous cache or the new one and never a half-written file.
    const temporary = `${CACHE_PATH}.${process.pid}.tmp`
    writeFileSync(temporary, JSON.stringify({ stamp, rows }))
    renameSync(temporary, CACHE_PATH)
  } catch {
    // An unwritable cache is not an error: parsing the document is the
    // fallback, and is what this module did before the cache existed.
  }
}

function buildOperations() {
  const { mtimeMs, size } = statSync(SCHEMA_PATH)
  const stamp = `${size}:${mtimeMs}`

  let rows = readCache(stamp)
  if (!rows) {
    rows = reduceDocument(parse(readFileSync(SCHEMA_PATH, 'utf8')))
    writeCache(stamp, rows)
  }

  const operations = rows.map((row) => ({
    ...row,
    declaredQuery: new Set(row.declaredQuery),
    bodySchema: schemaFor(row.operationId, 'Body'),
    responseSchema: schemaFor(row.operationId, 'Response'),
  }))

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
