/**
 * Annotate `src/api/valibot.gen.ts` with the endpoints each schema belongs to.
 *
 * The generated file is a flat list of ~684 schemas with no indication of which
 * one answers which call. That is the question you actually have when picking a
 * schema for a model file - "is `vOrderUpdate` the one the update endpoint
 * uses, or `vOrderDetail`?" - and getting it wrong is silent: both typecheck,
 * both parse, and the difference only shows up as a form demanding fields the
 * API does not want.
 *
 * So this walks `openapi/schema.yaml`, builds a component -> operations index,
 * and writes it above each schema as a doc comment:
 *
 *   /**
 *    * Response: GET /api/order/order/{id}/
 *    *
 *    * Nested in: OrderDetail, PaginatedOrderList
 *    *\/
 *   export const vOrder = v.object({ ... })
 *
 * Request bodies are attributed to the `Writable` variant, since that is the
 * component hey-api generates for them - which also makes the read/write split
 * visible at each schema rather than something you have to know.
 *
 * Components reached only from other components (nested serializers, pagination
 * envelopes) get a "Nested in" line instead of an endpoint list, so "no
 * endpoints" never looks like "unused".
 *
 * Runs after `openapi-ts` in `npm run codegen`. Idempotent: it strips its own
 * previous block before writing, so re-running never stacks comments. It only
 * ever touches comments it wrote - the generator's own descriptions are kept
 * and this block is placed above them.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const SCHEMA = new URL('../openapi/schema.yaml', import.meta.url)
const TARGET = new URL('../src/api/valibot.gen.ts', import.meta.url)

const METHODS = ['get', 'post', 'put', 'patch', 'delete']
const MARKER = '@endpoints'

/** Every `#/components/schemas/X` reference inside an arbitrary schema node. */
function refsIn(node, found = new Set()) {
  if (!node || typeof node !== 'object') return found

  if (Array.isArray(node)) {
    for (const item of node) refsIn(item, found)
    return found
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === '$ref' && typeof value === 'string') {
      const name = value.split('/').pop()
      if (name) found.add(name)
    } else {
      refsIn(value, found)
    }
  }

  return found
}

const doc = parse(readFileSync(SCHEMA, 'utf8'))
const components = doc.components?.schemas ?? {}

/** name -> { requests: Set, responses: Set, nestedIn: Set } */
const usage = new Map()
const entryFor = (name) => {
  if (!usage.has(name)) usage.set(name, { requests: new Set(), responses: new Set(), nestedIn: new Set() })
  return usage.get(name)
}

for (const [path, item] of Object.entries(doc.paths ?? {})) {
  for (const method of METHODS) {
    const operation = item?.[method]
    if (!operation) continue

    const label = `${method.toUpperCase()} ${path}`

    for (const name of refsIn(operation.requestBody)) entryFor(name).requests.add(label)
    for (const name of refsIn(operation.responses)) entryFor(name).responses.add(label)
  }
}

// Which components sit inside which other components.
for (const [name, schema] of Object.entries(components)) {
  for (const ref of refsIn(schema)) {
    if (ref !== name) entryFor(ref).nestedIn.add(name)
  }
}

/**
 * The generated const name for a component. hey-api strips non-alphanumerics
 * and prefixes `v`; the request-body twin gets a `Writable` suffix.
 */
const constName = (component) => `v${component.replace(/[^A-Za-z0-9]/g, '')}`

function commentFor(component, writable) {
  const entry = usage.get(component)
  if (!entry) return null

  const lines = []
  const endpoints = writable ? entry.requests : entry.responses

  if (endpoints.size) {
    lines.push(`${writable ? 'Request body' : 'Response'}:`)
    for (const endpoint of [...endpoints].sort()) lines.push(`  ${endpoint}`)
  }

  // A read component used as a request body (or vice versa) is worth seeing.
  const other = writable ? entry.responses : entry.requests
  if (!endpoints.size && other.size) {
    lines.push(
      writable
        ? 'No endpoint takes this as a request body; the read component is used instead.'
        : 'No endpoint returns this; it appears only as a request body.',
    )
  }

  if (!endpoints.size && !other.size) {
    if (!entry.nestedIn.size) return null
    lines.push('Not used directly by an endpoint.')
  }

  if (entry.nestedIn.size) {
    const nested = [...entry.nestedIn].sort()
    const shown = nested.slice(0, 6)
    lines.push('')
    lines.push(`Nested in: ${shown.join(', ')}${nested.length > shown.length ? `, +${nested.length - shown.length} more` : ''}`)
  }

  if (!lines.length) return null

  return ['/**', ` * ${MARKER}`, ...lines.map((l) => (l ? ` * ${l}` : ' *')), ' */'].join('\n')
}

let source = readFileSync(TARGET, 'utf8')

// Strip any block this script wrote on a previous run.
source = source.replace(new RegExp(`/\\*\\*\\n \\* ${MARKER}\\n(?: \\*.*\\n)*? \\*/\\n`, 'g'), '')

let annotated = 0
for (const component of Object.keys(components)) {
  for (const writable of [false, true]) {
    const name = constName(component) + (writable ? 'Writable' : '')
    const declaration = `export const ${name} = `

    const index = source.indexOf(`\n${declaration}`)
    if (index === -1) continue

    const comment = commentFor(component, writable)
    if (!comment) continue

    // Insert above the generator's own description block if there is one, so
    // the two read as a single header rather than two stacked comments.
    let at = index + 1
    const before = source.slice(0, at).trimEnd()
    if (before.endsWith('*/')) {
      const start = before.lastIndexOf('/**')
      if (start !== -1) at = start
    }

    source = `${source.slice(0, at)}${comment}\n${source.slice(at)}`
    annotated += 1
  }
}

writeFileSync(TARGET, source)
console.log(`annotate-endpoints: annotated ${annotated} schema(s) in src/api/valibot.gen.ts`)
