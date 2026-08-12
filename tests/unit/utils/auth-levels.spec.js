import { beforeEach, describe, expect, test } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { AUTH_LEVELS } from '@/constants'
import { getUserAuthLevel, hasAccessRouteAuthLevel } from '@/utils'
import { useAuthStore } from '@/stores/auth'

// The auth store derives the user's level from `submodel` plus a matching flag
// on `user`. These are the minimal shapes that make each getter return true.
const USER_INFO = {
  [AUTH_LEVELS.STUDENT]: { submodel: 'student_user', user: { student_user: true } },
  [AUTH_LEVELS.SALES]: { submodel: 'sales_user', user: { sales_user: true } },
  [AUTH_LEVELS.ENGINEER]: { submodel: 'engineer', user: { engineer: true } },
  [AUTH_LEVELS.CUSTOMER]: { submodel: 'customer_user', user: { customer_user: true } },
  [AUTH_LEVELS.PLANNING]: { submodel: 'planning_user', user: { planning_user: true } },
  [AUTH_LEVELS.EMPLOYEE]: { submodel: 'employee_user', user: { employee_user: true } },
  [AUTH_LEVELS.SUPERUSER]: { submodel: 'superuser', user: { is_superuser: true } },
  [AUTH_LEVELS.STAFF]: { submodel: 'staff', user: { is_staff: true } },
}

function loginAs(level) {
  useAuthStore().setUserInfo(USER_INFO[level])
}

// Levels that pass essentially every check, and are appended to most
// "allowed" sets in hasAccessRouteAuthLevel.
const ELEVATED = [AUTH_LEVELS.PLANNING, AUTH_LEVELS.STAFF, AUTH_LEVELS.SUPERUSER]

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('getUserAuthLevel', () => {
  test.each(Object.values(AUTH_LEVELS))('reports %s', (level) => {
    loginAs(level)
    expect(getUserAuthLevel()).toBe(level)
  })

  test('is undefined when there is no user info', () => {
    expect(getUserAuthLevel()).toBeUndefined()
  })
})

describe('hasAccessRouteAuthLevel', () => {
  test('a user always satisfies their own level', () => {
    for (const level of Object.values(AUTH_LEVELS)) {
      setActivePinia(createPinia())
      loginAs(level)
      expect(hasAccessRouteAuthLevel(level), `${level} should satisfy ${level}`).toBe(true)
    }
  })

  describe('SUPERUSER routes', () => {
    test('only superusers pass', () => {
      for (const level of Object.values(AUTH_LEVELS)) {
        setActivePinia(createPinia())
        loginAs(level)
        expect(
          hasAccessRouteAuthLevel(AUTH_LEVELS.SUPERUSER),
          `${level} vs superuser route`,
        ).toBe(level === AUTH_LEVELS.SUPERUSER)
      }
    })
  })

  describe('STAFF routes', () => {
    test('staff and superusers pass', () => {
      for (const level of Object.values(AUTH_LEVELS)) {
        setActivePinia(createPinia())
        loginAs(level)
        const expected = level === AUTH_LEVELS.STAFF || level === AUTH_LEVELS.SUPERUSER
        expect(hasAccessRouteAuthLevel(AUTH_LEVELS.STAFF), `${level} vs staff route`).toBe(expected)
      }
    })

    test('planning users do NOT pass a staff route', () => {
      loginAs(AUTH_LEVELS.PLANNING)
      expect(hasAccessRouteAuthLevel(AUTH_LEVELS.STAFF)).toBe(false)
    })
  })

  // Every remaining level grants access to itself plus the elevated levels.
  describe.each([
    AUTH_LEVELS.PLANNING,
    AUTH_LEVELS.SALES,
    AUTH_LEVELS.CUSTOMER,
    AUTH_LEVELS.EMPLOYEE,
    AUTH_LEVELS.STUDENT,
    AUTH_LEVELS.ENGINEER,
  ])('%s routes', (needed) => {
    test.each(ELEVATED)('%s passes', (level) => {
      loginAs(level)
      expect(hasAccessRouteAuthLevel(needed)).toBe(true)
    })

    test('an unrelated level is denied', () => {
      // Pick a level that is neither the required one nor elevated.
      const unrelated = Object.values(AUTH_LEVELS).find(
        (l) => l !== needed && !ELEVATED.includes(l),
      )
      loginAs(unrelated)
      expect(hasAccessRouteAuthLevel(needed)).toBe(false)
    })
  })

  describe('array form', () => {
    test('a level listed in the array passes', () => {
      loginAs(AUTH_LEVELS.ENGINEER)
      expect(hasAccessRouteAuthLevel([AUTH_LEVELS.ENGINEER, AUTH_LEVELS.SALES])).toBe(true)
    })

    test('a level absent from the array is denied', () => {
      loginAs(AUTH_LEVELS.CUSTOMER)
      expect(hasAccessRouteAuthLevel([AUTH_LEVELS.ENGINEER, AUTH_LEVELS.SALES])).toBe(false)
    })

    test.each(ELEVATED)('%s passes even when absent from the array', (level) => {
      loginAs(level)
      expect(hasAccessRouteAuthLevel([AUTH_LEVELS.ENGINEER])).toBe(true)
    })
  })

  test('an anonymous user is denied', () => {
    expect(hasAccessRouteAuthLevel(AUTH_LEVELS.PLANNING)).toBe(false)
  })
})
