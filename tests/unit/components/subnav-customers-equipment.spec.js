import { describe, expect, test, vi } from 'vitest'

import SubNav from '@/components/SubNav.vue'
import customerRoutes from '@/router/customer'

import { settle } from '../support/api-seam/index.js'
import { mountForm } from '../support/form-harness.js'

vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal()),
  hasAccessToModule: () => true,
}))

/**
 * The customers subnav lists equipment per type: Equipment (technical) and
 * Facility share their route names, so which entry is lit follows the type the
 * screen shows - its `type` param on the list, its layout props on the typed
 * add/view/edit routes - and an untyped screen counts as technical.
 */
async function mountAt(path) {
  const wrapper = mountForm(SubNav, {
    deep: true,
    props: { section: 'customers' },
    routes: customerRoutes,
    main: { getMemberHasBranches: false },
    auth: { isCustomer: false },
  })
  await wrapper.vm.$router.push(path)
  await settle()
  return wrapper
}

function activeLabels(wrapper) {
  return wrapper.findAll('a.nav-link.active').map((link) => link.text())
}

describe('SubNav (customers section) equipment types', () => {
  test('links the Facility entry to the facility list', async () => {
    const wrapper = await mountAt('/customers/equipment/technical')

    const hrefs = Object.fromEntries(wrapper.findAll('a.nav-link').map((link) => [link.text(), link.attributes('href')]))
    expect(hrefs.Equipment).toBe('/customers/equipment/technical')
    expect(hrefs.Facility).toBe('/customers/equipment/facility')
  })

  test.each([
    ['/customers/equipment/technical', 'Equipment'],
    ['/customers/equipment/facility', 'Facility'],
    ['/customers/equipment/facility/form', 'Facility'],
    ['/customers/equipment/facility/12', 'Facility'],
    ['/customers/equipment/facility/form/12', 'Facility'],
    ['/customers/equipment/technical/12', 'Equipment'],
    ['/customers/equipment/form/12', 'Equipment'],
  ])('%s lights %s alone', async (path, label) => {
    const wrapper = await mountAt(path)

    expect(activeLabels(wrapper)).toEqual([label])
  })

  test('the bare address of an old bookmark lands on the technical list', async () => {
    const wrapper = await mountAt('/customers/equipment')

    expect(wrapper.vm.$route.name).toBe('customers-equipment-list')
    expect(wrapper.vm.$route.params.type).toBe('technical')
  })
})
