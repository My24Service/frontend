import { describe, expect, test } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

import componentMixin, { useCommon } from '@/mixins/common'
import { useAuthStore } from '@/stores/auth'
import { useMainStore } from '@/stores/main'

// The mixin and the composable are two views of one declaration; what these
// pin down is that they stay two views of it, and that both really read the
// store rather than a value captured at import time.

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

describe('useCommon (composition API)', () => {
  test('returns the same getters as refs', () => {
    withStores((auth) => {
      auth.userInfo = planningUser()
    })

    const { isPlanning, isAdmin } = useCommon()

    expect(isPlanning.value).toBe(true)
    expect(isAdmin.value).toBe(false)
  })

  test('every mixin computed has a composable counterpart', () => {
    withStores((auth) => {
      auth.userInfo = planningUser()
    })
    const common = useCommon()

    for (const name of Object.keys(componentMixin.computed)) {
      expect(common).toHaveProperty(name)
    }
    for (const name of Object.keys(componentMixin.methods)) {
      expect(typeof common[name]).toBe('function')
    }
  })

  test('the refs track a later store change', () => {
    const pinia = withStores((auth) => {
      auth.userInfo = planningUser(false)
    })

    const { isPlanning } = useCommon()
    expect(isPlanning.value).toBe(false)

    setActivePinia(pinia)
    useAuthStore().userInfo = planningUser(true)

    expect(isPlanning.value).toBe(true)
  })

  test('hasBranches comes from the main store', () => {
    withStores((auth, main) => {
      main.memberInfo = { has_branches: true }
    })

    expect(useCommon().hasBranches.value).toBe(true)
  })

  test('a <script setup> component can render off the refs', () => {
    const pinia = withStores((auth) => {
      auth.userInfo = planningUser()
    })

    const Component = defineComponent({
      setup() {
        const { isPlanning } = useCommon()
        return () => h('span', isPlanning.value ? 'planning' : 'not planning')
      },
    })

    const wrapper = mount(Component, { global: { plugins: [pinia] } })
    expect(wrapper.text()).toBe('planning')
  })
})
