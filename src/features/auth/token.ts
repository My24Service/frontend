import { useLocalStorage } from '@vueuse/core'
import type { RemovableRef } from '@vueuse/core'

export const TOKEN_KEY = 'accessToken'

/** The session token: the JWT while logged in, null while logged out. */
export type AuthToken = string | null

let token: RemovableRef<AuthToken> | null = null

export function useAuthToken(): RemovableRef<AuthToken> {
  token ??= useLocalStorage<AuthToken>(TOKEN_KEY, null)
  return token
}
