import * as v from 'valibot'
import { defineStore } from 'pinia'

import { jwtTokenCreate, jwtTokenRefreshCreate } from '@/api/sdk.gen'
import { vJwtTokenCreateResponse, vJwtTokenRefreshCreateResponse } from '@/api/valibot.gen'
import { useMainStore } from '@/stores/main'

import type { UserInfoResponse } from '@/api/types.gen'

import { useAuthToken } from './token'

export type SessionUserInfo = UserInfoResponse

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
      const { data } = await jwtTokenRefreshCreate({
        body: { token },
        responseValidator: async (response) => v.parse(vJwtTokenRefreshCreateResponse, response),
        throwOnError: true,
      })
      // A logout (or another refresh) during the round-trip wins over this
      // answer, so it is only applied once it still applies.
      if (useAuthToken().value !== token) return

      this.authenticate(data.token)

      // Only login() resets the bootstrap, so a refresh rebuilds it this way.
      window.location.reload()
    },
  },
})
