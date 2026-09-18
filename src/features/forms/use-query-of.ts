import {
  useQuery,
  type DefaultError,
  type UseQueryOptions,
  type UseQueryReturnType,
} from '@tanstack/vue-query'

/**
 * What a query selector has to produce: a generated `*Options` object, spread
 * with whatever the caller adds (`enabled`, typically). Only the key is named,
 * because it is the one part every generated factory shares.
 */
export interface QueryOptionsLike {
  queryKey: readonly unknown[]
  enabled?: boolean
}

/**
 * `useQuery` for a selector that switches between generated `*Options`.
 *
 * The generated factories each return `queryOptions<...>` with their own
 * response, error and key types, so a selector that picks one or the other at
 * runtime - the branch retrieve or the customer retrieve, depending on the
 * tenant - returns a union that `useQuery`'s overloads reject, and the only
 * ways round it were two queries gated by `enabled`, or a cast at every call.
 *
 * This is that cast, once, with the accessor typed by the caller: what the
 * query answers with is `TData`, which the caller knows and `useQuery` cannot.
 * It is the same seam `useResourceForm`'s `detailQuery` and
 * `useServerTable`'s `listQuery` open with `as never` / `as any` - the factory
 * return is genuinely unknown at this boundary, and restating its shape here
 * would reject exactly the objects this exists to accept.
 *
 * Switching keys inside one query is what TanStack supports: the observer
 * moves to the new key and the old entry stays cached under its own.
 */
export function useQueryOf<TData>(options: () => QueryOptionsLike): UseQueryReturnType<TData, DefaultError> {
  // Cast to the getter overload by name rather than to `never`, which would
  // pick the first overload - the one for a query with initial data, whose
  // `data` is never undefined.
  return useQuery(options as unknown as () => UseQueryOptions<TData, DefaultError, TData>)
}
