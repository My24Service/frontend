import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test } from 'vitest'

import { vEquipment, vEquipmentPart, vEquipmentPartCondition } from '@/api/valibot.gen'
import { EquipmentPartsPanel } from '@/features/equipment/equipment'

import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountForm, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'

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
  api.patch('/api/equipment/equipment-part/{id}/', ({ params, body }) =>
    part(Number(params.id), 'Door', body.description, body.sequence))
  api.delete('/api/equipment/equipment-part/{id}/', noContent)
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

  test('does not say "no parts" after a failed load', async () => {
    api.get('/api/equipment/equipment-part/', serverError)

    const wrapper = await mountPanel()

    expect(toasts().map((toast) => toast.body)).toContain('Error loading parts')
    expect(wrapper.text()).not.toContain('This equipment has no parts yet')
  })

  test('does not say "no parts" while the parts are loading', async () => {
    api.get('/api/equipment/equipment-part/', () => new Promise(() => {}))

    const wrapper = mountForm(EquipmentPartsPanel, {deep: true, props: {equipment: EQUIPMENT}, auth: PLANNER})
    await settle()

    expect(wrapper.text()).not.toContain('This equipment has no parts yet')
  })

  // The API refuses a part write to every role but planning users and staff.
  test('offers no edit and no delete to a user who is not a planner', async () => {
    const wrapper = await mountPanel({auth: {isPlanning: false, isCustomer: true}})

    expect(wrapper.find('.edit-part').exists()).toBe(false)
    expect(wrapper.find('.delete-part').exists()).toBe(false)
  })
})

describe('EquipmentPartsPanel, editing', () => {
  test('a planner changes the description and the position of a part', async () => {
    const wrapper = await mountPanel()

    await wrapper.findAll('.edit-part')[0].trigger('click')
    await wrapper.get('#part_description-5').setValue('Sliding door, left')
    await wrapper.get('#part_sequence-5').setValue('2')
    await wrapper.get('.save-part').trigger('click')
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'patch')).toEqual([
      expect.objectContaining({path: '/api/equipment/equipment-part/5/', body: {description: 'Sliding door, left', sequence: 2}}),
    ])
    expect(toasts().map((toast) => toast.body)).toContain('Part has been updated')
    expect(wrapper.find('#part_description-5').exists()).toBe(false)
  })

  test('refuses a position that is not a whole number, and sends nothing', async () => {
    const wrapper = await mountPanel()

    await wrapper.findAll('.edit-part')[0].trigger('click')
    await wrapper.get('#part_sequence-5').setValue('1.5')
    await wrapper.get('.save-part').trigger('click')
    await settle()

    expect(wrapper.text()).toContain('Please enter a whole number')
    expect(api.requests().filter((sent) => sent.method === 'patch')).toEqual([])
  })

  test('cancelling sends nothing and shows the stored values again', async () => {
    const wrapper = await mountPanel()

    await wrapper.findAll('.edit-part')[0].trigger('click')
    await wrapper.get('#part_description-5').setValue('Changed')
    await wrapper.get('.cancel-part').trigger('click')

    expect(api.requests().filter((sent) => sent.method === 'patch')).toEqual([])
    expect(rowsOf(wrapper)[0][1]).toBe('Sliding door')
  })

  test('reads the part list again after a save', async () => {
    const wrapper = await mountPanel()

    await wrapper.findAll('.edit-part')[0].trigger('click')
    await wrapper.get('.save-part').trigger('click')
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'get' && sent.path === '/api/equipment/equipment-part/')).toHaveLength(2)
  })

  test('a save that finishes after another row was opened leaves that edit open', async () => {
    let release
    const held = new Promise((resolve) => { release = resolve })
    api.patch('/api/equipment/equipment-part/{id}/', async ({ params, body }) => {
      await held
      return part(Number(params.id), 'Door', body.description, body.sequence)
    })
    const wrapper = await mountPanel()

    await wrapper.findAll('.edit-part')[0].trigger('click')
    await wrapper.get('.save-part').trigger('click')
    await settle()
    // Row A's save is pending; its edit is still open, so only the other row offers an edit.
    await wrapper.get('.cancel-part').trigger('click')
    await wrapper.findAll('.edit-part')[1].trigger('click')
    expect(wrapper.find('#part_description-6').exists()).toBe(true)

    release()
    await settle()

    expect(wrapper.find('#part_description-6').exists()).toBe(true)
  })

  test('tells the user when the part cannot be saved, and stays in the edit', async () => {
    api.patch('/api/equipment/equipment-part/{id}/', serverError)
    const wrapper = await mountPanel()

    await wrapper.findAll('.edit-part')[0].trigger('click')
    await wrapper.get('.save-part').trigger('click')
    await settle()

    expect(toasts().map((toast) => toast.body)).toContain('Error updating part')
    expect(wrapper.find('#part_description-5').exists()).toBe(true)
  })
})

describe('EquipmentPartsPanel, deleting', () => {
  test('a planner deletes a part through the confirmation modal', async () => {
    const wrapper = await mountPanel()

    await wrapper.findAll('.delete-part')[1].trigger('click')
    await settle()
    expect(api.requests().filter((sent) => sent.method === 'delete')).toEqual([])

    modal('delete-equipment-part-modal').ok()
    await settle()

    expect(api.requests().find((sent) => sent.method === 'delete')).toMatchObject({
      path: '/api/equipment/equipment-part/6/',
    })
    expect(toasts().map((toast) => toast.body)).toContain('Part has been deleted')
    expect(api.requests().filter((sent) => sent.method === 'get' && sent.path === '/api/equipment/equipment-part/')).toHaveLength(2)
  })

  // A part with condition records keeps its history: the API answers 400.
  test('tells the user a part with condition records cannot be deleted', async () => {
    api.delete('/api/equipment/equipment-part/{id}/', () => HttpResponse.json(
      {detail: 'This part has condition records and cannot be deleted.'}, {status: 400}))
    const wrapper = await mountPanel()

    await wrapper.findAll('.delete-part')[0].trigger('click')
    await settle()
    modal('delete-equipment-part-modal').ok()
    await settle()

    expect(toasts().map((toast) => toast.body)).toEqual([
      'This part has condition records and cannot be deleted.',
    ])
  })
})
