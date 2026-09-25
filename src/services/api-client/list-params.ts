/**
 * The wire query every server-paged list sends, before a resource's own
 * column filters.
 *
 * This lives in the API seam rather than in `features/table` because the
 * generated resources build their own list queries from it: a generated file
 * may not reach up into a feature module, and this is about the API's own
 * pagination parameters. `features/table` re-exports it, so a screen still
 * imports it from `@/features/table` and nothing outside the seam has to know
 * it moved.
 */

/**
 * 1000 is the API's ceiling: every list's `page_size` query parameter
 * carries `maximum: 1000` in `openapi/schema.yaml`, and a larger value is
 * clamped, not rejected. `server-paged-list.spec.js` pins this constant to
 * that maximum. */
export const WHOLE_COLLECTION_PAGE_SIZE = 1000

/** The wire query every server-paged list sends, before resource extras. */
export interface ServerPagedListQuery {
  page: number
  page_size: number
  q?: string
  ordering?: string[]
  [column: string]: unknown
}

/**
 * The four parameters every server-paged list sends, and nothing else: the
 * page, the size, the search term and the sort. A resource's `listOptions`
 * spreads this and adds the column filters its screen declares.
 *
 * `q` and `ordering` are dropped when empty rather than sent as `''`/`[]`,
 * because the API would read a blank term as a term and filter on it.
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
 * The named column filters a table sends, as the API wants them: every named
 * key that holds a value, on the wire.
 *
 * The named keys are the screen's, not the schema's - see the `listOptions`
 * docs on the generated resources - so this is a plain string map, and the
 * generated signature is what checks a name against the endpoint. What a
 * filter *holds* is the table's business and can be anything, so
 * `stringifyFilter` decides what reaches the wire.
 */
export function columnFilters(
  query: ServerPagedListQuery,
  filters: readonly string[] | undefined,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key of filters ?? []) {
    const value = stringifyFilter(query[key])
    if (value !== undefined) out[key] = value
  }
  return out
}

/**
 * A column filter's value on the wire. Only primitives have one: a filter the
 * table holds as a string, number or boolean is sent as one, and anything else
 * - an object, an array, a function, or the empty string an unfilled filter
 * holds - is dropped rather than sent, because `String({})` would filter on the
 * literal text `[object Object]` and `?name=` would filter on nothing at all.
 */
function stringifyFilter(value: unknown): string | undefined {
  switch (typeof value) {
    case 'string':
      return value === '' ? undefined : value
    case 'number':
    case 'boolean':
      return String(value)
    default:
      return undefined
  }
}
