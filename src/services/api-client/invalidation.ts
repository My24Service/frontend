import type { QueryClient } from '@tanstack/vue-query'
import { queryClient } from '@/services/query-client'

/**
 * The invalidation a write to a resource owes its readers, bound to that
 * resource's query-key ids.
 *
 * hey-api keys every query `[{_id, baseURL, ...}]` and tanstack matches a
 * filter partially, so invalidating on `[{_id}]` reaches every page, filter and
 * id of that read. `reads` is a resource's own list of such ids, collected from
 * the schema at codegen, so this is the whole of what a write to it makes
 * stale.
 *
 * Every generated resource already carries this, bound to its own `reads`, as
 * its `invalidate` - which is what a screen and a form use:
 *
 *     destroyMutation: Api.CompanyBranch.destroyMutation,
 *     invalidate: Api.CompanyBranch.invalidate,
 *
 * This stays for the one case a resource cannot state: a write that stales
 * *another* resource's reads. Those hand-written `invalidation.ts` modules
 * compose this with the resource's own, rather than each restating the walk.
 *
 * `queryClient` is optional, defaulting to the application singleton rather
 * than to `useQueryClient()`: that composable throws outside an injection
 * context, and a delete modal calls `invalidate` from a click handler, which is
 * exactly where the composable's answer is wanted and unavailable. The
 * singleton is the very instance the plugin installs, so the default is what
 * the composable would have returned whenever the composable would have worked
 * at all. A caller already holding a client - a form, inside `setup` - passes
 * it, as it always did.
 */
export function invalidateReads(
  reads: readonly string[],
): (queryClient?: QueryClient) => Promise<unknown[]> {
  return (client: QueryClient = queryClient) =>
    Promise.all(reads.map((_id) => client.invalidateQueries({queryKey: [{_id}]})))
}