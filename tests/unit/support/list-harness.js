import { beforeEach } from 'vitest'
import { HttpResponse } from 'msw'

import { settle } from './api-seam/index.js'
import { mountListView } from './form-harness.js'
import { memberRoutes } from './member-routes.js'

/**
 * What the four Member-Slice list screens have in common, and the two traps
 * that make a list spec pass while measuring nothing.
 *
 * **The model is a module-level singleton.** `moduleModel`, `contractModel` and
 * `modulePartModel` are one object each, shared by the component under test and
 * by every other test in the file — and `currentPage`, `searchQuery` and
 * `listArgs` live on it. A test that searches leaves `q` set for the next one,
 * so a spec asserting an *unfiltered* initial load passes only because it ran
 * first. `resetModel` in a `beforeEach` is not optional.
 *
 * **A page change is a remount, not a re-render.** The list views read
 * `$route.query.page` in `created()` and never watch the route; what makes
 * pagination work in the application is `:key="$route.fullPath"` on the
 * `<router-view>` in TheAppLayout, which throws the component away and builds a
 * new one. So the honest way to spec page two is to mount *at* page two —
 * `mountList({ page: '2' })` — and the click on the pagination control is a
 * separate claim: that it asks the router for the right query. Asserting the
 * click alone would prove nothing about the request, and asserting the request
 * without the click would prove nothing about the control.
 */

/** Give a list model back the state a fresh page load would give it. */
export function resetModel(model) {
  model.currentPage = 1
  model.searchQuery = null
  model.userFilter = null
  model.sort = null
  model.since = null
  model.sortField = null
  model.sortOrder = 'asc'
  model.count = 0
  model.numPages = 0
  model.resetListArgs()
}

/** Reset `model` before every test in the file. */
export function useFreshModel(model) {
  beforeEach(() => resetModel(model))
}

/**
 * Mount a list view at `query`, with the member routes its links need, and let
 * `created()` settle.
 *
 * `deep: true` throughout: the search field, the pagination buttons and the row
 * delete icons all have to be real DOM for a spec to click them, and b-overlay
 * must never be stubbed. See form-harness.js.
 */
export async function mountList(component, { query = {}, props = {}, auth = {} } = {}) {
  const wrapper = await mountListView(component, {
    deep: true,
    routes: memberRoutes,
    query,
    props,
    auth,
  })
  await settle()
  return wrapper
}

/** Open the search modal by clicking the toolbar's search button. */
export async function openSearch(wrapper) {
  await wrapper.get('button[title="Search"]').trigger('click')
  await settle()
}

/** Open the delete confirmation for the first row by clicking its bin icon. */
export async function openDelete(wrapper) {
  await wrapper.get('button[title="Delete"]').trigger('click')
  await settle()
}

/** Click the pagination control for a given page number. */
export async function goToPage(wrapper, page) {
  await wrapper.get(`button[aria-label="Go to page ${page}"]`).trigger('click')
  await settle()
}

/** The text of every body row, one string per row. */
export function rowTexts(wrapper) {
  return wrapper.findAll('tbody tr').map((row) => row.text())
}

/** A 500 from the backend, for the load- and delete-failure paths. */
export function serverError() {
  return new HttpResponse(JSON.stringify({ detail: 'boom' }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  })
}
