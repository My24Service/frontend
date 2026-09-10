import { useLocalStorage } from '@vueuse/core'
import type { RemovableRef } from '@vueuse/core'

/**
 * The one localStorage key the session reads and writes. It used to be a raw
 * string in three places (the store seed, the bearer header, the refresh
 * timer), so a rename touched every one of them and a typo logged every live
 * session out. The literal value is pinned by tests/unit/features/auth.
 */
export const TOKEN_KEY = 'accessToken'

/** The session token: the JWT while logged in, null while logged out. */
export type AuthToken = string | null

let token: RemovableRef<AuthToken> | null = null

/**
 * The one token source. The store, the bearer header and the refresh timer all
 * read and write this ref, so there is no second copy to keep in step: a write
 * anywhere is a write everywhere, localStorage included.
 *
 * Two properties come with VueUse's storage ref, and both are the point of the
 * move:
 *
 * - a write failure (quota, storage disabled) is reported through `onError`
 *   instead of thrown, so a login cannot fail after the API call has already
 *   succeeded;
 * - the ref listens for the `storage` event, which is the only channel
 *   between tabs, so a logout in one tab clears the session in the others.
 *
 * The ref is built on the first read rather than at import. This module sits in
 * services/api's static graph (models/base -> services/api -> clientDriver ->
 * auth-header -> here), and building the ref reads localStorage; deferring
 * keeps importing that graph free of storage access. See the cycle note in
 * src/services/auth/auth-header.ts.
 *
 * The ref is the truth and the storage entry follows it, one Vue tick later,
 * because VueUse persists through a watcher. Two writes in the same tick
 * coalesce into one persist of the final value, and nothing reads the entry
 * before that: every consumer resolves the token from the ref.
 */
export function useAuthToken(): RemovableRef<AuthToken> {
  token ??= useLocalStorage<AuthToken>(TOKEN_KEY, null)
  return token
}
