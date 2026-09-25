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
 * what a write to the resource makes stale, and its `invalidate` refreshes
 * them all. The ids are strings rather than the key factories
 * because a factory for a detail read demands the id it has no use for here:
 * hey-api keys every query `[{_id, baseURL, path?, query?}]`, and tanstack's
 * partial matching means `[{_id}]` alone reaches every variant of that read.
 * A read that is stale for a reason the schema cannot state - a module write
 * changing what the *member* list returns - stays in a hand-written
 * `invalidation.ts`; that is what those modules are for now.
 *
 * Every binding is checked against what hey-api actually declared, so a
 * renamed export fails the run rather than producing a file that fails to
 * typecheck later. Runs after `openapi-ts` in `npm run codegen`.
 *
 * How a resource is built
 * -----------------------
 * Each is one `resource({...})` call: the bindings are its own, enumerable
 * data, and the methods that derive something from them - `listOptions`,
 * `retrieveOptions`, `invalidate` - live once, on a prototype shared by every
 * resource with the same set (./templates/resource-runtime.ts). Their types
 * are computed from each resource's own bindings, so `Api.OrderOrder.retrieveOptions`
 * takes a string id and `Api.CompanyBranchMy.retrieveOptions` takes none,
 * exactly as when every resource spelled its methods out.
 *
 * A method that only renamed a binding (`createMutation` for `create.mutation`)
 * is not generated: it adds a second name for one thing and nothing else.
 *
 * Output stays inside `src/api/`: the runtime is copied from the template to
 * `resource-runtime.gen.ts` beside the resources, so generated code never
 * imports application code. Writes `resources.gen.ts`, `resource-runtime.gen.ts`
 * and `model-types.gen.ts`.
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
/** The verbs on a single record, attached to their resource's `extras` below. */
const extras = []

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
    // A verb on one record (`branch/{id}/dashboard/`, `apiuser/{id}/revoke/`)
    // belongs to the resource that record is an instance of, under that
    // resource's `extras` - the screen still names the resource. Collected
    // here, attached below, once every resource's path is known.
    if (isAction(path)) {
      extras.push({ id, path, key, hasBody: Boolean(operation.requestBody) })
      continue
    }

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

  // Whether the resource gets `listOptions` at all (see `isPageable`).
  const pageable = Boolean(operations.list && pageableLists.get(operations.list.id))

  resources.push({ name, path, kind, idType, entries, reads: readIds, types, pageable, listId: operations.list?.id, extras: [] })
}

// The record-level verbs, each hung on the resource whose path its own path
// sits under - the longest such path, so `/api/company/salesusercustomer/my/`
// joins `salesusercustomer` and not `company`. Ownership by path, not by name:
// the operationId prefix would put `companyPartnerRequestAccept` on
// `partnerRequest` by luck of spelling, and the path is what the server
// actually answers.
//
// Both sides are compared in `resourcePath` form, because a resource's `path`
// has no leading slash (`api/company/branch`) while the operation's does
// (`/api/company/branch/{id}/dashboard/`).
const resourceByPath = resources.map((resource) => ({ resource, prefix: `${resourcePath(resource.path)}/` }))
const orphans = []

for (const extra of extras) {
  const own = resourceByPath
    .filter(({ prefix }) => resourcePath(extra.path).startsWith(prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0]
  if (!own) {
    orphans.push(`${extra.id} (${extra.path})`)
    continue
  }
  const { resource } = own
  const camel = toCase(extra.id, 'camelCase')
  // The name is the operationId with the owner's own id prefix removed, so
  // `companyApiuserRevokeCreate` on `Api.CompanyApiuser` is
  // `extras.revokeCreate` and not a name that could collide with a sibling
  // resource's. The comparison is in camelCase because a raw operationId is
  // snake_case (`company_apiuser_revoke_create`) and would never match the
  // resource's camelCase name.
  const owner = lowerFirst(resource.name)
  const name = camel.startsWith(owner) ? toCase(camel.slice(owner.length), 'camelCase') : camel
  if (resource.extras.some((e) => e.name === name)) {
    throw new Error(`${resource.name} has two extras named ${name}: ${extra.id}`)
  }
  const entry = {}
  if (READS.has(extra.key)) {
    entry.options = bind(tanstackExports, `${camel}Options`, 'vue-query.gen', extra.id)
    entry.queryKey = bind(tanstackExports, `${camel}QueryKey`, 'vue-query.gen', extra.id)
  } else {
    entry.mutation = bind(tanstackExports, `${camel}Mutation`, 'vue-query.gen', extra.id)
    if (extra.hasBody) entry.body = bind(valibotExports, `v${toCase(extra.id, 'PascalCase')}Body`, 'valibot.gen', extra.id)
  }
  resource.extras.push({ name, path: extra.path, entry })
}

for (const { extras: resourceExtras } of resources) {
  for (const { entry } of resourceExtras) {
    for (const [field, name] of Object.entries(entry)) {
      ;(field === 'body' ? valibotImports : tanstackImports).add(name)
    }
  }
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

const resourceBlocks = resources.map((resource) => {
  const {name, path, kind, idType, entries, reads, types, pageable, listId, extras: resourceExtras} = resource
  const fields = [`  path: '${path}',`, `  kind: '${kind}',`]
  if (kind === 'collection') fields.push(`  id: '${idType}',`)
  for (const [key, entry] of Object.entries(entries)) {
    fields.push(`  ${key}: {${Object.entries(entry).map(([field, value]) => `${field}: ${value}`).join(', ')}},`)
    // `filters` sits beside `list` and is present exactly when a table can page
    // it - that presence is what gives the resource `listOptions`. It holds
    // every filter the endpoint declares (see `derivedFilters`), checked against
    // the resource's own `ListQuery`: if the schema drops one, the run's output
    // no longer typechecks rather than sending a parameter the endpoint ignores.
    if (key === 'list' && pageable) {
      const filterKeys = derivedFilters(listId)
      fields.push(
        filterKeys.length === 0
          ? `  filters: [],`
          : `  filters: [${filterKeys.map((key) => `'${key}'`).join(', ')}] satisfies (keyof ${name}.ListQuery)[],`,
      )
    }
  }
  // The record-level verbs: a screen that needs `/branch/{id}/dashboard/` names
  // `Api.CompanyBranch` and reaches for `extras.dashboardRetrieve`, not for a
  // second generated export.
  if (resourceExtras.length > 0) {
    fields.push(
      `  extras: {${resourceExtras
        .map(
          ({name: extraName, path: extraPath, entry}) =>
            `\n    /** \`${extraPath}\` */\n    ${extraName}: {${Object.entries(entry)
              .map(([field, value]) => `${field}: ${value}`)
              .join(', ')}},`,
        )
        .join('')}\n  },`,
    )
  }
  fields.push(`  reads: [${reads.map((id) => `'${id}'`).join(', ')}],`)
  const namespace = types.length > 0 ? `\n\n${typeBlock(name, types)}` : ''
  return `/** \`${path}\` */
export const ${name} = /*#__PURE__*/ resource({
${fields.join('\n')}
})${namespace}`
})

const RUNTIME_TEMPLATE = new URL('./templates/resource-runtime.ts', import.meta.url)
const RUNTIME_TARGET = new URL('../src/api/resource-runtime.gen.ts', import.meta.url)

writeFileSync(
  RUNTIME_TARGET,
  `// This file is copied from scripts/templates/resource-runtime.ts by
// scripts/generate-resources.mjs. Do not edit; edit the template and run
// \`npm run codegen\` instead.
//
${readFileSync(RUNTIME_TEMPLATE, 'utf8')}`,
)

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
// Each is built by \`resource()\` (./resource-runtime.gen.ts), which puts the
// bindings on the object and the few methods that derive something from them
// - \`listOptions\`, \`retrieveOptions\`, \`invalidate\` - on a shared prototype.
import type { InferInput, InferOutput } from 'valibot'

import { resource } from './resource-runtime.gen'

${importBlock(tanstackImports, './@tanstack/vue-query.gen')}
${importBlock(valibotImports, './valibot.gen')}
${typeImports.size > 0 ? `\nimport type {\n${[...typeImports].sort().map((name) => `  ${name},`).join('\n')}\n} from './types.gen'\n` : ''}
export type {
  ActionResource,
  CollectionResource,
  Resource,
  ResourceDefinition,
  ResourceKind,
  ResourceRead,
  ResourceWrite,
  SingletonResource,
} from './resource-runtime.gen'

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
