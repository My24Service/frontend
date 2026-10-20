// This file is copied from scripts/templates/resource-runtime.ts by
// scripts/generate-resources.mjs. Do not edit; edit the template and run
// `npm run codegen` instead.
//
// What every generated resource shares: the shapes it is checked against, the
// `resource()` factory that builds one, and the few helpers its methods use.
//
// `scripts/generate-resources.mjs` copies this file into `src/api/` as
// `resource-runtime.gen.ts`, so `resources.gen.ts` imports it as a sibling and
// nothing in `src/api/` reaches outside that folder. Edit it here; the copy is
// overwritten on every `npm run codegen`.
import type { QueryClient, UseMutationOptions } from '@tanstack/vue-query'
import type { GenericSchema } from 'valibot'

// --- the page parameters --------------------------------------------------

/**
 * 1000 is the API's ceiling: every list's `page_size` query parameter carries
 * `maximum: 1000` in `openapi/schema.yaml`, and a larger value is clamped, not
 * rejected. `server-paged-list.spec.js` pins this constant to that maximum.
 */
export const WHOLE_COLLECTION_PAGE_SIZE = 1000

/** The wire query every server-paged list sends, before a resource's own column filters. */
export interface ServerPagedListQuery {
  page: number
  page_size: number
  q?: string
  ordering?: string[]
  [column: string]: unknown
}

/**
 * The four parameters every server-paged list sends: the page, the size, the
 * search term and the sort. `q` and `ordering` are dropped when empty rather
 * than sent as `''`/`[]`, because the API would read a blank term as a term.
 */
export function baseListParams(query: ServerPagedListQuery): Record<string, unknown> {
  return {
    page: query.page,
    page_size: query.page_size,
    ...(query.q ? {q: query.q} : {}),
    ...(query.ordering?.length ? {ordering: query.ordering} : {}),
  }
}

/**
 * How a column filter goes on the wire, when not as a string: what the list
 * operation's OpenAPI parameter declares (`type: integer`, `number`,
 * `boolean`). The generator writes it per resource as `filterTypes`; a filter
 * it does not name - a string, an enum, a union - is sent as a string.
 */
export type FilterWireType = 'integer' | 'number' | 'boolean'

const INTEGER = /^-?\d+$/
const DECIMAL = /^-?(\d+\.?\d*|\.\d+)$/
/**
 * What django-filter's `BooleanWidget` reads, lowercased: `true`/`false` and
 * `1`/`0`. A `?is_deleted=True` or `=1` in a link means a flag to the server,
 * so it means one here too rather than being dropped.
 */
const FLAGS: Readonly<Record<string, boolean>> = {true: true, false: false, '1': true, '0': false}

/** One filter value as `type` wants it on the wire, or `undefined` when it cannot hold it. */
function wireValue(value: string | number | boolean, type: FilterWireType | undefined): string | number | boolean | undefined {
  const text = typeof value === 'string' ? value.trim() : undefined
  switch (type) {
    case 'integer':
      if (typeof value === 'number') return Number.isInteger(value) ? value : undefined
      return text !== undefined && INTEGER.test(text) ? Number(text) : undefined
    case 'number':
      if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
      return text !== undefined && DECIMAL.test(text) ? Number(text) : undefined
    case 'boolean':
      return typeof value === 'boolean' ? value : text === undefined ? undefined : FLAGS[text.toLowerCase()]
    default:
      return String(value)
  }
}

/**
 * The named column filters that hold a value, as the endpoint's parameters
 * want them. Only a string, number or boolean has a wire form: an object, an
 * array or the empty string an unfilled filter holds is dropped, because
 * `String({})` would filter on `[object Object]` and `?name=` on nothing at all.
 *
 * `types` says which filters are not strings (`filterTypes`, generated from
 * the OpenAPI parameters). The generated `*ListOptions` parse the query with
 * the valibot schema and throw on `"7"` for an integer, so each value is sent
 * as its declared type, and a filter read back from the URL - always a
 * string - is converted here rather than in every screen:
 *
 * - `integer`: an integer, or a string of digits with an optional `-`
 *   (`'7'` -> `7`). `'7.5'`, `'1e3'`, `'0x1F'` and `' '` are not integers.
 * - `number`: a finite number, or a plain decimal string (`'7.5'` -> `7.5`).
 * - `boolean`: a boolean, or `true`/`false`/`1`/`0` in any case, as
 *   django-filter's `BooleanFilter` reads them.
 * - anything else goes as `String(value)`, a numeric-looking string included.
 *
 * A value its type cannot hold (`?supplier_relation=abc`) is dropped like an
 * empty one rather than thrown on. Dropping a filter *widens* the list - the
 * table shows every row that filter would have excluded - which is the
 * lesser evil next to a list that fails to load over a hand-edited URL.
 */
export function columnFilters(
  query: ServerPagedListQuery,
  filters: readonly string[],
  types: Readonly<Record<string, FilterWireType>> = {},
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {}
  for (const key of filters) {
    const value = query[key]
    if (value === '' || (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean')) continue
    const wire = wireValue(value, types[key])
    if (wire !== undefined) out[key] = wire
  }
  return out
}

// --- what a resource is built from ----------------------------------------

/** A list, or a singleton's retrieve: its generated `*Options` and `*QueryKey` factories. */
export interface ResourceRead {
  readonly options: (...args: never[]) => object
  readonly queryKey: (...args: never[]) => readonly unknown[]
}

/** A collection's retrieve: the options take the record's id in the path. */
export interface ResourceRecordRead<TId extends number | string> extends ResourceRead {
  readonly options: (options: {path: {id: TId}}) => object
}

/** A create, update, replace or destroy: its generated `*Mutation` factory and the body it takes. */
export interface ResourceWrite {
  // `any`: UseMutationOptions is invariant in its response and error slots, so
  // no single wider type admits every generated mutation.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly mutation: (...args: never[]) => UseMutationOptions<any, any, any>
  readonly body?: GenericSchema
}

interface DefinitionBase {
  readonly path: string
  /**
   * The hey-api query-key id (`[{_id}]`) of every list and retrieve under
   * `path`: the reads a write to this resource makes stale.
   */
  readonly reads: readonly string[]
}

/** Records addressed by id: the ordinary DRF viewset. */
export interface CollectionDefinition<TId extends number | string> extends DefinitionBase {
  readonly kind: 'collection'
  /** How the retrieve declares its `{id}`: integer nearly everywhere, string for `order/order`. */
  readonly id: TId extends number ? 'number' : 'string'
  readonly list?: ResourceRead
  /**
   * Present exactly when a table can page `list`, holding the column filters
   * the endpoint declares. Its presence is what gives a resource `listOptions`.
   */
  readonly filters?: readonly string[]
  /** The filters in `filters` that are not sent as strings, by their declared wire type. */
  readonly filterTypes?: Readonly<Record<string, FilterWireType>>
  readonly retrieve?: ResourceRecordRead<TId>
  readonly create?: ResourceWrite
  readonly update?: ResourceWrite
  readonly replace?: ResourceWrite
  readonly destroy?: ResourceWrite
  /** The verbs the server serves on one record, under this resource's path: `/branch/{id}/dashboard/`. */
  readonly extras?: Readonly<Record<string, ResourceRead | ResourceWrite>>
}

/** The caller's own record (`member/me`, `branch-my`): read and updated without a path. */
export interface SingletonDefinition extends DefinitionBase {
  readonly kind: 'singleton'
  readonly retrieve?: ResourceRead
  readonly update?: ResourceWrite
}

/** A pathless POST with no record behind it: a login, a bulk create. */
export interface ActionDefinition extends DefinitionBase {
  readonly kind: 'action'
  readonly create: ResourceWrite
}

export type ResourceDefinition =
  | CollectionDefinition<number>
  | CollectionDefinition<string>
  | SingletonDefinition
  | ActionDefinition

// --- what a resource adds -------------------------------------------------

/**
 * The methods every resource has, typed loosely enough to admit any resource.
 * A consumer that takes "some resource" reads these; a screen that names one
 * gets the exact signatures of `ResourceMethods<D>` below.
 *
 * Method syntax on purpose: `@typescript-eslint/unbound-method` then reports
 * a detached `invalidate: Api.X.invalidate`, which would lose its `this`.
 */
export interface AnyResourceMethods {
  /** Refresh every read under this resource's path, in one call. */
  invalidate(queryClient: QueryClient): Promise<unknown[]>
  /** The list options for a server-paged table: the page parameters plus the column filters. */
  listOptions?(query: ServerPagedListQuery, filters?: readonly never[]): object
  /** The retrieve options for one record: its id in the path, or nothing for a singleton. */
  retrieveOptions?(...args: never[]): object
}

export type CollectionResource<TId extends number | string> = CollectionDefinition<TId> & AnyResourceMethods
export type SingletonResource = SingletonDefinition & AnyResourceMethods
export type ActionResource = ActionDefinition & AnyResourceMethods

/**
 * The shape every resource satisfies, by how its record is addressed. Which of
 * the operations a resource has is its own type; the union says which it
 * *can* have.
 */
export type Resource = CollectionResource<number> | CollectionResource<string> | SingletonResource | ActionResource

export type ResourceKind = Resource['kind']

type AnyFunction = (...args: never[]) => unknown

/** The `{id}` a retrieve's generated options put in the path. */
type RetrieveId<O> = O extends (options: {path: {id: infer TId}}) => unknown ? TId : never

/** The methods one resource has, typed from its own bindings. */
export type ResourceMethods<D extends ResourceDefinition> = {
  invalidate(queryClient: QueryClient): Promise<unknown[]>
} & (D extends {list: {options: infer O extends AnyFunction}; filters: readonly (infer F)[]}
  ? {
    /**
     * The list options for a server-paged table: the four page parameters,
     * plus every column filter this endpoint declares that holds a value.
     * Name `filters` only to send a subset.
     */
    listOptions(query: ServerPagedListQuery, filters?: readonly F[]): ReturnType<O>
  }
  : unknown) & (D extends {retrieve: {options: infer O extends AnyFunction}}
  ? {
    /** The retrieve options for one record: its id in the path, or nothing for a singleton. */
    retrieveOptions(...args: D extends {kind: 'singleton'} ? [] : [id: RetrieveId<O>]): ReturnType<O>
  }
  : unknown)

// --- the factory ----------------------------------------------------------

/** What the methods below read off the resource they are called on. */
type Self = ResourceDefinition & {
  readonly list?: ResourceRead
  readonly filters?: readonly string[]
  readonly filterTypes?: Readonly<Record<string, FilterWireType>>
  readonly retrieve?: ResourceRead
}

const methods = {
  invalidate(this: Self, queryClient: QueryClient) {
    return Promise.all(this.reads.map((_id) => queryClient.invalidateQueries({queryKey: [{_id}]})))
  },
  listOptions(this: Self, query: ServerPagedListQuery, filters: readonly string[] = this.filters ?? []) {
    const options = this.list!.options as (options: {query: Record<string, unknown>}) => object
    return options({query: {...baseListParams(query), ...columnFilters(query, filters, this.filterTypes)}})
  },
  retrieveOptions(this: Self, id?: number | string) {
    const options = this.retrieve!.options as (options?: {path: {id: unknown}}) => object
    return this.kind === 'singleton' ? options() : options({path: {id}})
  },
}

/**
 * One prototype per combination of methods, so a resource has exactly the
 * methods its type declares - `'listOptions' in Api.CompanyBranchMy` is false,
 * as its type says - while the functions themselves exist once.
 */
const prototypes = new Map<string, object>()

function prototypeFor(definition: ResourceDefinition): object {
  const pageable = 'filters' in definition && definition.filters !== undefined
  const readable = 'retrieve' in definition && definition.retrieve !== undefined
  const key = `${pageable}/${readable}`
  let prototype = prototypes.get(key)
  if (!prototype) {
    prototype = {
      invalidate: methods.invalidate,
      ...(pageable ? {listOptions: methods.listOptions} : {}),
      ...(readable ? {retrieveOptions: methods.retrieveOptions} : {}),
    }
    prototypes.set(key, prototype)
  }
  return prototype
}

/**
 * A resource: its bindings as own, enumerable data, and its methods on a
 * shared prototype. The methods use `this`, so call them on the resource -
 * `Api.X.invalidate(queryClient)`, or hand a consumer the resource itself.
 */
export function resource<const D extends ResourceDefinition>(definition: D): D & ResourceMethods<D> {
  return Object.assign(Object.create(prototypeFor(definition)) as object, definition) as D & ResourceMethods<D>
}
