/**
 * Generate `src/api/resources.gen.ts`: one object per API resource, binding
 * the generated pieces a screen otherwise names one by one.
 *
 * A create/edit form restates its resource in six places - the retrieve
 * options, the create and update mutations, the query keys it invalidates,
 * and the create and update body schemas - and every one of them is the same
 * resource under a different hey-api name:
 *
 *     retrieve: (id) => companyPictureRetrieveOptions({path: {id}}),
 *     create: companyPictureCreateMutation(),
 *     update: companyPicturePartialUpdateMutation(),
 *     ...
 *     v.parse(vCompanyPicturePartialUpdateBody, body)
 *
 * Six names that must agree is six chances for one to be the wrong
 * resource's, and nothing but a reviewer notices: every combination
 * typechecks. `resources.gen.ts` binds them once, so a form names
 * `companyPicture` and cannot pair the wrong halves.
 *
 * How a resource is found
 * -----------------------
 * drf-spectacular names every operation `<resource>_<verb>`, with the verb one
 * of `list`, `retrieve`, `create`, `update`, `partial_update`, `destroy`. The
 * prefix is the resource; the verbs are grouped under it. Two things are not
 * what their verb says and are dropped:
 *
 * - an operation whose path continues past a `{param}` (`/api/order/order/{id}/assign_me/`,
 *   `/api/company/partner-request/{id}/accept/`) is a verb on a record that
 *   already exists, whatever its method - and its prefix would name a resource
 *   (`order_order_assign_me`) that does not exist;
 * - a `retrieve`-only prefix (`company_import_required`) is a read endpoint,
 *   not a resource: nothing lists it and nothing writes it.
 *
 * What is left is emitted when it has a list, a create or an update, with a
 * `kind` saying how its record is addressed: by id (`collection`), not at all
 * because it is the caller's own (`singleton`: `member/me`, `branch-my`), or
 * there is no record - a pathless POST such as a login or a bulk create
 * (`action`). An update's variables depend on it: a singleton's takes no path.
 *
 * What a write makes stale
 * ------------------------
 * Each resource also carries `reads`: the hey-api query-key id of every list
 * and retrieve whose path sits under the resource's - its own list and detail,
 * and the filtered views beside them (`user-sick-leave/admin/all_sick/`,
 * `invoice/invoice/sent/`). Those are the reads of the same rows, so they are
 * what a write to the resource makes stale, and `invalidateReads` in the forms
 * kit refreshes them all. The ids are strings rather than the key factories
 * because a factory for a detail read demands the id it has no use for here:
 * hey-api keys every query `[{_id, baseURL, path?, query?}]`, and tanstack's
 * partial matching means `[{_id}]` alone reaches every variant of that read.
 * A read that is stale for a reason the schema cannot state - a module write
 * changing what the *member* list returns - stays in a hand-written
 * `invalidation.ts`; that is what those modules are for now.
 *
 * Every binding is checked against what hey-api actually declared, so a
 * renamed export fails the run rather than producing a file that fails to
 * typecheck later. Runs after `openapi-ts` in `npm run codegen`; it writes only
 * its own file.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { toCase } from '@hey-api/openapi-ts'
import { parse } from 'yaml'

const SCHEMA = new URL('../openapi/schema.yaml', import.meta.url)
const VALIBOT = new URL('../src/api/valibot.gen.ts', import.meta.url)
const TANSTACK = new URL('../src/api/@tanstack/vue-query.gen.ts', import.meta.url)
const TARGET = new URL('../src/api/resources.gen.ts', import.meta.url)

/** drf-spectacular's verb suffix -> the key it is emitted under. */
const VERBS = {
  list: 'list',
  retrieve: 'retrieve',
  create: 'create',
  partial_update: 'update',
  update: 'replace',
  destroy: 'destroy',
}
const VERB_SUFFIX = new RegExp(`_(${Object.keys(VERBS).join('|')})$`)

const READS = new Set(['list', 'retrieve'])

const doc = parse(readFileSync(SCHEMA, 'utf8'))
const valibotSource = readFileSync(VALIBOT, 'utf8')
const tanstackSource = readFileSync(TANSTACK, 'utf8')

/** Every export the two generated modules declare, to bind against. */
const declaredIn = (source) =>
  new Set([...source.matchAll(/^export const ([A-Za-z0-9_]+)\b/gm)].map((match) => match[1]))
const valibotExports = declaredIn(valibotSource)
const tanstackExports = declaredIn(tanstackSource)
/** The `_id` hey-api gives each query's key, as `createQueryKey('<id>', ...)` states it. */
const queryKeyIds = new Set([...tanstackSource.matchAll(/createQueryKey\('([A-Za-z0-9_]+)'/g)].map((match) => match[1]))

const onInstance = (path) => path.includes('{')

/** A `{param}` followed by more path: a verb on that record, not one of its resource's operations. */
const isAction = (path) => /\{[^}]+\}\/./.test(path)

/** `/api/member/module/{id}/` -> `api/member/module`. */
const resourcePath = (path) =>
  path
    .split('/')
    .filter((segment) => segment && !onInstance(segment))
    .join('/')

/** resource prefix -> {paths: Set, operations: {verb -> operation}} */
const groups = new Map()
/** Every list and retrieve, by path, for the `reads` of the resource above it. */
const reads = []

for (const [path, item] of Object.entries(doc.paths ?? {})) {
  for (const [method, operation] of Object.entries(item)) {
    const id = operation?.operationId
    if (!id) continue

    const verb = id.match(VERB_SUFFIX)?.[1]
    if (!verb) throw new Error(`${method.toUpperCase()} ${path}: operationId ${id} has no drf-spectacular verb suffix`)

    const key = VERBS[verb]
    // A read under an instance (`trip/{id}/trip_availability_detail/`) is still
    // a read of that resource's rows, so it counts toward `reads` before the
    // action rule drops it from the grouping.
    if (READS.has(key)) reads.push({ id, path })
    if (isAction(path)) continue

    const prefix = id.slice(0, -(verb.length + 1))
    if (!groups.has(prefix)) groups.set(prefix, { paths: new Set(), operations: {} })
    const group = groups.get(prefix)

    if (group.operations[key]) {
      throw new Error(`${prefix} has two ${verb} operations: ${group.operations[key].id} and ${id}`)
    }
    group.paths.add(path)
    group.operations[key] = {
      id,
      path,
      hasBody: Boolean(operation.requestBody),
      idParam: (operation.parameters ?? []).find((param) => param.in === 'path' && param.name === 'id')?.schema?.type,
    }
  }
}

/** A generated export this resource needs, or an error naming what hey-api calls it now. */
function bind(exports, name, file, id) {
  if (!exports.has(name)) {
    throw new Error(`${id}: expected ${file} to export ${name}; hey-api's naming has changed - update this script.`)
  }
  return name
}

const resources = []
const byName = new Map()

for (const prefix of [...groups.keys()].sort()) {
  const { paths, operations } = groups.get(prefix)
  if (!operations.list && !operations.create && !operations.update) continue

  const pathKeys = new Set([...paths].map(resourcePath))
  if (pathKeys.size !== 1) {
    throw new Error(`${prefix} spans ${[...pathKeys].join(', ')}; a resource lives under one path`)
  }

  const name = toCase(prefix, 'camelCase')
  if (byName.has(name)) throw new Error(`${prefix} and ${byName.get(name)} both camelCase to ${name}`)
  byName.set(name, prefix)

  const entries = {}
  for (const key of Object.values(VERBS)) {
    if (!operations[key]) continue
    const { id, hasBody } = operations[key]
    const camel = toCase(id, 'camelCase')
    if (READS.has(key)) {
      entries[key] = {
        options: bind(tanstackExports, `${camel}Options`, 'vue-query.gen', id),
        queryKey: bind(tanstackExports, `${camel}QueryKey`, 'vue-query.gen', id),
      }
    } else {
      entries[key] = { mutation: bind(tanstackExports, `${camel}Mutation`, 'vue-query.gen', id) }
      // hey-api aliases each body schema to the operation's own name, and that
      // alias already resolves the `Writable` twin and the array-bodied
      // endpoints correctly - so it is bound as-is, never re-derived.
      if (hasBody) {
        entries[key].body = bind(valibotExports, `v${toCase(id, 'PascalCase')}Body`, 'valibot.gen', id)
      }
    }
  }

  const path = [...pathKeys][0]
  const hasRecord = operations.retrieve || operations.update || operations.destroy
  const kind = operations.list || [...paths].some(onInstance) ? 'collection' : hasRecord ? 'singleton' : 'action'

  // DRF declares nearly every `{id}` an integer, but a handful of retrieves
  // (`order/order`) declare a string, and hey-api types the options to match.
  // The retrieve's declaration is the one that matters: it is the read a form
  // makes by id. A collection without a retrieve has no id to type.
  const idType = operations.retrieve?.idParam === 'string' ? 'string' : 'number'

  const readIds = reads
    .filter((read) => read.path.startsWith(`/${path}/`))
    .map((read) => bind(queryKeyIds, toCase(read.id, 'camelCase'), 'vue-query.gen (as a query-key id)', read.id))
    .sort()

  resources.push({ name, path, kind, idType, entries, reads: readIds })
}

const tanstackImports = new Set()
const valibotImports = new Set()
for (const { entries } of resources) {
  for (const entry of Object.values(entries)) {
    for (const [field, name] of Object.entries(entry)) {
      ;(field === 'body' ? valibotImports : tanstackImports).add(name)
    }
  }
}

const importBlock = (names, from) =>
  `import {\n${[...names].sort().map((name) => `  ${name},`).join('\n')}\n} from '${from}'`

const resourceBlocks = resources.map(({ name, path, kind, idType, entries, reads }) => {
  const lines = Object.entries(entries).map(
    ([key, entry]) =>
      `  ${key}: {${Object.entries(entry)
        .map(([field, value]) => `${field}: ${value}`)
        .join(', ')}},`,
  )
  return `/** \`${path}\` */
export const ${name} = {
  path: '${path}',
  kind: '${kind}',${kind === 'collection' ? `\n  id: '${idType}',` : ''}
${lines.join('\n')}
  reads: [${reads.map((id) => `'${id}'`).join(', ')}],
} as const satisfies Resource`
})

writeFileSync(
  TARGET,
  `// This file is auto-generated by scripts/generate-resources.mjs from
// openapi/schema.yaml. Do not edit; run \`npm run codegen\` instead.
//
// One object per resource the API lists, creates or updates, binding the
// generated query options, mutations and body schemas that belong to it. A
// screen names the resource and gets every half from the same place, instead
// of naming each generated export by hand and hoping they agree.
//
// Each resource is its own export, so importing one binds only what it
// references. Reads carry \`{options, queryKey}\`; writes carry \`{mutation}\`
// and, where the endpoint takes a body, its valibot schema as \`body\`;
// \`reads\` names every query under the resource's path, for invalidation.
import type { UseMutationOptions } from '@tanstack/vue-query'
import type { GenericSchema } from 'valibot'

${importBlock(tanstackImports, './@tanstack/vue-query.gen')}
${importBlock(valibotImports, './valibot.gen')}

/** A list, or a singleton's retrieve: its generated \`*Options\` and \`*QueryKey\` factories. */
export interface ResourceRead {
  readonly options: (...args: never[]) => object
  readonly queryKey: (...args: never[]) => readonly unknown[]
}

/** A collection's retrieve: the options take the record's id in the path. */
export interface ResourceRecordRead<TId extends number | string> extends ResourceRead {
  readonly options: (options: {path: {id: TId}}) => object
}

/** A create, update, replace or destroy: its generated \`*Mutation\` factory and the body it takes. */
export interface ResourceWrite {
  // \`any\`, as in \`useResourceForm\`: UseMutationOptions is invariant in its
  // response and error slots, so no single wider type admits every mutation.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly mutation: (...args: never[]) => UseMutationOptions<any, any, any>
  readonly body?: GenericSchema
}

interface ResourceBase {
  readonly path: string
  /**
   * The hey-api query-key id (\`[{_id}]\`) of every list and retrieve under
   * \`path\`: the reads a write to this resource makes stale.
   */
  readonly reads: readonly string[]
}

/**
 * The shape every resource below satisfies, by how its record is addressed.
 * Which of the operations a resource has is its own type; the union says
 * which it *can* have, so the generator's classification is checked here.
 */
export type Resource = CollectionResource<number> | CollectionResource<string> | SingletonResource | ActionResource

/** Records addressed by id: the ordinary DRF viewset. */
export interface CollectionResource<TId extends number | string> extends ResourceBase {
  readonly kind: 'collection'
  /**
   * How the retrieve declares its \`{id}\`. DRF says integer nearly
   * everywhere, string for a few (\`order/order\`), and hey-api types the
   * options to match - so a caller narrows on this before building the path.
   */
  readonly id: TId extends number ? 'number' : 'string'
  readonly list?: ResourceRead
  readonly retrieve?: ResourceRecordRead<TId>
  readonly create?: ResourceWrite
  readonly update?: ResourceWrite
  readonly replace?: ResourceWrite
  readonly destroy?: ResourceWrite
}

/** The caller's own record (\`member/me\`, \`branch-my\`): read and updated without a path. */
export interface SingletonResource extends ResourceBase {
  readonly kind: 'singleton'
  readonly retrieve?: ResourceRead
  readonly update?: ResourceWrite
}

/** A pathless POST with no record behind it - a login, a bulk create. */
export interface ActionResource extends ResourceBase {
  readonly kind: 'action'
  readonly create: ResourceWrite
}

export type ResourceKind = Resource['kind']

${resourceBlocks.join('\n\n')}
`,
)

const byKind = {}
for (const { kind } of resources) byKind[kind] = (byKind[kind] ?? 0) + 1
const kinds = Object.entries(byKind).map(([kind, count]) => `${count} ${kind}`).join(', ')
console.log(
  `generate-resources: ${resources.length} resource(s) (${kinds}), ` +
    `${tanstackImports.size} query/mutation binding(s), ${valibotImports.size} body binding(s)`,
)
