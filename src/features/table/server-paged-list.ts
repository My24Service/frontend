/** Whole-collection bound for embedded reads with no page control.
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

export function baseListParams(query: ServerPagedListQuery): Record<string, unknown> {
  return {
    page: query.page,
    page_size: query.page_size,
    ...(query.q ? {q: query.q} : {}),
    ...(query.ordering?.length ? {ordering: query.ordering} : {}),
  }
}

export interface PagedEnvelope {
  count?: number
  results?: unknown[]
}
