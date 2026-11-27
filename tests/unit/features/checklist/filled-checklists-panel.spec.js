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

describe('FilledChecklistsPanel, groups, results and photos', () => {
  test('shows each group heading above its questions', async () => {
    api.get(PATH, [finished({questions: [
      question('Does it close?', '', {group_name: 'Door', part_name: '', result: 'ok'}),
      question('Does it lock?', '', {group_name: 'Door', part_name: '', result: 'ok'}),
      question('Is the cable whole?', '', {group_name: 'Cable', part_name: '', result: 'ok'}),
    ]})])

    const wrapper = await mountPanel()

    expect(wrapper.findAll('.checklist-group').map((heading) => heading.text())).toEqual(['Door', 'Cable'])
  })

  test('shows a result badge per question, and none for a text question', async () => {
    api.get(PATH, [finished({questions: [
      question('Does it close?', '', {group_name: '', part_name: '', result: 'ok'}),
      question('Does it lock?', 'Lock is stiff', {group_name: '', part_name: '', result: 'nok'}),
      question('Is there a light?', '', {group_name: '', part_name: '', result: 'na'}),
      question('Remarks for the office', 'None', {group_name: '', part_name: '', result: null}),
    ]})])

    const wrapper = await mountPanel()

    const badges = wrapper.findAll('tr.checklist-answer').map((row) => row.find('.result .badge'))
    expect(badges.slice(0, 3).map((badge) => badge.text())).toEqual(['Good', 'Not approved', 'Not applicable'])
    expect(badges[1].classes()).toContain('text-bg-danger')
    expect(badges[3].exists()).toBe(false)
    expect(answerRows(wrapper)[1]).toEqual(['Does it lock?', 'Lock is stiff'])
  })

  test('names the part a question checks', async () => {
    api.get(PATH, [finished({questions: [
      question('Does it close?', '', {group_name: '', part_name: 'Door', result: 'ok'}),
    ]})])

    const wrapper = await mountPanel()

    expect(wrapper.get('.part-name').text()).toBe('(Door)')
  })

  test('shows the photos of a question as thumbnails that open the photo', async () => {
    api.get(PATH, [finished({questions: [
      question('Does it lock?', 'Lock is stiff', {
        group_name: '', part_name: '', result: 'nok',
        photos: [{url: 'https://riedel.example/media/p1.jpg'}, {url: 'https://riedel.example/media/p2.jpg'}],
      }),
    ]})])

    const wrapper = await mountPanel()

    const links = wrapper.findAll('.photos a')
    expect(links.map((link) => link.attributes('href'))).toEqual([
      'https://riedel.example/media/p1.jpg',
      'https://riedel.example/media/p2.jpg',
    ])
    expect(links[0].attributes('target')).toBe('_blank')
    expect(links[0].get('img').attributes('src')).toBe('https://riedel.example/media/p1.jpg')
  })
})

describe('FilledChecklistsPanel, scores and remarks', () => {
  test('shows the score, the rejected points and the valid-until date', async () => {
    api.get(PATH, [finished({score: 3, rejected_count: 2, valid_until: '2027-11-27'})])

    const wrapper = await mountPanel()

    expect(wrapper.get('.checklist-score').text()).toBe('3')
    expect(wrapper.get('.checklist-rejected').text()).toBe('2')
    expect(wrapper.get('.checklist-valid-until').text()).toBe('27-11-2027')
  })

  // A checklist of text questions, and every record finished before results existed.
  test('shows none of them for a checklist without a score', async () => {
    const wrapper = await mountPanel()

    expect(wrapper.find('.checklist-result').exists()).toBe(false)
  })

  test('shows the score of each part', async () => {
    api.get(PATH, [finished({parts: [
      {name: 'Door', score: 2, rejected_count: 1},
      {name: 'Cable', score: 1, rejected_count: 0},
    ]})])

    const wrapper = await mountPanel()

    const rows = wrapper.findAll('.part-scores tbody tr').map((row) => row.findAll('td').map((cell) => cell.text()))
    expect(rows).toEqual([['Door', '2', '1'], ['Cable', '1', '0']])
  })

  test('shows the general remark when there is one', async () => {
    api.get(PATH, [finished({remarks: 'Lift needs a new door within six months.'})])

    const wrapper = await mountPanel()

    expect(wrapper.get('.checklist-remarks').text()).toContain('Lift needs a new door within six months.')
  })

  test('shows no remark block without a remark, and no part table without parts', async () => {
    const wrapper = await mountPanel()

    expect(wrapper.find('.checklist-remarks').exists()).toBe(false)
    expect(wrapper.find('.part-scores').exists()).toBe(false)
  })
})
