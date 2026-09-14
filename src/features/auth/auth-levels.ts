import { AUTH_LEVELS } from '@/constants'
import { useAuthStore } from './store'

export function getUserAuthLevel() {
  const store = useAuthStore()
  if (store.isStudent) {
    return AUTH_LEVELS.STUDENT
  }

  if (store.isSales) {
    return AUTH_LEVELS.SALES
  }

  if (store.isEngineer) {
    return AUTH_LEVELS.ENGINEER
  }

  if (store.isCustomer) {
    return AUTH_LEVELS.CUSTOMER
  }

  if (store.isPlanning) {
    return AUTH_LEVELS.PLANNING
  }

  if (store.isEmployee) {
    return AUTH_LEVELS.EMPLOYEE
  }

  if (store.isSuperuser) {
    return AUTH_LEVELS.SUPERUSER
  }

  if (store.isStaff) {
    return AUTH_LEVELS.STAFF
  }
}

export function hasAccessRouteAuthLevel(authLevelNeeded: string | string[]) {
  const authLevelUser = getUserAuthLevel()

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
    // An anonymous user has no level; a level list never holds undefined, so
    // this can only answer -1, exactly as the untyped version did.
    return authLevelNeeded.indexOf(authLevelUser as string) !== -1 || authLevelUser === AUTH_LEVELS.PLANNING || authLevelUser === AUTH_LEVELS.STAFF || authLevelUser === AUTH_LEVELS.SUPERUSER
  }

  return false
}
