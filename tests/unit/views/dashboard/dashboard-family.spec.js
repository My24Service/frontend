import { beforeEach, describe, expect, test, vi } from 'vitest'

import Dashboard from '@/views/dashboard/Dashboard.vue'
import BranchPhotoCard from '@/views/dashboard/components/BranchPhotoCard.vue'
import BranchPhotoCardShltr from '@/views/dashboard/components/BranchPhotoCardShltr.vue'
import DashboardBlock from '@/views/dashboard/components/DashboardBlock.vue'
import DashboardBlockShltr from '@/views/dashboard/components/DashboardBlockShltr.vue'

import { mountForm, resetFakeHttp } from '../../support/form-harness.js'

// One Dashboard for both product families (block B, step 5). The shltr
// layout is the base; `profile.family === 'default'` swaps in the default
// card primitives, stats tile, section order and scoped styles.

const fakeHttp = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/services/api', () => ({ default: fakeHttp, normalClient: fakeHttp }))

vi.mock('@/api/client.gen', async () => {
  const { apiClientMock } = await import('../../support/api-client-mock.js')
  return apiClientMock(fakeHttp)
})

const ROUTES = {
  '/member/member/me/': { pk: 1, username: 'planning' },
  '/company/branch/first/': { id: 7, name: 'First Branch', address: 'Street 1', postal: '1234', city: 'Town' },
  '/equipment/equipment-document/': { count: 0, results: [] },
}

beforeEach(() => {
  resetFakeHttp(fakeHttp, ROUTES)
})

async function mountDashboard(family) {
  const wrapper = mountForm(Dashboard, {
    auth: { isBranchEmployee: false },
    main: { getProductFamily: family },
  })
  await vi.waitFor(() => expect(wrapper.vm.branch).toBeTruthy())
  await vi.waitFor(() => expect(wrapper.vm.isLoading).toBe(false))
  return wrapper
}

describe('Dashboard per product family', () => {
  test('default: own card primitives, bootstrap stats cards, documents before work orders', async () => {
    const wrapper = await mountDashboard('default')

    expect(wrapper.classes()).toContain('family-default')
    expect(wrapper.findComponent(BranchPhotoCard).exists()).toBe(true)
    expect(wrapper.findComponent(BranchPhotoCardShltr).exists()).toBe(false)
    expect(wrapper.findAllComponents(DashboardBlock)).toHaveLength(5)
    expect(wrapper.findAllComponents(DashboardBlockShltr)).toHaveLength(0)
    expect(wrapper.findAll('.card.d-flex')).toHaveLength(8)

    const sections = wrapper.findAll('.tw\\:order-1, .tw\\:order-2, .tw\\:order-3')
    expect(sections.map((s) => s.classes().find((c) => c.startsWith('tw:order-')))).toEqual([
      'tw:order-2', 'tw:order-1', 'tw:order-3',
    ])
  })

  test('shltr: shltr card primitives, tailwind stats tiles, source section order', async () => {
    const wrapper = await mountDashboard('shltr')

    expect(wrapper.classes()).not.toContain('family-default')
    expect(wrapper.findComponent(BranchPhotoCardShltr).exists()).toBe(true)
    expect(wrapper.findComponent(BranchPhotoCard).exists()).toBe(false)
    expect(wrapper.findAllComponents(DashboardBlockShltr)).toHaveLength(5)
    expect(wrapper.findAllComponents(DashboardBlock)).toHaveLength(0)
    expect(wrapper.findAll('.card.d-flex')).toHaveLength(0)
    expect(wrapper.findAll('[class*="tw:order-"]')).toHaveLength(0)
  })
})
