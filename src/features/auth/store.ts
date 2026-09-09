import { defineStore } from 'pinia'
import client from '@/services/api'
import {useMainStore} from "@/stores/main";

import { clearStoredToken, getStoredToken, setStoredToken } from './token-storage'


// userInfo arrives inside the member bootstrap, not from a typed endpoint,
// so the state stays untyped until the bootstrap owns a schema.
/* eslint-disable @typescript-eslint/no-explicit-any */
interface AuthState {
  token: string | null
  userInfo: any
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const initialState: AuthState = { token: null, userInfo: null, };

function getToken() {
  return getStoredToken()
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    ...initialState,
    token: getToken()
  }),
  getters: {
    isAdmin: (state) => {
      if (!state.userInfo || !state.userInfo.user) {
        return false;
      }
      return state.userInfo.user.is_superuser || state.userInfo.user.is_staff
    },
    getUserName: (state) => {
      if (state.userInfo.is_superuser) {
        return 'superuser'
      }

      if (state.userInfo.user && state.userInfo.user.first_name) {
        return state.userInfo.user.first_name
      }

      return state.userInfo.user.username
    },
    getUserPk: state => {
      return state.userInfo.user.pk
    },
    isLoggedIn: (state) => {
      return state.token !== null && state.userInfo !== null
    },
    isStaff: (state) => {
      if (!state.userInfo || !state.userInfo.user) {
        return false;
      }
      return state.userInfo.submodel === 'staff' && state.userInfo.user.is_staff
      // return state.userInfo.hasOwnProperty('is_staff') && state.userInfo.is_staff
    },
    isSuperuser: (state) => {
      if (!state.userInfo || !state.userInfo.user) {
        return false;
      }
      return state.userInfo.submodel === 'superuser' && state.userInfo.user.is_superuser
      // return state.userInfo.hasOwnProperty('is_superuser') && state.userInfo.is_superuser
    },
    isPlanning: (state) => {
      if (!state.userInfo || !state.userInfo.user) {
        return false;
      }
      return state.userInfo.submodel === 'planning_user' && state.userInfo.user.planning_user
      // return state.userInfo.hasOwnProperty('planning_user') && state.userInfo.planning_user
    },
    isCustomer: (state) => {
      if (!state.userInfo || !state.userInfo.user) {
        return false;
      }
      return state.userInfo.submodel === 'customer_user' && state.userInfo.user.customer_user
      // return state.userInfo.hasOwnProperty('customer_user') && state.userInfo.customer_user
    },
    isEngineer: (state) => {
      if (!state.userInfo || !state.userInfo.user) {
        return false;
      }
      return state.userInfo.submodel === 'engineer' && state.userInfo.user.engineer
      // return state.userInfo.hasOwnProperty('engineer') && state.userInfo.engineer
    },
    isSales: (state) => {
      if (!state.userInfo || !state.userInfo.user) {
        return false;
      }
      return state.userInfo.submodel === 'sales_user' && state.userInfo.user.sales_user
      // return state.userInfo.hasOwnProperty('sales_user') && state.userInfo.sales_user
    },
    isStudent: (state) => {
      if (!state.userInfo || !state.userInfo.user) {
        return false;
      }
      return state.userInfo.submodel === 'student_user' && state.userInfo.user.student_user
      // return state.userInfo.hasOwnProperty('student_user') && state.userInfo.student_user
    },
    isEmployee: (state) => {
      if (!state.userInfo || !state.userInfo.user) {
        return false;
      }
      return state.userInfo.submodel === 'employee_user' && state.userInfo.user.employee_user
      // return state.userInfo.hasOwnProperty() && state.userInfo.employee_user
    },
    isBranchEmployee: (state) => {
      if (!state.userInfo || !state.userInfo.user) {
        return false;
      }
      return state.userInfo.submodel === 'employee_user' && state.userInfo.user.employee_user && state.userInfo.user.employee_user.branch
      // return state.userInfo.user.hasOwnProperty('employee_user') && state.userInfo.employee_user && state.userInfo.employee_user.branch
    },
    branchEmployeeBranch: (state) => {
      if (!state.userInfo || !state.userInfo.user || !state.userInfo.user.employee_user) {
        return false;
      }
      return state.userInfo.user.employee_user.branch
      // return state.userInfo.user.hasOwnProperty('employee_user') && state.userInfo.employee_user && state.userInfo.employee_user.branch
    },
    getUserUUID: (state) => {
      return state.userInfo.user.uuid
    },
  },
  actions: {
    setToken(token: string | null) {
      this.token = token
    },
    // userInfo arrives inside the member bootstrap, not from a typed
    // endpoint, so it stays any until the bootstrap owns a schema.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setUserInfo(userInfo: any) {
      this.userInfo = userInfo
    },
    authenticate(accessToken: string) {
      setStoredToken(accessToken)
      this.setToken(accessToken)
    },
    logout() {
      this.token = null
      this.userInfo = null
      clearStoredToken()
    },
    async login(username: string, password: string) {
      const url = '/jwt-token/'

      const postData = {
        username: username,
        password: password,
        app: 'web'
      }

      const loginResult = await client.post(url, postData)

      // the initial data currently in the store was fetched anonymously; it must be
      // re-fetched for this user before anything may act on isLoggedIn
      useMainStore().resetInitialDataFetched()

      this.authenticate(loginResult.data.token);
    },
    async refreshToken() {
      const token = getStoredToken()
      if (token) {
        const url = '/jwt-token/refresh/'
        const postData = { token }
        const result = await client.post(url, postData)
        this.authenticate(result.data.token)
        window.location.reload()
      } else {
        this.logout()
      }
    }
  }
})
