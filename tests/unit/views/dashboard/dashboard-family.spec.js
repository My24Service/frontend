import { beforeEach, describe, expect, test, vi } from 'vitest'

import DashboardView from '@/views/dashboard/DashboardView.vue'
import BranchPhotoCard from '@/views/dashboard/components/BranchPhotoCard.vue'
import BranchPhotoCardShltr from '@/views/dashboard/components/BranchPhotoCardShltr.vue'
import DashboardBlock from '@/views/dashboard/components/DashboardBlock.vue'
import DashboardBlockShltr from '@/views/dashboard/components/DashboardBlockShltr.vue'

import { vBranch, vEquipmentDocument, vMember } from '@/api/valibot.gen'

import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam } from '../../support/api-seam/index.js'
import { mountForm } from '../../support/form-harness.js'

// One Dashboard for both product families (block B, step 5). The shltr
// layout is the base; `profile.family === 'default'` swaps in the default
// card primitives, stats tile, section order and scoped styles.

const api = installApiSeam()

beforeEach(() => {
  api.get('/api/member/member/me/', fixtureFor(vMember, { id: 1 }))
  api.get('/api/company/branch/first/', fixtureFor(vBranch, {
    id: 7, name: 'First Branch', address: 'Street 1', postal: '1234', city: 'Town',
  }))
  api.get('/api/equipment/equipment-document/', ({ query }) => paginated([
    fixtureFor(vEquipmentDocument, {
      name: `${query.type} manual`,
      equipment: query.type === 'technical' ? 11 : 12,
      equipment_view: { name: query.type === 'technical' ? 'Boiler' : 'Main building' },
    }),
  ]))
  api.get('/api/invoice/purchase/year/', [])
})

async function mountDashboard(family, { deep = false } = {}) {
  const wrapper = mountForm(DashboardView, {
    deep,
    // A deep mount renders the document tables; the widgets beside them read
    // and draw for themselves and are not what these specs are about.
    stubs: deep ? { BarChart: true, OrderTypesPie: true, WorkOrdersTable: true, LogComponent: true } : {},
    // The document rows link their equipment.
    routes: [{ path: '/equipment/:pk', name: 'equipment-equipment-view', component: { template: '<div />' } }],
    auth: { isBranchEmployee: false },
    main: { getProductFamily: family },
  })
  await vi.waitFor(() => expect(wrapper.vm.branch).toBeTruthy())
  await vi.waitFor(() => expect(wrapper.vm.isLoading).toBe(false))
  return wrapper
}

describe('DashboardView documents', () => {
  test('both tables link each document to its equipment by name', async () => {
    // Deep, so the tables render their rows.
    const wrapper = await mountDashboard('default', { deep: true })

    const equipmentLinks = (tableId) =>
      wrapper.findAll(`#${tableId} a`).filter((link) => !link.classes('document-link')).map((link) => link.text())
    expect(equipmentLinks('equipment-documents-table')).toEqual(['Boiler'])
    expect(equipmentLinks('location-documents-table')).toEqual(['Main building'])
  })
})

describe('DashboardView per product family', () => {
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
