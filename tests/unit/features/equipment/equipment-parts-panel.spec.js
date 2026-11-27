import { beforeEach, describe, expect, test } from 'vitest'

import { vEquipment, vEquipmentPart, vEquipmentPartCondition } from '@/api/valibot.gen'
import { EquipmentPartsPanel } from '@/features/equipment/equipment'

import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'

const api = installApiSeam()

const PLANNER = {isPlanning: true}

// The equipment's own `parts` carry the scores; the part list the description and position.
const EQUIPMENT = fixtureFor(vEquipment, {
  id: 11,
  name: 'Lift 2',
  parts: [
    fixtureFor(vEquipmentPartCondition, {id: 5, name: 'Door', sequence: 0, score: 3, rejected_count: 1, date: '2026-10-01'}),
    fixtureFor(vEquipmentPartCondition, {id: 6, name: 'Cable', sequence: 1, score: null, rejected_count: null, date: null}),
  ],
})

function part(id, name, description, sequence) {
  return fixtureFor(vEquipmentPart, {id, equipment: 11, name, description, sequence})
}

const PARTS = paginated([part(5, 'Door', 'Sliding door', 0), part(6, 'Cable', '', 1)])

beforeEach(() => {
  api.get('/api/equipment/equipment-part/', PARTS)
})

async function mountPanel({ auth = PLANNER, equipment = EQUIPMENT } = {}) {
  const wrapper = mountForm(EquipmentPartsPanel, {deep: true, props: {equipment}, auth})
  await settle()
  return wrapper
}

function rowsOf(wrapper) {
  return wrapper.findAll('tbody tr').map((row) => row.findAll('td').map((cell) => cell.text()))
}

describe('EquipmentPartsPanel, reading', () => {
  test('asks for every part of this equipment', async () => {
    await mountPanel()

    expect(api.requests()).toEqual([
      {method: 'get', path: '/api/equipment/equipment-part/', query: {equipment: '11', page: '1', page_size: '1000'}},
    ])
  })

  test('shows each part with its description, position and condition', async () => {
    const wrapper = await mountPanel({auth: {}})

    expect(rowsOf(wrapper)).toEqual([
      ['Door', 'Sliding door', '0', '3', '1', '01-10-2026'],
      ['Cable', '', '1', '', '', ''],
    ])
  })

  test('says so when the equipment has no parts', async () => {
    api.get('/api/equipment/equipment-part/', paginated([]))

    const wrapper = await mountPanel()

    expect(wrapper.text()).toContain('This equipment has no parts yet')
    expect(wrapper.find('table').exists()).toBe(false)
  })

  test('tells the user when the parts cannot be loaded', async () => {
    api.get('/api/equipment/equipment-part/', serverError)

    await mountPanel()

    expect(toasts().map((toast) => toast.body)).toContain('Error loading parts')
  })
})
