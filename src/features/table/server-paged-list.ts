/** Whole-collection bound for embedded reads with no page control.
 * 1000 is the API's own ceiling (`My24Pagination.max_page_size`), which DRF
 * clamps a larger value down to rather than rejecting. */
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
