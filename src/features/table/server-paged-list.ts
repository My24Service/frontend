/**
 * The table's own view of a server-paged list's envelope.
 *
 * `baseListParams`, `WHOLE_COLLECTION_PAGE_SIZE` and `ServerPagedListQuery`
 * live in the generated resource runtime (`@/api/resource-runtime.gen`),
 * because the resources' own `listOptions` is built from them and generated
 * code may not import application code. They are re-exported here so a screen
 * keeps importing them from `@/features/table` beside the rest of the kit, and
 * so the two cannot drift apart.
 */
export {
  baseListParams,
  WHOLE_COLLECTION_PAGE_SIZE,
  type ServerPagedListQuery,
} from '@/api/resource-runtime.gen'

export interface PagedEnvelope {
  count?: number
  results?: unknown[]
}
