import * as v from 'valibot'
import { defineStore } from 'pinia'

import { jwtTokenCreate, jwtTokenRefreshCreate } from '@/api/sdk.gen'
import { vJwtTokenCreateResponse, vJwtTokenRefreshCreateResponse } from '@/api/valibot.gen'
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
    // The employee submodel's `branch` is a number or absent
    // (`EmployeeUserSub.branch`); `false` is the "no branch" answer the branch
    // view's own guard reads.
    branchEmployeeBranch: (state): number | false => {
      const employee = sessionUser(state)?.employee_user
      if (!employee || typeof employee !== 'object') return false
      return (employee as { branch?: number | null }).branch ?? false
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
      // The generated `jwtTokenCreate`, not a raw `client.post`: the request
      // schema now declares `app`
      // (`TokenObtainSlidingSerializerDifferentTokenRequestWritable`) and the
      // 200 is typed (`TokenObtainResponse`). The raw call existed only because
      // the generated body carried no `app` and valibot drops what it does not
      // declare - and the backend reads that field straight off the request
      // (source/apps/core/views.py:507 in the backend repo) to pick the session
      // expiry for everything that is not the web app, so dropping it was a
      // silent session-lifetime change, not a typing exercise.
      //
      // An operation validates its request and nothing else: only
      // `requestValidator` is generated. The response boundary therefore goes
      // in by hand as `responseValidator`, carrying the generated response
      // schema - a 200 that is not `{token, app}` throws before the bootstrap
      // is reset and before `authenticate`, instead of storing `undefined`
      // and surfacing later as a session that looked logged in with nothing to
      // send. `throwOnError` keeps the other half of the old call's contract: a
      // non-2xx rejects rather than resolving to an error object.
      const { data } = await jwtTokenCreate({
        body: { username, password, app: 'web' },
        responseValidator: async (response) => v.parse(vJwtTokenCreateResponse, response),
        throwOnError: true,
      })

      // the initial data currently in the store was fetched anonymously; it must be
      // re-fetched for this user before anything may act on isLoggedIn
      useMainStore().resetInitialDataFetched()

      this.authenticate(data.token)
    },
    async refreshToken(): Promise<void> {
      const token = useAuthToken().value
      if (!token) {
        this.logout()
        return
      }
      // Same generated operation and the same response boundary as login: the
      // refresh response schema is already exactly `{token}`.
      const { data } = await jwtTokenRefreshCreate({
        body: { token },
        responseValidator: async (response) => v.parse(vJwtTokenRefreshCreateResponse, response),
        throwOnError: true,
      })
      // A logout (or another refresh) during the round-trip wins over this
      // answer, so it is only applied once it still applies.
      if (useAuthToken().value !== token) return

      this.authenticate(data.token)

      // 0.4: the reload stays. Only login() resets the bootstrap, so without it
      // the app would keep serving the anonymously fetched initial data while
      // holding a fresh token.
      window.location.reload()
    },
  },
})
