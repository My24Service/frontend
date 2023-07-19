import moment from 'moment'

import my24 from './services/my24'
import orderNotAcceptedModel from './models/orders/OrderNotAccepted.js'
import {
  AUTH_LEVELS
} from "./constants";

function isEmpty(obj) {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object
}

function getIsStaff(store) {
  return store.state.userInfo.submodel === 'staff' && store.state.userInfo.user.is_staff
  // return store.state.userInfo.hasOwnProperty('is_staff') && store.state.userInfo.is_staff
}

function getIsSuperuser(store) {
  return store.state.userInfo.submodel === 'superuser' && store.state.userInfo.user.is_superuser
  // return store.state.userInfo.hasOwnProperty('is_superuser') && store.state.userInfo.is_superuser
}

function getIsPlanning(store) {
  return store.state.userInfo.submodel === 'planning_user' && store.state.userInfo.user.planning_user
  // return store.state.userInfo.hasOwnProperty('planning_user') && store.state.userInfo.planning_user
}

function getIsCustomer(store) {
  return store.state.userInfo.submodel === 'customer_user' && store.state.userInfo.user.customer_user
  // return store.state.userInfo.hasOwnProperty('customer_user') && store.state.userInfo.customer_user
}

function getIsEngineer(store) {
  return store.state.userInfo.submodel === 'engineer' && store.state.userInfo.user.engineer
  // return store.state.userInfo.hasOwnProperty('engineer') && store.state.userInfo.engineer
}

function getIsSales(store) {
  return store.state.userInfo.submodel === 'sales_user' && store.state.userInfo.user.sales_user
  // return store.state.userInfo.hasOwnProperty('sales_user') && store.state.userInfo.sales_user
}

function getIsStudent(store) {
  return store.state.userInfo.submodel === 'student_user' && store.state.userInfo.user.student_user
  // return store.state.userInfo.hasOwnProperty('student_user') && store.state.userInfo.student_user
}

function getIsEmployee(store) {
  return store.state.userInfo.submodel === 'employee_user' && store.state.userInfo.user.employee_user
  // return store.state.userInfo.hasOwnProperty() && store.state.userInfo.employee_user
}

function getIsBranchEmployee(store) {
  return store.state.userInfo.submodel === 'employee_user' && store.state.userInfo.user.employee_user && store.state.userInfo.user.employee_user.branch
  // return store.state.userInfo.user.hasOwnProperty('employee_user') && store.state.userInfo.employee_user && store.state.userInfo.employee_user.branch
}

function getIsLoggedIn(store) {
  return store.getters.isLoggedIn
}

function getUserAuthLevel(store) {
  if (getIsStudent(store)) {
    return AUTH_LEVELS.STUDENT
  }

  if (getIsSales(store)) {
    return AUTH_LEVELS.SALES
  }

  if (getIsEngineer(store)) {
    return AUTH_LEVELS.ENGINEER
  }

  if (getIsCustomer(store)) {
    return AUTH_LEVELS.CUSTOMER
  }

  if (getIsPlanning(store)) {
    return AUTH_LEVELS.PLANNING
  }

  if (getIsEmployee(store)) {
    return AUTH_LEVELS.EMPLOYEE
  }

  if (getIsSuperuser(store)) {
    return AUTH_LEVELS.SUPERUSER
  }

  if (getIsStaff(store)) {
    return AUTH_LEVELS.STAFF
  }
}

function hasAccessRouteAuthLevel(authLevelNeeded, store) {
  const authLevelUser = getUserAuthLevel(store)

  // TODO in the future use ONLY arrays?
  // let needed = typeof authLevelNeeded === 'string' ? [ authLevelNeeded ] : authLevelNeeded
  if (typeof authLevelNeeded === 'string') {
    if (authLevelNeeded === AUTH_LEVELS.STAFF) {
      return authLevelUser === AUTH_LEVELS.STAFF || authLevelUser === AUTH_LEVELS.SUPERUSER
    }

    if (authLevelNeeded === AUTH_LEVELS.SUPERUSER) {
      return authLevelUser === AUTH_LEVELS.SUPERUSER
    }

    if (authLevelNeeded === AUTH_LEVELS.PLANNING) {
      return authLevelUser === AUTH_LEVELS.PLANNING || authLevelUser === AUTH_LEVELS.STAFF || authLevelUser === AUTH_LEVELS.SUPERUSER
    }

    if (authLevelNeeded === AUTH_LEVELS.SALES) {
      return authLevelUser === AUTH_LEVELS.SALES || authLevelUser === AUTH_LEVELS.PLANNING || authLevelUser === AUTH_LEVELS.STAFF || authLevelUser === AUTH_LEVELS.SUPERUSER
    }

    if (authLevelNeeded === AUTH_LEVELS.CUSTOMER) {
      return authLevelUser === AUTH_LEVELS.CUSTOMER || authLevelUser === AUTH_LEVELS.PLANNING || authLevelUser === AUTH_LEVELS.STAFF || authLevelUser === AUTH_LEVELS.SUPERUSER
    }

    if (authLevelNeeded === AUTH_LEVELS.EMPLOYEE) {
      return authLevelUser === AUTH_LEVELS.EMPLOYEE || authLevelUser === AUTH_LEVELS.PLANNING || authLevelUser === AUTH_LEVELS.STAFF || authLevelUser === AUTH_LEVELS.SUPERUSER
    }

    if (authLevelNeeded === AUTH_LEVELS.STUDENT) {
      return authLevelUser === AUTH_LEVELS.STUDENT || authLevelUser === AUTH_LEVELS.PLANNING || authLevelUser === AUTH_LEVELS.STAFF || authLevelUser === AUTH_LEVELS.SUPERUSER
    }

    if (authLevelNeeded === AUTH_LEVELS.ENGINEER) {
      return authLevelUser === AUTH_LEVELS.ENGINEER || authLevelUser === AUTH_LEVELS.PLANNING || authLevelUser === AUTH_LEVELS.STAFF || authLevelUser === AUTH_LEVELS.SUPERUSER
    }
  }

  if (typeof authLevelNeeded === 'object') {
    return authLevelNeeded.indexOf(authLevelUser) !== -1 || authLevelUser === AUTH_LEVELS.PLANNING || authLevelUser === AUTH_LEVELS.STAFF || authLevelUser === AUTH_LEVELS.SUPERUSER
  }

  return false
}

let componentMixin = {
  computed: {
    isStaff() {
      return getIsStaff(this.$store)
    },
    isSuperuser() {
      return getIsSuperuser(this.$store)
    },
    isPlanning() {
      return getIsPlanning(this.$store)
    },
    isCustomer() {
      return getIsCustomer(this.$store)
    },
    isEngineer() {
      return getIsEngineer(this.$store)
    },
    isSales() {
      return getIsSales(this.$store)
    },
    isStudent() {
      return getIsStudent(this.$store)
    },
    isEmployee() {
      return getIsEmployee(this.$store)
    },
    isBranchEmployee() {
      return getIsBranchEmployee(this.$store)
    },
    isLoggedIn() {
      return getIsLoggedIn(this.$store)
    },
    username() {
      return this.$store.getters.getUserName
    },
    hasBranches() {
      return this.$store.getters.getMemberHasBranches
    },
  },
  methods: {
    translateHoursField(field) {
      const allFields = {
        'work_total': this.$trans("Work total"),
        'travel_total': this.$trans('Travel total'),
        'distance_total': this.$trans('Distance total'),
        'extra_work': this.$trans('Total extra work'),
        'actual_work': this.$trans('Total actual work'),
        'distance_fixed_rate_amount': this.$trans('Total trips')
      }

      return allFields[field]
    },
    displayDurationFromSeconds(seconds, exclude_seconds) {
      return this.displayDuration(moment.duration(seconds*1000), exclude_seconds)
    },
    displayDuration(duration, exclude_seconds) {
      const totalMilliseconds = duration.as('milliseconds')
      const hours = parseInt(moment.duration(totalMilliseconds).asHours())
      const format = exclude_seconds ? 'mm' : 'mm:ss'
      return `${hours}:${moment.utc(totalMilliseconds).format(format)}`
    },
    async doFetchUnacceptedCountAndUpdateStore() {
      const countResult = await orderNotAcceptedModel.getCount()
      if (countResult && 'count' in countResult) {
        await this.$store.dispatch('setUnacceptedCount', countResult.count)
      }
    },
    hasAccessToModule(module, part) {
      return my24.hasAccessToModule({
        isStaff: this.isStaff,
        isSuperuser: this.isSuperuser,
        contract: this.$store.state.memberContract,
        module,
        part,
      })
    },
  }
}

export {
  isEmpty,
  getIsStaff,
  getIsSuperuser,
  getIsPlanning,
  getIsEngineer,
  getIsSales,
  getIsStudent,
  getIsCustomer,
  getIsLoggedIn,
  hasAccessRouteAuthLevel,
  getUserAuthLevel,
  componentMixin
}
