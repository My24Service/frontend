/**
 * The table's own view of a server-paged list's envelope.
 *
 * `baseListParams`, `WHOLE_COLLECTION_PAGE_SIZE` and `ServerPagedListQuery`
 * live in the API seam (`@/services/api-client/list-params`), because the
 * generated resources' own `listOptions` is built from them and a generated
 * file may not reach up into a feature module. They are re-exported here so a
 * screen keeps importing them from `@/features/table` beside the rest of the
 * kit, and so the two modules cannot drift apart.
 */
export {
  baseListParams,
  WHOLE_COLLECTION_PAGE_SIZE,
  type ServerPagedListQuery,
} from '@/services/api-client/list-params'

export interface PagedEnvelope {
  count?: number
  results?: unknown[]
}
