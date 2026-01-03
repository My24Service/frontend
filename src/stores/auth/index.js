import { defineStore } from 'pinia'
import AuthService from '@/services/auth2/service';
import accountModel from "@/models/account/Account";

const token = localStorage.getItem('accessToken')
const initialState = token
  ? { token, userInfo: null, }
  : { token: null, userInfo: null, };

export const useAuthStore = defineStore('auth', {
  state: () => ({
    ...initialState
  }),
  getters: {
    isAdmin: (state) => {
      return state.userInfo.user.is_superuser || state.userInfo.user.is_staff
    },
    getUserName: (state) => {
      if (state.userInfo.is_superuser) {
        return 'superuser'
      }

      if (state.userInfo.user.first_name) {
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
      return state.userInfo.submodel === 'staff' && state.userInfo.user.is_staff
      // return state.userInfo.hasOwnProperty('is_staff') && state.userInfo.is_staff
    },
    isSuperuser: (state) => {
      return state.userInfo.submodel === 'superuser' && state.userInfo.user.is_superuser
      // return state.userInfo.hasOwnProperty('is_superuser') && state.userInfo.is_superuser
    },
    isPlanning: (state) => {
      return state.userInfo.submodel === 'planning_user' && state.userInfo.user.planning_user
      // return state.userInfo.hasOwnProperty('planning_user') && state.userInfo.planning_user
    },
    isCustomer: (state) => {
      return state.userInfo.submodel === 'customer_user' && state.userInfo.user.customer_user
      // return state.userInfo.hasOwnProperty('customer_user') && state.userInfo.customer_user
    },
    isEngineer: (state) => {
      return state.userInfo.submodel === 'engineer' && state.userInfo.user.engineer
      // return state.userInfo.hasOwnProperty('engineer') && state.userInfo.engineer
    },
    isSales: (state) => {
      return state.userInfo.submodel === 'sales_user' && state.userInfo.user.sales_user
      // return state.userInfo.hasOwnProperty('sales_user') && state.userInfo.sales_user
    },
    isStudent: (state) => {
      return state.userInfo.submodel === 'student_user' && state.userInfo.user.student_user
      // return state.userInfo.hasOwnProperty('student_user') && state.userInfo.student_user
    },
    isEmployee: (state) => {
      return state.userInfo.submodel === 'employee_user' && state.userInfo.user.employee_user
      // return state.userInfo.hasOwnProperty() && state.userInfo.employee_user
    },
    isBranchEmployee: (state) => {
      return state.userInfo.submodel === 'employee_user' && state.userInfo.user.employee_user && state.userInfo.user.employee_user.branch
      // return state.userInfo.user.hasOwnProperty('employee_user') && state.userInfo.employee_user && state.userInfo.employee_user.branch
    },
    getUserUUID: (state) => {
      return state.userInfo.user.uuid
    },
  },
  actions: {
    setToken: (token) => {
      this.token = token
    },
    setUserInfo: (userInfo) => {
      this.userInfo = userInfo
    },
    authenticate(accessToken) {
      AuthService.authenticate({accessToken})
      this.token = accessToken
    },
    logout() {
      this.token = null
      AuthService.logout();
    },
    refreshToken() {
      const token = localStorage.getItem('accessToken')
      if (token) {
        accountModel.refreshToken(token).then((result) => {
          console.debug('token refresh result', result)
          this.authenticate(result.token)
          console.debug('token refreshed, reload window')
          window.location.reload()
        })
      } else {
        console.log('no token, logout and reload')
        this.logout()
      }
    }
  }
})
