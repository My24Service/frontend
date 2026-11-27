import { beforeEach, describe, expect, test } from 'vitest'

import { FilledChecklistsPanel } from '@/features/checklist'
import {
  vAssignedOrderChecklistSignature,
  vChecklistData,
  vChecklistDataQuestion,
} from '@/api/valibot.gen'

import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'

const api = installApiSeam()

const PATH = '/api/order/order/{id}/checklists/'

function question(text, answer, extra = {}) {
  return fixtureFor(vChecklistDataQuestion, {question: text, answer, ...extra})
}

/** One finished checklist as the action returns it; a test overrides what it asserts on. */
function finished(overrides = {}) {
  return fixtureFor(vChecklistData, {
    user: 'Piet Monteur',
    checklist: {id: 3, name: 'Lift inspection'},
    equipment: {id: 9, name: 'Lift 2'},
    signatures: fixtureFor(vAssignedOrderChecklistSignature, {
      id: 5,
      assigned_order: 80,
      checklist: 3,
      signature_user: 'https://files.example/user-80.png',
      signature_name_user: 'Piet',
      signature_customer: 'https://files.example/customer-80.png',
      signature_name_customer: 'Jan',
    }),
    remarks: '',
    rejected_count: null,
    valid_until: null,
    score: null,
    parts: [],
    questions: [question('Is the power connected?', 'Yes'), question('Is the stand level?', 'No, shimmed')],
    ...overrides,
  })
}

beforeEach(() => {
  api.get(PATH, [finished()])
})

async function mountPanel() {
  const wrapper = mountForm(FilledChecklistsPanel, {deep: true, props: {orderId: 42}})
  await settle()
  return wrapper
}

function answerRows(block) {
  return block.findAll('tr.checklist-answer').map((row) => [row.get('.question').text(), row.get('.answer').text()])
}

describe('FilledChecklistsPanel', () => {
  test('asks for the order\'s finished checklists, once', async () => {
    await mountPanel()

    expect(api.requests()).toHaveLength(1)
    expect(api.requests()[0]).toMatchObject({method: 'get', path: '/api/order/order/42/checklists/'})
  })

  test('shows one block per finished checklist, with its checklist, equipment and engineer', async () => {
    api.get(PATH, [
      finished(),
      finished({checklist: {id: 4, name: 'Delivery'}, equipment: null, user: 'Kees Monteur'}),
    ])

    const wrapper = await mountPanel()

    const blocks = wrapper.findAll('.filled-checklist')
    expect(blocks.map((block) => block.get('.checklist-title').text())).toEqual(['Lift inspection - Lift 2', 'Delivery'])
    expect(blocks.map((block) => block.get('.checklist-user').text())).toEqual(['Piet Monteur', 'Kees Monteur'])
  })

  test('shows the questions and their answers', async () => {
    const wrapper = await mountPanel()

    expect(answerRows(wrapper.get('.filled-checklist'))).toEqual([
      ['Is the power connected?', 'Yes'],
      ['Is the stand level?', 'No, shimmed'],
    ])
  })

  test('shows the signatures under the checklist they belong to', async () => {
    const wrapper = await mountPanel()

    const block = wrapper.get('.filled-checklist')
    expect(block.text()).toContain('Name employee: Piet')
    expect(block.text()).toContain('Name customer: Jan')
    expect(block.findAll('.signature img').map((img) => img.attributes('src'))).toEqual([
      'https://files.example/user-80.png',
      'https://files.example/customer-80.png',
    ])
  })

  test('shows a signature image only where one was given', async () => {
    api.get(PATH, [finished({
      signatures: fixtureFor(vAssignedOrderChecklistSignature, {
        id: 5, assigned_order: 80, checklist: 3,
        signature_user: 'https://files.example/user-80.png', signature_name_user: 'Piet',
        signature_customer: null, signature_name_customer: null,
      }),
    })])

    const wrapper = await mountPanel()

    expect(wrapper.findAll('.signature img').map((img) => img.attributes('src'))).toEqual([
      'https://files.example/user-80.png',
    ])
  })

  test('renders nothing for an order without a finished checklist', async () => {
    api.get(PATH, [])

    const wrapper = await mountPanel()

    expect(wrapper.find('.filled-checklists').exists()).toBe(false)
  })

  test('tells the user when the checklists cannot be loaded', async () => {
    api.get(PATH, serverError)

    await mountPanel()

    expect(toasts().map((toast) => toast.body)).toContain('Error loading checklists')
  })
})
