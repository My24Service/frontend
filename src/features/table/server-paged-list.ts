/** The wire query every server-paged list sends, before resource extras. */
export interface ServerPagedListQuery {
  page: number
  page_size: number
  q?: string
  ordering?: string[]
  [column: string]: unknown
}

/**
 * The params every server-paged list sends, before its own extras: the page
 * pair, the toolbar search as `q`, and the engine's `ordering` list straight
 * onto the wire (the backend's OrderingMixin allow-list decides what sorts).
 * Screens spread this and add only their own filters, so the base mapping
 * lives in exactly one place.
 */
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
