import { defineStore } from 'pinia'

import client from '@/services/api'
import { useMainStore } from '@/stores/main'

import type { UserInfoResponse } from '@/api/types.gen'

import { clearStoredToken, getStoredToken, setStoredToken } from './token-storage'

/**
 * Session identity as the member bootstrap delivers it. The generated
 * bootstrap response types userInfo as UserInfoResponse, so the store reuses
 * that instead of restating the shape. The nested user record stays
 * free-form — the backend sends per-role flags with no shared schema — so
 * the role reads below go through the small guards, never bare chains.
 */
export type SessionUserInfo = UserInfoResponse

interface AuthState {
  token: string | null
  userInfo: SessionUserInfo | null
}

const initialState: AuthState = { token: null, userInfo: null }

/** The nested user record, or null when nobody is logged in. */
function sessionUser(state: AuthState): Record<string, unknown> | null {
  return state.userInfo?.user ?? null
}

/** One submodel plus its matching flag — every role getter is this shape. */
function hasRole(state: AuthState, submodel: string, flag: string): boolean {
  return state.userInfo?.submodel === submodel && Boolean(sessionUser(state)?.[flag])
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    ...initialState,
    token: getStoredToken(),
  }),
  getters: {
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
      return state.token !== null && state.userInfo !== null
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
    setUserInfo(userInfo: SessionUserInfo | null) {
      this.userInfo = userInfo
    },
    authenticate(accessToken: string): void {
      setStoredToken(accessToken)
      this.token = accessToken
    },
    logout(): void {
      this.token = null
      this.userInfo = null
      clearStoredToken()
    },
    async login(username: string, password: string): Promise<void> {
      const loginResult = await client.post('/jwt-token/', {
        username,
        password,
        app: 'web',
      })

      // the initial data currently in the store was fetched anonymously; it must be
      // re-fetched for this user before anything may act on isLoggedIn
      useMainStore().resetInitialDataFetched()

      this.authenticate(loginResult.data.token)
    },
    async refreshToken(): Promise<void> {
      const token = getStoredToken()
      if (!token) {
        this.logout()
        return
      }
      const result = await client.post('/jwt-token/refresh/', { token })
      if (getStoredToken() !== token) return
      this.authenticate(result.data.token)
      window.location.reload()
    },
  },
})
