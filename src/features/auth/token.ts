import type { RemovableRef } from '@vueuse/core'

export const TOKEN_KEY = 'accessToken'

/** The session token: the JWT while logged in, null while logged out. */
export type AuthToken = string | null

let token: RemovableRef<AuthToken> | null = null

export function useAuthToken(): RemovableRef<AuthToken> {
  // Created in a detached scope, because this ref outlives whoever asks for it
  // first. VueUse ties the ref-to-storage watcher to the effect scope active at
  // creation, so if the first caller were a component (TokenRefresh, a store
  // getter read during render), the token would stop reaching localStorage the
  // moment that component unmounted.
  token ??= effectScope(true).run(() => useLocalStorage<AuthToken>(TOKEN_KEY, null))!
  return token
}
