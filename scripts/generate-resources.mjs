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

/**
 * Model types a resource of the same name shadows that no operation of it
 * answers with, so the shadowing costs nothing. Each is listed with its reason,
 * because the check below fails the run on any name not here - so a new one is
 * a decision someone has to make, not an accident.
 */
const UNREACHABLE_SHADOWS = new Map([
  // A 204-returning action whose same-named type is a serializer shape no
  // endpoint returns: the body is `ChangePasswordRequestRequest`, and the
  // `ChangePassword` model is referenced by nothing.
  ['ChangePassword', 'a 204 action; the body is ChangePasswordRequestRequest'],
  // `api/member/contract` serves the `Contract` model - `MemberContract` is a
  // member's nested contract, not this resource's record. Reachable as
  // `Api.Contract`, which is what the resource answers with anyway.
  ['MemberContract', 'the resource answers with Contract; MemberContract is the nested shape'],
])

const doc = parse(readFileSync(SCHEMA, 'utf8'))
const valibotSource = readFileSync(VALIBOT, 'utf8')
const tanstackSource = readFileSync(TANSTACK, 'utf8')

/** Every export the two generated modules declare, to bind against. */
const declaredIn = (source) =>
  new Set([...source.matchAll(/^export const ([A-Za-z0-9_]+)\b/gm)].map((match) => match[1]))
const valibotExports = declaredIn(valibotSource)
const tanstackExports = declaredIn(tanstackSource)
/** `export type X` in types.gen, which is where a read's record type lives. */
const typeExportsSource = readFileSync(new URL('../src/api/types.gen.ts', import.meta.url), 'utf8')
const typeExports = new Set(
  [...typeExportsSource.matchAll(/^export type ([A-Za-z0-9_]+)\b/gm)].map((match) => match[1]),
)

/**
 * What an operation's `*Response` alias resolves to, or null when it cannot be
 * resolved statically. The alias is an indirection -
 * `XResponse = XResponses[keyof XResponses]` - so the answer lives in the
 * status map `XResponses` it points at, not on the alias line. Resolving that
 * rather than pattern-matching the alias text is what lets the shadowing check
 * below ask a real question.
 */
function responseTypeOf(operationId) {
  const Pascal = toCase(operationId, 'PascalCase')
  // The only shape hey-api emits for a single success status. A `Blob`/`File`
  // response or a multi-status one is not a model, and is not matched.
  if (!new RegExp(`^export type ${Pascal}Response = ${Pascal}Responses\\[keyof ${Pascal}Responses\\];$`, 'm').test(typeExportsSource)) {
    return null
  }
  const body = typeExportsSource.match(new RegExp(`^export type ${Pascal}Responses = \\{([\\s\\S]*?)^\\};$`, 'm'))
  if (!body) return null
  // A plain numeric key is a success status; `error` is spelled out and does
  // not contribute, and neither does a `default`.
  const successes = [...body[1].matchAll(/^\s*(\d+):\s*([^;]+);/gm)]
    .filter(([, status]) => Number(status) < 400)
    .map(([, , value]) => value.trim())
  return successes.length === 1 ? successes[0] : null
}
/** The `_id` hey-api gives each query's key, as `createQueryKey('<id>', ...)` states it. */
const queryKeyIds = new Set([...tanstackSource.matchAll(/createQueryKey\('([A-Za-z0-9_]+)'/g)].map((match) => match[1]))
/** operationId -> whether it declares an `in: query` parameter, for the list query schema. */
const hasQueryParams = new Map()
/**
 * operationId -> whether its `listOptions` can be generated: the list must
 * take a pageable query and nothing the page parameters cannot supply.
 *
 * A list with no query (`query?: never`) has nothing to spread a page into,
 * one with a required query parameter (`invoiceId: number`) cannot be paged
 * without it, and one scoped to a parent (`/{order_id}/`) needs a path the
 * table's page parameters know nothing about. Those keep their bare
 * `list.options`, which is the honest spelling for them: the caller supplies
 * what the endpoint insists on.
 */
const pageableLists = new Map()
/** operationId -> the query parameter names its list declares, for the filters. */
const queryParamNames = new Map()

/**
 * The four query parameters `baseListParams` already sends, so deriving a
 * list's filters does not derive them a second time.
 */
const BASE_PARAMS = new Set(['page', 'page_size', 'q', 'ordering'])

/**
 * Query parameters no `listOptions` sends, with the reason each is out.
 *
 * drf-spectacular emits no `deprecated: true` for any of them, so the policy
 * cannot be read off the schema and has to be written down here - and a
 * hand-written list is the right shape for that, because adding a name to it is
 * a decision someone makes rather than a change the schema makes silently.
 *
 * - `sort_dir` / `sort_field`: superseded by `ordering`, which every list
 *   already sends through the base parameters. No screen sets them.
 */
const EXCLUDED_PARAMS = new Map([
  ['sort_dir', 'superseded by `ordering`'],
  ['sort_field', 'superseded by `ordering`'],
])

/**
 * Parameters that page a list by something other than `page`/`page_size`.
 *
 * They are derived like any other filter - a screen has no column for one, so
 * it never reaches the wire - but a screen that did set one would send
 * `?offset=` beside `?page=`, and the two schemes disagree. The run summary
 * names every resource whose derived set contains one, so that a screen
 * adopting it is a decision rather than an accident.
 */
const ALTERNATE_PAGINATION = new Set(['limit', 'offset'])

/** operationId -> the valibot alias of its body, for the Input/Output types. */
const bodySchemas = new Map()

/**
 * The column filters a list derives: every query parameter it declares, less
 * the four the base parameters send and the two the policy excludes.
 *
 * This is the whole point of `listOptions`: a screen's filter set is the
 * endpoint's, so a screen never restates it. It is right for every list
 * because `columnFilters` sends only the names the table actually holds a
 * value for - a derived name the screen has no column for is simply absent
 * from the query and never reaches the wire. Naming them at the call site is
 * then only for the screen that genuinely wants a *subset* (or has a filter
 * the endpoint does not declare, which the generated type then rejects).
 */
function derivedFilters(operationId) {
  return (queryParamNames.get(operationId) ?? [])
    .filter((param) => !BASE_PARAMS.has(param) && !EXCLUDED_PARAMS.has(param))
    .sort()
}

/**
 * Whether a generated `listOptions` can build this operation's request: the
 * endpoint must take a query it can page, and take neither a required query
 * parameter nor a path.
 *
 * Read off the generated `*Data` type rather than the schema, because that type
 * is what the generated options function accepts - a `listOptions` that does
 * not typecheck against it is a broken convenience, not a loose one. `query`:
 * `never` means the endpoint takes no query at all; a required member inside
 * `query` means it insists on one the page parameters cannot supply; a
 * required `path` means it is a list scoped to one parent, which a table's
 * page parameters say nothing about.
 */
function isPageable(operationId, operation) {
  const Data = `${toCase(operationId, 'PascalCase')}Data`
  const body = typeExportsSource.match(new RegExp(`^export type ${Data} = \\{([\\s\\S]*?)^\\};$`, 'm'))
  if (!body) return false

  const query = body[1].match(/^\s*query\??:\s*([\s\S]*?);$/m)?.[1].trim()
  if (query === undefined || query === 'never') return false
  if (/^\s*path:\s*\{/m.test(body[1])) return false

  // A `query` whose members are all `?:` can be built from the page
  // parameters alone; the generated type is an object literal either way, so
  // a required member is what disqualifies it. The schema is the authority on
  // that: it is what decided `required` in the first place.
  const required = (operation.parameters ?? [])
    .filter((param) => param.in === 'query' && param.required)
    .map((param) => param.name)
  return required.length === 0
}

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
    hasQueryParams.set(
      id,
      (operation.parameters ?? []).some((param) => param.in === 'query'),
    )
    pageableLists.set(id, isPageable(id, operation))
    queryParamNames.set(
      id,
      (operation.parameters ?? []).filter((param) => param.in === 'query').map((param) => param.name),
    )
    bodySchemas.set(id, Boolean(operation.requestBody) ? `v${toCase(id, 'PascalCase')}Body` : null)
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

/** `CompanyBranch` -> `companyBranch`: the local each resource's object is built as. */
const lowerFirst = (name) => name.charAt(0).toLowerCase() + name.slice(1)

/** A generated export this resource needs, or an error naming what hey-api calls it now. */
function bind(exports, name, file, id) {
  if (!exports.has(name)) {
    throw new Error(`${id}: expected ${file} to export ${name}; hey-api's naming has changed - update this script.`)
  }
  return name
}

/** The generated export names this run binds, for the import blocks. */
const tanstackImports = new Set()
const valibotImports = new Set()
const typeImports = new Set()

const resources = []
const byName = new Map()
/**
 * Model types a resource of the same name shadows, so `src/services/api-client`
 * leaves them out of its types.gen re-export rather than colliding (TS2308).
 * The resource is what a caller wants by that name; the model it hides is
 * reachable as `<Resource>.Record` (or, for an action, the create's response).
 */
const shadowedModels = []

for (const prefix of [...groups.keys()].sort()) {
  const { paths, operations } = groups.get(prefix)
  if (!operations.list && !operations.create && !operations.update) continue

  const pathKeys = new Set([...paths].map(resourcePath))
  if (pathKeys.size !== 1) {
    throw new Error(`${prefix} spans ${[...pathKeys].join(', ')}; a resource lives under one path`)
  }

  // PascalCase, so a resource is named like the model it binds: `Api.Branch`,
  // `Api.CompanyBranch`, and the types under it read as one family
  // (`Api.CompanyBranch.Record`). A resource is a thing, not a variable, and
  // `Api.companyBranch` beside `Api.CompanyBranch.Record` would read as a
  // mismatch rather than a pair.
  const name = toCase(prefix, 'PascalCase')
  if (byName.has(name)) throw new Error(`${prefix} and ${byName.get(name)} both PascalCase to ${name}`)
  byName.set(name, prefix)

  // A resource whose name is also a model's (`api/order/document` is
  // `OrderDocument`) shadows that model in the `Api` barrel: the resource and
  // the model cannot both be a top-level name, so the barrel re-exports
  // types.gen *except* the shadowed names - `shadowedModels` is that list.
  //
  // Shadowing is only sound when the model stays reachable under the resource.
  // It does whenever an operation of this resource answers with it: the
  // retrieve for a collection (`Record`), the create for an action that
  // returns one. Checked, not assumed - a collision with nothing answering
  // with the model would drop the type out of the barrel silently, which is
  // worth failing the run over. The one such model today is `ChangePassword`:
  // a 204-returning action whose same-named type is a serializer shape no
  // endpoint returns (the body is `ChangePasswordRequestRequest`), so it is
  // dead weight rather than a reachable type. Listed here rather than handled
  // by a name exception, so a second one is a decision, not an accident.
  if (typeExports.has(name)) {
    const answered = Object.values(VERBS)
      .map((key) => operations[key])
      .filter(Boolean)
      .some(({ id }) => responseTypeOf(id) === name)
    shadowedModels.push({name, reachable: answered})
    if (!answered && !UNREACHABLE_SHADOWS.has(name)) {
      throw new Error(
        `${prefix} is named ${name}, which is also a model type, but no operation of it answers with ` +
          `${name}; \`Api.${name}\` would shadow the model and drop it from the barrel. Either name one of ` +
          `them differently, or add ${name} to UNREACHABLE_SHADOWS in this script with the reason it is ` +
          `safe to shadow.`,
      )
    }
  }

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

  // The types that hang off this resource as `Api.<name>.<Type>`. Collected
  // here and emitted as a `declare namespace` beside the const, so a caller
  // reaches the record a read answers with, and the body a write takes, from
  // the same name as the read and the write themselves.
  //
  // Each is bound rather than guessed: the record type is the operation's own
  // response type (not a model name spelled out here, which could drift from
  // what the operation actually answers with), and a body type is inferred
  // from the valibot schema already bound as the operation's `body`.
  const types = []
  /** `Record` as a generated `<Operation>Response` type, checked then imported. */
  const response = (id, alias, doc) => {
    const name = bind(typeExports, `${toCase(id, 'PascalCase')}Response`, 'types.gen', id)
    typeImports.add(name)
    types.push({alias, expr: name, doc})
  }
  /** An Input/Output pair inferred from a body schema already bound above. */
  const body = (key, schema, doc) => {
    for (const [io, infer] of [
      ['Input', 'InferInput'],
      ['Output', 'InferOutput'],
    ]) {
      types.push({alias: `${key}${io}`, expr: `${infer}<typeof ${schema}>`, doc: doc[io]})
    }
  }

  if (operations.list) {
    response(operations.list.id, 'ListResponse', `What \`list\` answers with.`)
    // Only when the operation declares query parameters: a list with no
    // declared `in: query` parameter has no generated query schema, and
    // binding one anyway would throw on a name that does not exist rather
    // than quietly omit the one thing a caller would reach for here.
    if (hasQueryParams.get(operations.list.id)) {
      const query = bind(valibotExports, `v${toCase(operations.list.id, 'PascalCase')}Query`, 'valibot.gen', operations.list.id)
      valibotImports.add(query)
      types.push({alias: 'ListQuery', expr: `InferInput<typeof ${query}>`, doc: `The \`list\` query parameters.`})
    }
  }
  if (operations.retrieve) {
    response(operations.retrieve.id, 'Record', `What \`retrieve\` answers with.`)
  }
  for (const key of ['create', 'update', 'replace']) {
    const schema = bodySchemas.get(operations[key]?.id)
    if (!schema) continue
    const Verb = key === 'create' ? 'Create' : key === 'update' ? 'Update' : 'Replace'
    body(Verb, schema, {
      Input: `The \`${key}\` body, as it is sent.`,
      Output: `The \`${key}\` body, as the schema parses it.`,
    })
  }

  // Whether `listOptions` can be generated at all (see `isPageable`), and
  // whether it can take named filters: a pageable list that declares no query
  // parameters has no `ListQuery` type in its namespace either, so there is
  // nothing to check a filter name against.
  const pageable = Boolean(operations.list && pageableLists.get(operations.list.id))
  const hasListQuery = Boolean(pageable && hasQueryParams.get(operations.list.id))

  resources.push({ name, path, kind, idType, entries, reads: readIds, types, hasListQuery, pageable, listId: operations.list?.id })
}

for (const { entries } of resources) {
  for (const entry of Object.values(entries)) {
    for (const [field, name] of Object.entries(entry)) {
      ;(field === 'body' ? valibotImports : tanstackImports).add(name)
    }
  }
}

const importBlock = (names, from) =>
  `import {\n${[...names].sort().map((name) => `  ${name},`).join('\n')}\n} from '${from}'`

/**
 * The types that hang off a resource, as a `declare namespace` beside its
 * const. A `declare namespace` is the one form that merges with a `const`:
 * both the value `Api.<name>` and the types `Api.<name>.<Type>` come from the
 * same name, so a screen reaches a resource's reads, writes, bodies and
 * record types through one identifier. (An `interface` of the same name would
 * merge too, but its members are properties, not types - `Api.<name>.Record`
 * would be TS2713.)
 */
const typeBlock = (name, types) =>
  `export declare namespace ${name} {\n${types
    .map(({alias, expr, doc}) => `  /** ${doc} */\n  export type ${alias} = ${expr}`)
    .join('\n')}\n}`

/**
 * The convenience methods every resource carries, so a screen names the
 * resource and never repeats what the schema already says.
 *
 * Each is generated from the bindings above rather than written per resource:
 * `listOptions` is `list.options` plus the base page parameters, `invalidate`
 * is the resource's own `reads`, and the rest are the singletons' call shapes
 * that every consumer used to re-derive from `kind` and `id`.
 *
 * They are plain literal properties, not a shared prototype. There are a few
 * hundred resources, built once at module load - the `Object.create` pattern
 * that TanStack Table uses for its rows is worth ~60 bytes per instance, which
 * is a rounding error against a few hundred objects and the parsed source.
 * (The same post's numbers are for 100k-10M rows.) A prototype would also lose
 * the literal types that make `Api.<name>.Record` exact, which is the point of
 * the namespace.
 */
const convenienceBlock = ({name, kind, entries, filterKeys, pageable, idType}) => {
  const out = []

  if (entries.list && pageable) {
    // The screen names a filter set only when it wants a *subset* of the one
    // the endpoint declares. The default is the derived set, so the common case
    // - a screen whose columns are the endpoint's own filters - passes nothing.
    // A list that declares no filters at all has nothing to narrow, so it takes
    // no second parameter.
    const filters = filterKeys.length === 0
      ? ''
      : `filters: readonly (keyof ${name}.ListQuery)[] = ${lowerFirst(name)}Filters`
    const filterBody = filterKeys.length === 0
      ? `        ...baseListParams(query),`
      : `        ...baseListParams(query),
        ...columnFilters(query, filters),`
    const filterDocs = filterKeys.length === 0
      ? ''
      : `
   *
   * \`filters\` defaults to every filter \`${name}\` declares, so a screen whose
   * columns are the endpoint's own filters passes nothing and cannot drift from
   * them. Name it only to send a subset. A name the endpoint does not declare
   * does not typecheck.`
    out.push(
      `  /**
   * The generated list options for a server-paged table: the four base page
   * parameters${filterKeys.length === 0 ? '' : ', plus this resource\'s column filters'}.${filterDocs}
   */
  listOptions: (query: ServerPagedListQuery${filters ? `, ${filters}` : ''}) =>
    ${entries.list.options}({
      query: {
${filterBody}
      },
    }),`,
    )
  }

  // `invalidate` is the one convenience that names no generated export: it is a
  // walk over the resource's own `reads`, which is why it is spelled
  // `invalidateReads(thisResource.reads)` and can be. Every other convenience
  // below binds a named export, so the generator can write it.
  out.push(
    `  /**
   * Refresh every read under this resource's path - its own list and detail,
   * and the filtered views and counts beside them - in one call.
   *
   * \`(queryClient?)\`: the application singleton by default, so a delete modal
   * can call this straight from a click handler; a caller inside \`setup\`
   * passes the client it already holds.
   */
  invalidate: invalidateReads(${lowerFirst(name)}Reads),`,
  )

  if (entries.retrieve) {
    out.push(
      kind === 'singleton'
        ? `  /** The retrieve options for this record: no path, because it is the caller's own. */
  retrieveOptions: () => ${entries.retrieve.options}(),`
        : `  /**
   * The retrieve options for one record, with its id in the path.
   *
   * ${idType === 'string' ? 'The id is stringified: DRF declares this resource by name, and the generated options type its path as a string.' : 'The id is passed as declared - this endpoint declares an integer id.'}
   */
  retrieveOptions: (id: ${idType}) => ${entries.retrieve.options}({path: {id${idType === 'string' ? ': String(id)' : ''}}}),`,
    )
  }

  if (entries.create) {
    out.push(`  /** The create mutation options, for \`useMutation\`. */\n  createMutation: () => ${entries.create.mutation}(),`)
  }
  if (entries.update) {
    // The body is typed as the resource's own `UpdateInput`, so a form's
    // `parse` is checked against the schema hey-api generated for this exact
    // endpoint rather than against `unknown`.
    const body = entries.update.body ? `${name}.UpdateInput` : 'unknown'
    out.push(
      `  /** The update mutation options, for \`useMutation\`. */
  updateMutation: () => ${entries.update.mutation}(),
  /**
   * What an update sends: the body, ${kind === 'singleton' ? 'and nothing else - a singleton has no path.' : 'plus the record\'s id in the path.'}
   */
  updateVars: (${kind === 'singleton' ? 'body' : `id: ${idType}, body`}: ${body}) => ({${kind === 'singleton' ? '' : 'path: {id}, '}body}),`,
    )
  }
  if (entries.destroy) {
    out.push(`  /** The destroy mutation options, for \`useMutation\`. */\n  destroyMutation: () => ${entries.destroy.mutation}(),`)
  }

  return out.join('\n')
}

const resourceBlocks = resources.map((resource) => {
  const {name, path, kind, idType, entries, reads, types, hasListQuery, pageable, listId} = resource
  // The filter set this list derives, emitted once beside the resource so
  // `listOptions`'s default is a name rather than an inline literal.
  const filterKeys = pageable ? derivedFilters(listId) : []
  const lines = Object.entries(entries).map(
    ([key, entry]) =>
      `  ${key}: {${Object.entries(entry)
        .map(([field, value]) => `${field}: ${value}`)
        .join(', ')}},`,
  )
  const conveniences = convenienceBlock({name, kind, entries, filterKeys, pageable, idType})
  const namespace = types.length > 0 ? `\n\n${typeBlock(name, types)}` : ''
  // The derived filter set, one local per resource, annotated with the
  // resource's own `ListQuery` keys. The annotation is the check that matters:
  // if the schema drops a filter, this array no longer typechecks and the run
  // fails rather than sending a parameter the endpoint no longer accepts.
  const filters = filterKeys.length === 0
    ? ''
    : `const ${lowerFirst(name)}Filters: readonly (keyof ${name}.ListQuery)[] = [${filterKeys.map((key) => `'${key}'`).join(', ')}]\n\n`
  return `${filters}const ${lowerFirst(name)}Reads: readonly string[] = [${reads.map((id) => `'${id}'`).join(', ')}]

const ${lowerFirst(name)} = {
  path: '${path}',
  kind: '${kind}',${kind === 'collection' ? `\n  id: '${idType}',` : ''}
${lines.join('\n')}
  reads: ${lowerFirst(name)}Reads,

  // The conveniences. Generated from the bindings above rather than written
  // per resource, so they cannot drift from what the schema declares.
${conveniences}
} as const satisfies Resource

/** \`${path}\` */
export const ${name} = ${lowerFirst(name)}${namespace}`
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
//
// Each resource also declares a namespace of its own types - the record a
// read answers with, the query parameters a list takes, the body a write
// takes and parses - so \`Api.<resource>.Record\` sits beside
// \`Api.<resource>.retrieve\` under one name.
//
// And a handful of conveniences, so the shapes a screen would otherwise
// re-derive from \`kind\` and \`id\` are derived once: \`listOptions\` (the base
// page parameters plus the screen's column filters), \`retrieveOptions\`,
// \`createMutation\`/\`updateMutation\`, \`updateVars\` (what an update sends),
// and \`invalidate\` (every read under the path, on the app's query client).
import type { QueryClient, UseMutationOptions } from '@tanstack/vue-query'
import type { GenericSchema, InferInput, InferOutput } from 'valibot'

import { baseListParams, columnFilters, type ServerPagedListQuery } from '../services/api-client/list-params'
import { invalidateReads } from '../services/api-client/invalidation'

${importBlock(tanstackImports, './@tanstack/vue-query.gen')}
${importBlock(valibotImports, './valibot.gen')}
${typeImports.size > 0 ? `\nimport type {\n${[...typeImports].sort().map((name) => `  ${name},`).join('\n')}\n} from './types.gen'\n` : ''}

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
  /**
   * \`invalidateReads(this.reads)\`: refreshes every one of them. Optional
   * because \`satisfies\` only checks what is declared, and this is the one
   * member present on every resource whatever its kind.
   */
  readonly invalidate: (queryClient?: QueryClient) => Promise<unknown[]>
}

/**
 * The conveniences a resource carries, declared per kind so the generated
 * object literal is checked against the shape it claims.
 *
 * They are the *call shapes* the bindings above imply, so a consumer never
 * re-derives them from \`kind\` and \`id\`: \`retrieveOptions\` builds the path a
 * collection needs and omits it for a singleton, and \`updateVars\` is the
 * \`{path, body}\` a collection sends and the bare \`{body}\` a singleton does.
 *
 * Each is optional, and is present exactly when the resource has the operation
 * it wraps - so \`resource.retrieve && resource.retrieveOptions\` is never
 * needed, but \`resource.listOptions\` on an action is a type error, which is
 * the point.
 */
export interface ResourceConveniences {
  /** The generated list options, plus the base page parameters. */
  readonly listOptions?: (query: ServerPagedListQuery, filters?: readonly never[]) => unknown
  /** The generated retrieve options; no id for a singleton. */
  readonly retrieveOptions?: (...args: never[]) => unknown
  /** The generated create mutation options. */
  readonly createMutation?: () => unknown
  /** The generated update mutation options. */
  readonly updateMutation?: () => unknown
  /** What an update sends, as the generated mutation's variables. */
  readonly updateVars?: (...args: never[]) => unknown
  /** The generated destroy mutation options. */
  readonly destroyMutation?: () => unknown
}

/**
 * The shape every resource below satisfies, by how its record is addressed.
 * Which of the operations a resource has is its own type; the union says
 * which it *can* have, so the generator's classification is checked here.
 */
export type Resource = CollectionResource<number> | CollectionResource<string> | SingletonResource | ActionResource

/** Records addressed by id: the ordinary DRF viewset. */
export interface CollectionResource<TId extends number | string> extends ResourceBase, ResourceConveniences {
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
export interface SingletonResource extends ResourceBase, ResourceConveniences {
  readonly kind: 'singleton'
  readonly retrieve?: ResourceRead
  readonly update?: ResourceWrite
}

/** A pathless POST with no record behind it - a login, a bulk create. */
export interface ActionResource extends ResourceBase, ResourceConveniences {
  readonly kind: 'action'
  readonly create: ResourceWrite
}

export type ResourceKind = Resource['kind']

/**
 * The model types a resource of the same name shadows, so the api-client
 * barrel leaves them out of its types.gen re-export instead of colliding. Each
 * is reachable under its resource instead, as \`<Resource>.Record\`.
 */
export const shadowedModelTypes: readonly string[] = [
${shadowedModels.map(({name}) => `  '${name}',`).join('\n')}
]

${resourceBlocks.join('\n\n')}
`,
)

const byKind = {}
for (const { kind } of resources) byKind[kind] = (byKind[kind] ?? 0) + 1
const kinds = Object.entries(byKind).map(([kind, count]) => `${count} ${kind}`).join(', ')
// The model-type barrel, as its own generated file. `export type * from
// 'types.gen'` is a blanket re-export and cannot be told to skip a name, so
// the ones a resource shadows are dropped here by name instead. Explicit
// rather than clever: a type added to types.gen appears in this file on the
// next codegen, and one a resource shadows appears as its absence.
const shadowed = new Set(shadowedModels.map(({name}) => name))
const barrelTypes = [...typeExports].filter((name) => !shadowed.has(name)).sort()
writeFileSync(
  new URL('../src/api/model-types.gen.ts', import.meta.url),
  `// This file is auto-generated by scripts/generate-resources.mjs from
// openapi/schema.yaml. Do not edit; run \`npm run codegen\` instead.
//
// Every model type from types.gen, less the ${shadowed.size} that a resource of
// the same name shadows (\`shadowedModelTypes\` in ./resources.gen.ts). Both
// cannot be a top-level name in the \`Api\` barrel - that is TS2308 - and the
// resource is the one a caller means by that name; the model it hides is
// reachable as \`<Resource>.Record\`, which is the very type that resource
// answers with. This file exists so the barrel can name what it excludes.
export type {
${barrelTypes.map((name) => `  ${name},`).join('\n')}
} from './types.gen'
`,
)

const unpageable = resources.filter(({entries, pageable}) => entries.list && !pageable)
const altPaged = resources
  .filter(({pageable, listId}) => pageable && derivedFilters(listId).some((p) => ALTERNATE_PAGINATION.has(p)))
  .map(({name}) => name)
console.log(
  `generate-resources: ${resources.length} resource(s) (${kinds}), ` +
    `${tanstackImports.size} query/mutation binding(s), ${valibotImports.size} body binding(s), ` +
    `${typeImports.size} record type(s), ${shadowed.size} shadowed model name(s), ` +
    `${barrelTypes.length} re-exported model type(s)` +
    (unpageable.length === 0
      ? ''
      : `; no listOptions on ${unpageable.length} (${unpageable.map(({name}) => name).join(', ')})`) +
    (altPaged.length === 0
      ? ''
      : `; also page by limit/offset on ${altPaged.length} (${altPaged.join(', ')})`),
)
