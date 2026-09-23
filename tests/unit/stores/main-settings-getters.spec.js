import { beforeEach, describe, expect, test } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

import { useMainStore } from '@/stores/main'

/**
 * The member-settings getters read memberInfo.settings, which get-initial-data
 * only sends to a logged-in user. Right after logout the anonymous bootstrap
 * leaves memberInfo without settings (or null before the first bootstrap), and
 * screens still mounted at that moment re-render through these getters.
 */
describe('main store settings getters', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  test.each([
    ['no member info yet', null],
    ['anonymous member info, no settings', { name: 'Company' }],
  ])('they read undefined instead of throwing: %s', (_, memberInfo) => {
    const store = useMainStore()
    store.memberInfo = memberInfo

    expect(store.getSettings).toBeUndefined()
    expect(store.getOrderListMustIncludeReference).toBeUndefined()
    expect(store.getDefaultCurrency).toBeUndefined()
    expect(store.getAutomaticBreakCalculationSettings).toEqual({after: 0, duration: 0})
  })

  test('they read the settings when logged in', () => {
    const store = useMainStore()
    store.memberInfo = { settings: { order_list_include_reference: true } }

    expect(store.getOrderListMustIncludeReference).toBe(true)
  })
})
