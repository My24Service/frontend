import { beforeEach, describe, expect, test } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { router } from '@/router'
import { AUTH_LEVELS } from '@/constants'
import { useAuthStore, hasAccessRouteAuthLevel } from '@/features/auth'

/**
 * The add link on the engineer and API-user lists is gated on
 * `isStaff || isSuperuser` (EngineerUserList.vue:22, ApiUserList.vue:31), but
 * the routes those buttons point at declared no meta, so the guard fell back
 * to its planning default (src/router/index.js:66) and a planning user could
 * open the form by URL — a screen the list does not offer them.
 *
 * These specs pin the route gate to the button gate. `AUTH_LEVELS.STAFF` is
 * exactly `isStaff || isSuperuser` in `hasAccessRouteAuthLevel`, and the
 * level is resolved the way the guard resolves it, default included, so the
 * two gates cannot drift apart again. The button half is already pinned by
 * "the add link shows for staff and superusers only" in the two list specs.
 */

const USER_INFO = {
  [AUTH_LEVELS.PLANNING]: {submodel: 'planning_user', user: {planning_user: true}},
  [AUTH_LEVELS.STAFF]: {submodel: 'staff', user: {is_staff: true}},
  [AUTH_LEVELS.SUPERUSER]: {submodel: 'superuser', user: {is_superuser: true}},
}

function loginAs(level) {
  useAuthStore().setUserInfo(USER_INFO[level])
}

/**
 * The level the guard asks for: the route's own meta, or the planning default
 * it falls back to when the route declares none.
 */
function requiredLevel(name) {
  const meta = router.resolve({name}).meta ?? {}
  return Object.prototype.hasOwnProperty.call(meta, 'authLevelNeeded')
    ? meta.authLevelNeeded
    : AUTH_LEVELS.PLANNING
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe.each([
  ['engineer-add', 'engineers'],
  ['apiuser-add', 'API users'],
])('%s', (name, what) => {
  test(`is gated at the level its ${what} add button implies`, () => {
    expect(requiredLevel(name)).toBe(AUTH_LEVELS.STAFF)
  })

  test('a planning user cannot open it, because the list hides its add button', () => {
    loginAs(AUTH_LEVELS.PLANNING)
    expect(hasAccessRouteAuthLevel(requiredLevel(name))).toBe(false)
  })

  test('staff and superusers still can', () => {
    for (const level of [AUTH_LEVELS.STAFF, AUTH_LEVELS.SUPERUSER]) {
      setActivePinia(createPinia())
      loginAs(level)
      expect(hasAccessRouteAuthLevel(requiredLevel(name)), level).toBe(true)
    }
  })
})
