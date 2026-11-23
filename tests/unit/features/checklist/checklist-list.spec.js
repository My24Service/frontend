import { beforeEach, describe, expect, test } from 'vitest'

import { ChecklistList } from '@/features/checklist'
import { vPaginatedChecklistList } from '@/api/valibot.gen'

import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { checklistRoutes } from '../../support/checklist-routes.js'
import { mountListView, toasts } from '../../support/form-harness.js'
import { rowTexts, serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'

const api = installApiSeam()

const ITEM = itemSchemaOf(vPaginatedChecklistList)

const CHECKLISTS = paginated([
  fixtureFor(ITEM, {id: 3, name: 'Delivery'}),
  fixtureFor(ITEM, {id: 4, name: 'Pick-up'}),
])

async function mountChecklists() {
  const wrapper = await mountListView(ChecklistList, {deep: true, routes: checklistRoutes})
  await settle()
  return wrapper
}

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.get('/api/checklist/checklist/', CHECKLISTS)
  api.delete('/api/checklist/checklist/{id}/', noContent)
})

describe('ChecklistList', () => {
  test('the initial load sends the page and the page size, and nothing else', async () => {
    await mountChecklists()

    expect(api.requests().at(-1)).toMatchObject({
      path: '/api/checklist/checklist/',
      query: {page: '1', page_size: '20'},
    })
  })

  test('shows a row for every checklist the backend returned', async () => {
    const wrapper = await mountChecklists()

    expect(rowTexts(wrapper)).toHaveLength(2)
    expect(rowTexts(wrapper)[0]).toContain('Delivery')
    expect(rowTexts(wrapper)[1]).toContain('Pick-up')
  })

  // The endpoint declares neither `q` nor `ordering`, so a control for either
  // would send a parameter the API ignores.
  test('offers no search and no sorting', async () => {
    const wrapper = await mountChecklists()

    expect(wrapper.find('button[title="Search"]').exists()).toBe(false)
    expect(wrapper.find('th[aria-label="Sort by name"]').exists()).toBe(false)
  })

  test('links to the add form', async () => {
    const wrapper = await mountChecklists()

    expect(wrapper.get('a.btn').attributes('href')).toBe('/settings/checklists/form')
  })

  test('tells the user when the list cannot be loaded', async () => {
    api.get('/api/checklist/checklist/', serverError)

    await mountChecklists()

    expect(toasts().map((toast) => toast.body)).toContain('Error loading checklists')
  })

  test('deletes through the confirmation modal and refetches', async () => {
    const wrapper = await mountChecklists()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    expect(api.requests().filter((sent) => sent.method === 'delete')).toEqual([])

    modal('delete-checklist-modal').ok()
    await settle()

    expect(api.requests().find((sent) => sent.method === 'delete')).toMatchObject({
      path: '/api/checklist/checklist/3/',
    })
    expect(toasts().map((toast) => toast.body)).toContain('Checklist has been deleted')
    expect(api.requests().filter((sent) => sent.method === 'get').length).toBeGreaterThan(1)
  })
})
