import { beforeEach, describe, expect, test } from 'vitest'

import { ChecklistForm } from '@/features/checklist'
import { vChecklist, vChecklistQuestion } from '@/api/valibot.gen'

import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { checklistRoutes } from '../../support/checklist-routes.js'
import { createTestQueryClient, mountForm, routerGo, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'

const api = installApiSeam()

// As the API sends every checklist: all four fields present.
const CHECKLIST = fixtureFor(vChecklist, {id: 3, name: 'Delivery', norm: '', validity_months: null, archived: false})

function question(id, checklist, text) {
  return fixtureFor(vChecklistQuestion, {id, checklist, question: text})
}

// In the checklist's own order (sequence, then id), as the endpoint answers.
const QUESTIONS = paginated([
  question(11, 3, 'Is the power connected?'),
  question(12, 3, 'Is the stand level?'),
])

let nextQuestionId

beforeEach(() => {
  nextQuestionId = 100
  api.get('/api/checklist/checklist/{id}/', CHECKLIST)
  api.post('/api/checklist/checklist/', CHECKLIST)
  api.patch('/api/checklist/checklist/{id}/', CHECKLIST)
  api.get('/api/checklist/checklist-question/', QUESTIONS)
  api.post('/api/checklist/checklist-question/', ({ body }) =>
    question(nextQuestionId++, body.checklist, body.question))
  api.patch('/api/checklist/checklist-question/{id}/', ({ params, body }) =>
    question(Number(params.id), 3, body.question))
  api.delete('/api/checklist/checklist-question/{id}/', noContent)
})

async function mountChecklistForm(props = {}) {
  const wrapper = mountForm(ChecklistForm, {deep: true, routes: checklistRoutes, props})
  await settle()
  return wrapper
}

async function type(wrapper, selector, value) {
  const field = wrapper.get(selector)
  await field.setValue(value)
  await field.trigger('change')
}

async function addQuestion(wrapper, text) {
  await wrapper.get('.add-question').trigger('click')
  const index = wrapper.findAll('.checklist-question').length - 1
  if (text !== undefined) await type(wrapper, `#checklist_question-${index}`, text)
}

async function submit(wrapper) {
  await wrapper.get('.modal-footer .btn-primary').trigger('click')
  await settle()
  await wrapper.vm.$nextTick()
}

function questionTexts(wrapper) {
  return wrapper.findAll('.checklist-question input').map((input) => input.element.value)
}

function shownErrors(wrapper) {
  return wrapper.findAll('.invalid-feedback.d-block').map((node) => node.text())
}

function sent(method) {
  return api.requests().filter((request) => request.method === method)
}

describe('ChecklistForm, creating a checklist', () => {
  test('opens on an empty form headed New checklist, and reads nothing', async () => {
    const wrapper = await mountChecklistForm()

    expect(wrapper.text()).toContain('New checklist')
    expect(wrapper.get('#checklist_name').element.value).toBe('')
    expect(questionTexts(wrapper)).toEqual([])
    expect(sent('get')).toEqual([])
  })

  test('creates the checklist, then its questions against the id it got', async () => {
    const wrapper = await mountChecklistForm()

    await type(wrapper, '#checklist_name', 'Delivery')
    await addQuestion(wrapper, 'Is the stand level?')
    await addQuestion(wrapper, 'Is the power connected?')
    await submit(wrapper)

    expect(sent('post').map(({ path, body }) => ({path, body}))).toEqual([
      {path: '/api/checklist/checklist/', body: {name: 'Delivery', norm: '', validity_months: null, archived: false}},
      {path: '/api/checklist/checklist-question/', body: {checklist: 3, question: 'Is the stand level?'}},
      {path: '/api/checklist/checklist-question/', body: {checklist: 3, question: 'Is the power connected?'}},
    ])
    expect(toasts().map((toast) => toast.body)).toContain('Checklist has been created')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('refuses a checklist with no name, and sends nothing', async () => {
    const wrapper = await mountChecklistForm()

    await addQuestion(wrapper, 'Is the stand level?')
    await submit(wrapper)

    expect(shownErrors(wrapper)).toContain('Please enter a name')
    expect(sent('post')).toEqual([])
    expect(routerGo()).not.toHaveBeenCalled()
  })

  test('refuses a question left blank, spaces included, and sends nothing', async () => {
    const wrapper = await mountChecklistForm()

    await type(wrapper, '#checklist_name', 'Delivery')
    await addQuestion(wrapper, '   ')
    await submit(wrapper)

    expect(shownErrors(wrapper)).toContain('Please enter a question')
    expect(sent('post')).toEqual([])
    expect(routerGo()).not.toHaveBeenCalled()
  })

  test('a removed question is not sent', async () => {
    const wrapper = await mountChecklistForm()

    await type(wrapper, '#checklist_name', 'Delivery')
    await addQuestion(wrapper, 'Dropped')
    await addQuestion(wrapper, 'Kept')
    await wrapper.findAll('.remove-question')[0].trigger('click')
    await submit(wrapper)

    expect(sent('post').map((request) => request.body)).toEqual([
      {name: 'Delivery', norm: '', validity_months: null, archived: false},
      {checklist: 3, question: 'Kept'},
    ])
    expect(sent('delete')).toEqual([])
  })

  test('a retry after a failed question updates the checklist instead of creating a second one', async () => {
    api.post('/api/checklist/checklist-question/', serverError)
    const wrapper = await mountChecklistForm()

    await type(wrapper, '#checklist_name', 'Delivery')
    await addQuestion(wrapper, 'Is the stand level?')
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error creating checklist')
    expect(routerGo()).not.toHaveBeenCalled()

    api.post('/api/checklist/checklist-question/', ({ body }) => question(100, body.checklist, body.question))
    await submit(wrapper)

    expect(sent('post').filter((request) => request.path === '/api/checklist/checklist/')).toHaveLength(1)
    expect(sent('patch').map((request) => request.path)).toEqual(['/api/checklist/checklist/3/'])
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('sends the norm, the validity in months and the archived flag', async () => {
    const wrapper = await mountChecklistForm()

    await type(wrapper, '#checklist_name', 'Lift inspection')
    await type(wrapper, '#checklist_norm', 'NEN-EN 81-20')
    await type(wrapper, '#checklist_validity_months', '12')
    await wrapper.get('#checklist_archived').setValue(true)
    await submit(wrapper)

    expect(sent('post')[0]).toMatchObject({
      path: '/api/checklist/checklist/',
      body: {name: 'Lift inspection', norm: 'NEN-EN 81-20', validity_months: 12, archived: true},
    })
  })

  test('refuses a validity above 120 months, and sends nothing', async () => {
    const wrapper = await mountChecklistForm()

    await type(wrapper, '#checklist_name', 'Lift inspection')
    await type(wrapper, '#checklist_validity_months', '121')
    await submit(wrapper)

    expect(shownErrors(wrapper)).toContain('Please enter a value of at most 120')
    expect(sent('post')).toEqual([])
  })

  test('refuses a norm longer than 80 characters, and sends nothing', async () => {
    const wrapper = await mountChecklistForm()

    await type(wrapper, '#checklist_name', 'Lift inspection')
    await type(wrapper, '#checklist_norm', 'N'.repeat(81))
    await submit(wrapper)

    expect(shownErrors(wrapper)).toContain('Please use at most 80 characters')
    expect(sent('post')).toEqual([])
  })
})

describe('ChecklistForm, editing a checklist', () => {
  test('opens on the checklist and its questions, in the order the API gives them', async () => {
    const wrapper = await mountChecklistForm({pk: 3})

    expect(wrapper.text()).toContain('Edit checklist')
    expect(wrapper.get('#checklist_name').element.value).toBe('Delivery')
    expect(questionTexts(wrapper)).toEqual(['Is the power connected?', 'Is the stand level?'])
  })

  // The whole checklist rather than the API's default page of 20, and only
  // this checklist's.
  test('asks for every question of this checklist, not just the first page', async () => {
    await mountChecklistForm({pk: 3})

    const questions = sent('get').find((request) => request.path === '/api/checklist/checklist-question/')
    expect(questions.query).toEqual({checklist: '3', page: '1', page_size: '1000'})
  })

  test('writes only the questions that changed: one edited, one removed, one added', async () => {
    const wrapper = await mountChecklistForm({pk: 3})

    await type(wrapper, '#checklist_question-1', 'Is the stand level and secured?')
    await wrapper.findAll('.remove-question')[0].trigger('click')
    await addQuestion(wrapper, 'Are the lights on?')
    await submit(wrapper)

    expect(sent('patch').map(({ path, body }) => ({path, body}))).toEqual([
      {path: '/api/checklist/checklist/3/', body: {name: 'Delivery', norm: '', validity_months: null, archived: false}},
      {path: '/api/checklist/checklist-question/12/', body: {question: 'Is the stand level and secured?'}},
    ])
    expect(sent('post').map(({ path, body }) => ({path, body}))).toEqual([
      {path: '/api/checklist/checklist-question/', body: {checklist: 3, question: 'Are the lights on?'}},
    ])
    expect(sent('delete').map((request) => request.path)).toEqual(['/api/checklist/checklist-question/11/'])
    expect(toasts().map((toast) => toast.body)).toContain('Checklist has been updated')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('leaves untouched questions alone', async () => {
    const wrapper = await mountChecklistForm({pk: 3})

    await type(wrapper, '#checklist_name', 'Delivery v2')
    await submit(wrapper)

    expect(sent('patch').map((request) => request.path)).toEqual(['/api/checklist/checklist/3/'])
    expect(sent('post')).toEqual([])
    expect(sent('delete')).toEqual([])
  })

  test('tells the user when a question cannot be saved, and stays on the form', async () => {
    api.patch('/api/checklist/checklist-question/{id}/', serverError)
    const wrapper = await mountChecklistForm({pk: 3})

    await type(wrapper, '#checklist_question-0', 'Changed')
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error updating checklist')
    expect(routerGo()).not.toHaveBeenCalled()
    expect(questionTexts(wrapper)).toEqual(['Changed', 'Is the stand level?'])
  })

  // A refetch (a window focus, another screen's write) must not replace what
  // the user has typed since the form opened.
  test('keeps an unsaved edit when the questions are fetched again', async () => {
    const queryClient = createTestQueryClient()
    const wrapper = mountForm(ChecklistForm, {deep: true, routes: checklistRoutes, props: {pk: 3}, queryClient})
    await settle()

    await type(wrapper, '#checklist_question-0', 'Typed, not saved')
    // A different answer: an identical one is the same object to the query
    // cache, and would not reach the form at all.
    api.get('/api/checklist/checklist-question/', paginated([...QUESTIONS.results, question(30, 3, 'Added elsewhere')]))
    await queryClient.invalidateQueries()
    await settle()

    expect(sent('get').filter((request) => request.path === '/api/checklist/checklist-question/')).toHaveLength(2)
    expect(questionTexts(wrapper)).toEqual(['Typed, not saved', 'Is the stand level?'])
  })

  test('opens on the stored norm, validity and archived flag, and sends an emptied validity as null', async () => {
    api.get('/api/checklist/checklist/{id}/', fixtureFor(vChecklist, {
      id: 3, name: 'Delivery', norm: 'NEN 2767', validity_months: 12, archived: false,
    }))
    const wrapper = await mountChecklistForm({pk: 3})

    expect(wrapper.get('#checklist_norm').element.value).toBe('NEN 2767')
    expect(wrapper.get('#checklist_validity_months').element.value).toBe('12')
    expect(wrapper.get('#checklist_archived').element.checked).toBe(false)

    await type(wrapper, '#checklist_validity_months', '')
    await wrapper.get('#checklist_archived').setValue(true)
    await submit(wrapper)

    expect(sent('patch')[0]).toMatchObject({
      path: '/api/checklist/checklist/3/',
      body: {name: 'Delivery', norm: 'NEN 2767', validity_months: null, archived: true},
    })
  })

  test('tells the user when the questions cannot be fetched', async () => {
    api.get('/api/checklist/checklist-question/', serverError)

    await mountChecklistForm({pk: 3})

    expect(toasts().map((toast) => toast.body)).toContain('Error loading questions')
  })
})

describe('ChecklistForm, cancelling', () => {
  test('goes back without sending anything', async () => {
    const wrapper = await mountChecklistForm()

    await type(wrapper, '#checklist_name', 'Delivery')
    await addQuestion(wrapper, 'Is the stand level?')
    await wrapper.get('.modal-footer .btn-secondary').trigger('click')
    await settle()

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(sent('post')).toEqual([])
  })
})
