import { describe, expect, test } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import componentMixin from '@/mixins/common'
import { useAuthStore } from '@/stores/auth'
import { useMainStore } from '@/stores/main'

// What these pin down is that the mixin really reads the store rather than a
// value captured at import time.

/**
 * The role getters are derived, not stored: `isPlanning` is
 * `userInfo.submodel === 'planning_user' && userInfo.user.planning_user`. So a
 * test sets the state the getter reads, not the getter.
 */
function planningUser(planning = true) {
  return {
    submodel: planning ? 'planning_user' : 'engineer',
    user: {
      pk: 1,
      username: 'evert',
      is_staff: false,
      is_superuser: false,
      planning_user: planning,
      engineer: !planning,
    },
  }
}

function withStores(setup) {
  const pinia = createPinia()
  setActivePinia(pinia)
  setup(useAuthStore(), useMainStore())
  return pinia
}

describe('componentMixin (options API)', () => {
  test('exposes the getters as computed and the helpers as methods', () => {
    expect(Object.keys(componentMixin.computed)).toContain('isPlanning')
    expect(Object.keys(componentMixin.methods)).toContain('hasAccessToModule')
  })

  test('reads roles from the auth store', () => {
    withStores((auth) => {
      auth.userInfo = planningUser()
    })

    expect(componentMixin.computed.isPlanning()).toBe(true)
  })
})

