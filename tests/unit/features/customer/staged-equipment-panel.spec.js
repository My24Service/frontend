import { beforeEach, describe, expect, test, vi } from 'vitest'
import { defineComponent } from 'vue'

import StagedEquipmentPanel from '@/features/customer/maintenance-contract/StagedEquipmentPanel.vue'
import { useEquipmentStaging } from '@/features/customer/maintenance-contract/useEquipmentStaging'
import { vPaginatedMaintenanceEquipmentList } from '@/api/valibot.gen'

import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountForm, toasts } from '../../support/form-harness.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

const MAIN = { getMemberHasBranches: true, getDefaultCurrency: 'EUR' }
const AUTH = { isPlanning: true, isAdmin: false }

const EQUIPMENT_ITEM = itemSchemaOf(vPaginatedMaintenanceEquipmentList)

function equipmentRow(overrides = {}) {
  return fixtureFor(EQUIPMENT_ITEM, {
    id: 11,
    contract: 5,
    equipment: 21,
    equipment_name: 'Pump A',
    times_per_year: 4,
    remarks: '',
    tariff: '40.00',
    tariff_currency: 'EUR',
    num_order_equipment: 1,
    created_orders: 2,
    ...overrides,
  })
}

const AUTOCOMPLETE_EQUIPMENT = {
  id: 21,
  name: 'Pump A',
  value: 'Pump A',
  location: null,
  identifier: null,
  description: null,
}

const deactivate = vi.fn()
const showModal = vi.fn()
const hideModal = vi.fn()

// The picker stub keeps the two things the panel reaches into it for: the
// `deactivate()`/`$refs.search.value` pair that carries what the user typed
// into the quick-create modal, and the `#noResult` slot that opens it.
const multiselectStub = {
  props: ['options'],
  emits: ['select', 'search-change'],
  methods: { deactivate },
  template: '<div><slot name="noResult" /><input ref="search" value="" /></div>',
}

const modalShellStub = {
  emits: ['ok', 'cancel'],
  methods: { show: showModal, hide: hideModal },
  template: '<div><slot /><button type="button" class="quick-create-ok" @click="$emit(\'ok\')">OK</button></div>',
}

// The staged set is owned above the panel now: the harness builds it the
// way the contract form does and hands it down, so the panel under test
// renders the same staging the form saves. The exposed replay, staged
// errors and total are the seam the form reads, pinned here.
const Harness = defineComponent({
  components: { StagedEquipmentPanel },
  props: ['customer', 'contractId', 'isCreate', 'loading'],
  setup(props, { expose }) {
    const staging = useEquipmentStaging({
      contractId: () => props.contractId,
      isCreate: () => props.isCreate,
      customerId: () => props.customer?.id,
    })
    expose({ replay: staging.replay, stagedErrors: staging.stagedErrors, totalDinero: staging.totalDinero })
    return { staging }
  },
  template: '<StagedEquipmentPanel :staging="staging" :customer="customer" :loading="loading" />',
})

async function mountPanel({ props = {}, main = MAIN } = {}) {
  const wrapper = mountForm(Harness, {
    deep: true,
    main,
    auth: AUTH,
    props: { customer: { id: 7 }, contractId: 5, isCreate: false, loading: false, ...props },
    stubs: { VueMultiselect: multiselectStub, 'b-modal': modalShellStub },
  })
  await settle()
  return wrapper
}

function picker(wrapper) {
  return wrapper.findComponent(multiselectStub)
}

async function selectEquipment(wrapper, option = { id: 21, name: 'Pump A' }) {
  await picker(wrapper).vm.$emit('select', option)
  await settle()
}

async function setFrequency(wrapper, value) {
  await wrapper.get('#maintenance-contract-equipment-times_per_year').setValue(value)
}

function equipmentFooterButton(wrapper, text) {
  const footer = wrapper.get('.maintenance-contract-equipment footer')
  const button = footer.findAll('button').find((b) => b.text() === text)
  if (!button) throw new Error('no equipment footer button labelled "' + text + '"')
  return button
}

function stagedRowTexts(wrapper) {
  return wrapper.findAll('.maintenance-contract-equipment tbody tr').map((row) => row.text())
}

beforeEach(() => {
  deactivate.mockClear()
  showModal.mockClear()
  hideModal.mockClear()
  api.get('/api/equipment/equipment/autocomplete/', [AUTOCOMPLETE_EQUIPMENT])
  api.post('/api/equipment/equipment/create_quick/', { id: 21, name: 'Pump B' })
  api.get('/api/customer/maintenance-equipment/', paginated([equipmentRow()]))
  api.post('/api/customer/maintenance-equipment/', equipmentRow())
  api.patch('/api/customer/maintenance-equipment/{id}/', equipmentRow())
  api.delete('/api/customer/maintenance-equipment/{id}/', noContent)
})

describe('StagedEquipmentPanel, the staged rows', () => {
  // The panel stages the whole set and replays it on save, so it reads the
  // contract's whole equipment set in one go: `page_size` 1000, the API's
  // paginator ceiling (my24service `apps/core/rest.py`
  // My24Pagination.max_page_size), which clamps a larger value rather than
  // rejecting it. A page-1 read would hide every row past 20 from the editor.
  test('reads the contract\'s whole equipment set', async () => {
    const wrapper = await mountPanel()

    expect(api.requests()).toEqual([
      {
        method: 'get',
        path: '/api/customer/maintenance-equipment/',
        query: { contract: '5', page: '1', page_size: '1000' },
        body: undefined,
      },
    ])
    expect(stagedRowTexts(wrapper)[0]).toContain('Pump A')
  })

  test('stages a picked equipment as a row', async () => {
    const wrapper = await mountPanel()
    await selectEquipment(wrapper, { id: 22, name: 'Pump B' })
    await setFrequency(wrapper, '2')
    await equipmentFooterButton(wrapper, 'Add equipment').trigger('click')
    await settle()

    const rows = stagedRowTexts(wrapper)
    expect(rows).toHaveLength(2)
    expect(rows[1]).toContain('Pump B')
    expect(rows[1]).toContain('2')
  })

  test('renders the hint instead of the picker until a customer is chosen', async () => {
    const wrapper = await mountPanel({ props: { customer: null } })

    expect(wrapper.text()).toContain('Select a customer to add equipment to this contract.')
    expect(picker(wrapper).exists()).toBe(false)
    expect(wrapper.find('.maintenance-contract-equipment').exists()).toBe(false)
  })
})

describe('StagedEquipmentPanel, the picker', () => {
  test('searches the customer\'s equipment, debounced half a second', async () => {
    const wrapper = await mountPanel()

    await picker(wrapper).vm.$emit('search-change', 'pump')
    await settle()
    expect(api.requests()).toHaveLength(1)

    await new Promise((resolve) => setTimeout(resolve, 600))
    await settle()

    expect(api.requests().slice(1)).toEqual([
      {
        method: 'get',
        path: '/api/equipment/equipment/autocomplete/',
        query: { q: 'pump', customer: '7' },
        body: undefined,
      },
    ])
  })

  // The modal is reached through the picker: the button in its `#noResult`
  // slot closes the dropdown, carries what was typed into the name field, and
  // shows the modal. Each of those is a handle the panel holds on someone
  // else's component, so each is pinned here.
  test('opens the quick-create modal carrying what was typed into the picker', async () => {
    const wrapper = await mountPanel()
    const search = picker(wrapper).get('input')
    search.element.value = 'Pump B'

    await picker(wrapper).findAll('button').find((b) => b.text() === 'Add equipment').trigger('click')
    await settle()

    expect(deactivate).toHaveBeenCalled()
    expect(showModal).toHaveBeenCalled()
    expect(wrapper.get('#maintenance_equipment_new_equipment').element.value).toBe('Pump B')
  })

  test('quick-created equipment is staged on the row and closes the modal', async () => {
    const wrapper = await mountPanel()

    await wrapper.get('#maintenance_equipment_new_equipment').setValue('Pump B')
    await wrapper.get('.quick-create-ok').trigger('click')
    await settle()

    expect(api.requests().slice(1)).toEqual([
      {
        method: 'post',
        path: '/api/equipment/equipment/create_quick/',
        query: {},
        body: { customer: 7, name: 'Pump B' },
      },
    ])
    expect(hideModal).toHaveBeenCalled()
    expect(toasts().map((toast) => toast.body)).not.toContain('Error adding equipment')

    await setFrequency(wrapper, '4')
    await equipmentFooterButton(wrapper, 'Add equipment').trigger('click')
    await settle()
    await wrapper.vm.replay(5)

    const post = api.requests().find(
      (request) => request.method === 'post' && request.path === '/api/customer/maintenance-equipment/',
    )
    expect(post.body).toMatchObject({ equipment: 21, equipment_name: 'Pump B', times_per_year: 4 })
  })

  test('refuses to quick-create equipment without a branch-capable tenant', async () => {
    const wrapper = await mountPanel({
      props: { isCreate: true, contractId: Number.NaN },
      main: { ...MAIN, getMemberHasBranches: false },
    })

    await wrapper.get('#maintenance_equipment_new_equipment').setValue('Pump B')
    await wrapper.get('.quick-create-ok').trigger('click')
    await settle()

    expect(toasts().map((toast) => toast.body)).toContain('Not creating equipment from branch environment')
    expect(api.requests()).toEqual([])
  })

  // The frequency field is the form's next step after either way of choosing an
  // equipment, and the handle on it crosses the composable: the panel binds the
  // ref by name and the composable focuses it. happy-dom does not move
  // `document.activeElement` on a programmatic focus, so the call is pinned at
  // the input instead of the focus state.
  test('focuses the frequency field once an equipment is picked', async () => {
    const wrapper = await mountPanel()
    const focus = vi.spyOn(
      wrapper.get('#maintenance-contract-equipment-times_per_year').element,
      'focus',
    )

    await selectEquipment(wrapper, { id: 22, name: 'Pump B' })

    expect(focus).toHaveBeenCalled()
  })
})

describe('StagedEquipmentPanel, editing a staged row', () => {
  async function startRowEdit(wrapper) {
    const row = wrapper.get('.maintenance-contract-equipment tbody tr')
    await row.findAll('a')[0].trigger('click')
    await settle()
  }

  test('cancel discards the staged edit instead of mutating the row', async () => {
    const wrapper = await mountPanel()
    await startRowEdit(wrapper)
    expect(wrapper.get('#maintenance-contract-equipment-times_per_year').element.value).toBe('4')

    await setFrequency(wrapper, '9')
    await equipmentFooterButton(wrapper, 'Cancel').trigger('click')
    await settle()

    expect(stagedRowTexts(wrapper)[0]).not.toContain('9')
    expect(equipmentFooterButton(wrapper, 'Add equipment')).toBeDefined()

    await wrapper.vm.replay(5)
    const patch = api.requests().find(
      (request) => request.method === 'patch' && request.path.startsWith('/api/customer/maintenance-equipment/'),
    )
    expect(patch.body).toMatchObject({ times_per_year: 4 })
  })

  test('commit writes the staged edit into the row', async () => {
    const wrapper = await mountPanel()
    await startRowEdit(wrapper)

    await setFrequency(wrapper, '9')
    await equipmentFooterButton(wrapper, 'Edit equipment').trigger('click')
    await settle()

    expect(stagedRowTexts(wrapper)[0]).toContain('9')
  })

  test('deleting a row above the edited one keeps the edit on the right row', async () => {
    const wrapper = await mountPanel()
    await selectEquipment(wrapper, { id: 22, name: 'Pump B' })
    await setFrequency(wrapper, '2')
    await equipmentFooterButton(wrapper, 'Add equipment').trigger('click')
    await settle()
    expect(stagedRowTexts(wrapper)).toHaveLength(2)

    const rows = () => wrapper.findAll('.maintenance-contract-equipment tbody tr')
    await rows()[1].findAll('a')[0].trigger('click')
    await settle()
    await setFrequency(wrapper, '9')

    await rows()[0].findAll('a')[1].trigger('click')
    await settle()
    await equipmentFooterButton(wrapper, 'Edit equipment').trigger('click')
    await settle()

    const remaining = stagedRowTexts(wrapper)
    expect(remaining).toHaveLength(1)
    expect(remaining[0]).toContain('Pump B')
    expect(remaining[0]).toContain('9')
  })
})

describe('StagedEquipmentPanel, what the contract form reads from it', () => {
  test('replays the staged set: updates, then creates, then deletions', async () => {
    api.get('/api/customer/maintenance-equipment/', paginated([
      equipmentRow(),
      equipmentRow({ id: 12, equipment: 23, equipment_name: 'Pump C', tariff: '10.00' }),
    ]))
    const wrapper = await mountPanel()

    await selectEquipment(wrapper, { id: 22, name: 'Pump B' })
    await setFrequency(wrapper, '2')
    await equipmentFooterButton(wrapper, 'Add equipment').trigger('click')
    await settle()

    const rows = () => wrapper.findAll('.maintenance-contract-equipment tbody tr')
    await rows()[1].findAll('a')[1].trigger('click')
    await settle()
    expect(stagedRowTexts(wrapper)).toHaveLength(2)

    await wrapper.vm.replay(5)

    expect(api.requests().slice(1)).toEqual([
      { method: 'patch', path: '/api/customer/maintenance-equipment/11/', query: {}, body: expect.anything() },
      {
        method: 'post',
        path: '/api/customer/maintenance-equipment/',
        query: {},
        body: expect.objectContaining({ contract: 5, equipment: 22, equipment_name: 'Pump B' }),
      },
      { method: 'delete', path: '/api/customer/maintenance-equipment/12/', query: {} },
    ])
  })

  test('reports the staged failure that has to block the contract write', async () => {
    const wrapper = await mountPanel()
    expect(wrapper.vm.stagedErrors()).toEqual({})

    await selectEquipment(wrapper, { id: 22, name: 'Pump B' })
    await setFrequency(wrapper, 'abc')
    expect(wrapper.vm.stagedErrors()).toEqual({ equipment: 'Please fix the equipment rows before saving' })

    await equipmentFooterButton(wrapper, 'Add equipment').trigger('click')
    await settle()
    expect(wrapper.vm.stagedErrors()).toEqual({ equipment: 'Please fix the equipment rows before saving' })
  })

  test('totals the staged tariffs for the contract value', async () => {
    const wrapper = await mountPanel()

    expect(wrapper.vm.totalDinero.toFormat('$0.00')).toBe('€40.00')

    await selectEquipment(wrapper, { id: 22, name: 'Pump B' })
    await setFrequency(wrapper, '2')
    await equipmentFooterButton(wrapper, 'Add equipment').trigger('click')
    await settle()

    expect(wrapper.vm.totalDinero.toFormat('$0.00')).toBe('€40.00')
  })
})
