import { describe, expect, test } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'

import { useOwnerContext } from '@/features/equipment/owner/owner-kind'
import { useMainStore } from '@/stores/main'

import { mountForm } from '../../support/form-harness.js'

let harness

const Harness = defineComponent({
  setup() {
    harness = useOwnerContext()
    return () => h('div')
  },
})

function mountOwnerContext({ hasBranches, isEmployee = false, isCustomer = false }) {
  return mountForm(Harness, {
    main: { memberInfo: { has_branches: hasBranches } },
    auth: { isEmployee, isCustomer },
  })
}

describe('useOwnerContext', () => {
  test('follows the store when the tenant gains branches after setup', async () => {
    mountOwnerContext({ hasBranches: false })
    expect(harness.wireKind.value).toBe('customer')

    useMainStore().memberInfo = { has_branches: true }
    await nextTick()

    expect(harness.wireKind.value).toBe('branch')
  })

  test('a branch tenant writes the branch variant and its staff picks the owner', async () => {
    mountOwnerContext({ hasBranches: true })

    expect(harness.wireKind.value).toBe('branch')
    expect(harness.chooses.value).toBe(true)
  })

  test('a branch employee is pinned, so their form shows no picker', async () => {
    mountOwnerContext({ hasBranches: true, isEmployee: true })

    expect(harness.wireKind.value).toBe('branch')
    expect(harness.chooses.value).toBe(false)
  })

  test('a customer user on a branchless tenant is pinned too', async () => {
    mountOwnerContext({ hasBranches: false, isCustomer: true })

    expect(harness.wireKind.value).toBe('customer')
    expect(harness.chooses.value).toBe(false)
  })
})
