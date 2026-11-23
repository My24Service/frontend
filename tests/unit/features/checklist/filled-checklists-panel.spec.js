import { beforeEach, describe, expect, test } from 'vitest'

import { FilledChecklistsPanel } from '@/features/checklist'
import { vAssignedOrderChecklistAnswer, vAssignedOrderChecklistSignature } from '@/api/valibot.gen'

import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'

const api = installApiSeam()

function answer(id, assignedOrder, questionText, text) {
  return fixtureFor(vAssignedOrderChecklistAnswer, {
    id, assigned_order: assignedOrder, question: id, question_text: questionText, answer: text,
  })
}

// Two engineers each filled the checklist in for the same order.
const ANSWERS = paginated([
  answer(1, 80, 'Is the power connected?', 'Yes'),
  answer(2, 80, 'Is the stand level?', 'No, shimmed'),
  answer(3, 81, 'Is the power connected?', 'Yes'),
])

const SIGNATURES = paginated([
  fixtureFor(vAssignedOrderChecklistSignature, {
    id: 5,
    assigned_order: 80,
    checklist: 3,
    signature_user: 'https://files.example/user-80.png',
    signature_name_user: 'Piet',
    signature_customer: 'https://files.example/customer-80.png',
    signature_name_customer: 'Jan',
  }),
])

beforeEach(() => {
  api.get('/api/mobile/checklist-answer/', ANSWERS)
  api.get('/api/mobile/checklist-signature/', SIGNATURES)
})

async function mountPanel() {
  const wrapper = mountForm(FilledChecklistsPanel, {deep: true, props: {orderId: 42}})
  await settle()
  return wrapper
}

function rowsOf(section) {
  return section.findAll('tbody tr').map((row) => row.findAll('td').map((cell) => cell.text()))
}

describe('FilledChecklistsPanel', () => {
  test('asks for the order\'s answers and signatures, all of them', async () => {
    await mountPanel()

    const query = {order: '42', page: '1', page_size: '1000'}
    expect(api.requests()).toEqual(expect.arrayContaining([
      {method: 'get', path: '/api/mobile/checklist-answer/', query},
      {method: 'get', path: '/api/mobile/checklist-signature/', query},
    ]))
    expect(api.requests()).toHaveLength(2)
  })

  test('shows each assigned order\'s questions and answers on their own', async () => {
    const wrapper = await mountPanel()

    const sections = wrapper.findAll('.filled-checklist')
    expect(sections).toHaveLength(2)
    expect(rowsOf(sections[0])).toEqual([
      ['Is the power connected?', 'Yes'],
      ['Is the stand level?', 'No, shimmed'],
    ])
    expect(rowsOf(sections[1])).toEqual([['Is the power connected?', 'Yes']])
  })

  test('shows the signatures under the answers they belong to', async () => {
    const wrapper = await mountPanel()

    const [signed, unsigned] = wrapper.findAll('.filled-checklist')
    expect(signed.text()).toContain('Name employee: Piet')
    expect(signed.text()).toContain('Name customer: Jan')
    expect(signed.findAll('img').map((img) => img.attributes('src'))).toEqual([
      'https://files.example/user-80.png',
      'https://files.example/customer-80.png',
    ])
    expect(unsigned.findAll('img')).toHaveLength(0)
  })

  test('shows a signature image only where one was given', async () => {
    api.get('/api/mobile/checklist-signature/', paginated([
      {...SIGNATURES.results[0], signature_customer: null, signature_name_customer: null},
    ]))

    const wrapper = await mountPanel()

    expect(wrapper.findAll('img').map((img) => img.attributes('src'))).toEqual([
      'https://files.example/user-80.png',
    ])
  })

  test('renders nothing for an order without a filled-in checklist', async () => {
    api.get('/api/mobile/checklist-answer/', paginated([]))
    api.get('/api/mobile/checklist-signature/', paginated([]))

    const wrapper = await mountPanel()

    expect(wrapper.find('.filled-checklists').exists()).toBe(false)
  })

  test('tells the user when the answers cannot be loaded', async () => {
    api.get('/api/mobile/checklist-answer/', serverError)

    await mountPanel()

    expect(toasts().map((toast) => toast.body)).toContain('Error loading checklist answers')
  })
})
