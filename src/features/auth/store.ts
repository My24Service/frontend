import * as v from 'valibot'
import { defineStore } from 'pinia'

import client from '@/services/api'
import { useMainStore } from '@/stores/main'

import type { UserInfoResponse } from '@/api/types.gen'

import { useAuthToken } from './token'

/**
 * Session identity as the member bootstrap delivers it. The generated
 * bootstrap response types userInfo as UserInfoResponse, so the store reuses
 * that instead of restating the shape. The nested user record stays
 * free-form — the backend sends per-role flags with no shared schema — so
 * the role reads below go through the small guards, never bare chains.
 */
export type SessionUserInfo = UserInfoResponse

/**
 * Both token endpoints answer with `{token}`, and both responses used to reach
 * `authenticate` unparsed: the hand-written client is typed `any`, so a body
 * without a token was stored as `undefined` and surfaced later as a session
 * that looked logged in and had no credentials. Parsing here turns the
 * response into a string or throws before the store is touched.
 *
 * The refresh endpoint has a generated schema for this shape
 * (`vTokenRefreshSlidingSerializerDifferentToken`); the login endpoint's `200`
 * is `unknown` in types.gen.ts, so one local schema covers both rather than
 * restating the same object for one of them.
 */
const tokenResponse = v.object({ token: v.string() })

/**
 * Only the identity half lives in the store. The token is not state here: it
 * is the one module-scoped ref in ./token, which the bearer header and the
 * refresh timer read too, so a logout reaches every reader instead of only
 * the store's copy.
 */
interface AuthState {
  userInfo: SessionUserInfo | null
}

const initialState: AuthState = { userInfo: null }

/** The nested user record, or null when nobody is logged in. */
function sessionUser(state: AuthState): Record<string, unknown> | null {
  return state.userInfo?.user ?? null
}

/** One submodel plus its matching flag — every role getter is this shape. */
function hasRole(state: AuthState, submodel: string, flag: string): boolean {
  return state.userInfo?.submodel === submodel && Boolean(sessionUser(state)?.[flag])
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({ ...initialState }),
  getters: {
    token: (): string | null => useAuthToken().value,
    isAdmin: (state): boolean => {
      const user = sessionUser(state)
      return user !== null && (Boolean(user.is_superuser) || Boolean(user.is_staff))
    },
    getUserName: (state): string => {
      const info = state.userInfo
      if (!info) return ''
      // A superuser record carries no personal name. Every other role reads
      // the submodel the way the sibling getters do.
      if (info.submodel === 'superuser') return 'superuser'

      const user = sessionUser(state)
      if (!user) return ''
      if (typeof user.first_name === 'string' && user.first_name !== '') return user.first_name
      return typeof user.username === 'string' ? user.username : ''
    },
    isLoggedIn: (state): boolean => {
      return useAuthToken().value !== null && state.userInfo !== null
    },
    isStaff: (state): boolean => hasRole(state, 'staff', 'is_staff'),
    isSuperuser: (state): boolean => hasRole(state, 'superuser', 'is_superuser'),
    isPlanning: (state): boolean => hasRole(state, 'planning_user', 'planning_user'),
    isCustomer: (state): boolean => hasRole(state, 'customer_user', 'customer_user'),
    isEngineer: (state): boolean => hasRole(state, 'engineer', 'engineer'),
    isSales: (state): boolean => hasRole(state, 'sales_user', 'sales_user'),
    isStudent: (state): boolean => hasRole(state, 'student_user', 'student_user'),
    isEmployee: (state): boolean => hasRole(state, 'employee_user', 'employee_user'),
    isBranchEmployee: (state): boolean => {
      if (!hasRole(state, 'employee_user', 'employee_user')) return false
      const employee = sessionUser(state)?.employee_user
      if (!employee || typeof employee !== 'object') return false
      return Boolean((employee as { branch?: unknown }).branch)
    },
    branchEmployeeBranch: (state): unknown => {
      const employee = sessionUser(state)?.employee_user
      if (!employee || typeof employee !== 'object') return false
      return (employee as { branch?: unknown }).branch ?? false
    },
  },
  actions: {
    setUserInfo(userInfo: SessionUserInfo | null | undefined) {
      this.userInfo = userInfo ?? null
    },
    authenticate(accessToken: string): void {
      useAuthToken().value = accessToken
    },
    logout(): void {
      useAuthToken().value = null
      this.userInfo = null
    },
    async login(username: string, password: string): Promise<void> {
      // The hand-written client, not the generated `jwtTokenCreate`: the
      // generated body schema declares only username and password, and valibot
      // drops the entries it does not declare, so `app` would never reach the
      // backend - which reads it straight off the request
      // (source/apps/core/views.py:507 in the backend repo) to pick the session
      // expiry for everything that is not the web app. The response is the part
      // that needs a boundary, and it is parsed below.
      const loginResult = await client.post('/jwt-token/', {
        username,
        password,
        app: 'web',
      })
      const { token } = v.parse(tokenResponse, loginResult.data)

      // the initial data currently in the store was fetched anonymously; it must be
      // re-fetched for this user before anything may act on isLoggedIn
      useMainStore().resetInitialDataFetched()

      this.authenticate(token)
    },
    async refreshToken(): Promise<void> {
      const token = useAuthToken().value
      if (!token) {
        this.logout()
        return
      }
      const result = await client.post('/jwt-token/refresh/', { token })
      // A logout (or another refresh) during the round-trip wins over this
      // answer, so parse it only once it still applies.
      if (useAuthToken().value !== token) return
      const { token: refreshedToken } = v.parse(tokenResponse, result.data)

      this.authenticate(refreshedToken)

      // 0.4: the reload stays. Only login() resets the bootstrap, so without it
      // the app would keep serving the anonymously fetched initial data while
      // holding a fresh token.
      window.location.reload()
    },
  },
})
