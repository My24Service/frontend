import { beforeEach, describe, expect, test, vi } from 'vitest'

import ApiUserList from '@/features/user/api/ApiUserList.vue'
import { vPaginatedApiUserList } from '@/api/valibot.gen'

import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountListView, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'
import { userRoutes } from '../../support/user-routes.js'

/**
 * Behaviour characterisation for the API-user list screen
 * (src/views/company/UserApiList.vue), written BEFORE the user-slice
 * refactor. Everything here pins current behaviour; the converted screen
 * must reproduce it except where the ticket ledger declares otherwise.
 *
 * Seams under test: the initial fetch, the rendered rows and links, the token
 * cell (token text, Active/Revoke/Valid-until vs Revoked), the copy and revoke
 * flows, the search flow, the delete flow, the toasts, and the role gate on
 * the add link. The fake sits below the HTTP client, so these specs record
 * the request that would go on the wire.
 */

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

const ITEM = itemSchemaOf(vPaginatedApiUserList)

function apiRow(overrides = {}) {
  return fixtureFor(ITEM, {
    id: 41,
    username: 'api-jan',
    api_user: {
      uuid: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Jan integration',
      token: 'tok-active-1',
      expire_start_dt: '2026-01-01T00:00:00Z',
      expire_in_days: 30,
      token_is_revoked: false,
    },
    ...overrides,
  })
}

function revokedRow(overrides = {}) {
  return apiRow({
    id: 42,
    username: 'api-piet',
    api_user: {
      uuid: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Piet integration',
      token: 'tok-revoked-2',
      expire_start_dt: '2026-02-01T00:00:00Z',
      expire_in_days: 30,
      token_is_revoked: true,
    },
    ...overrides,
  })
}

function apiPage({ count = 30 } = {}) {
  return paginated([apiRow(), revokedRow()], { count })
}

async function pastDebounce() {
  await new Promise((resolve) => setTimeout(resolve, 350))
  await settle()
}

beforeEach(() => {
  api.get('/api/company/apiuser/', apiPage())
  api.post('/api/company/apiuser/{id}/revoke/', { success: true })
  api.delete('/api/company/apiuser/{id}/', noContent)
})

/** Mount the converted list. */
async function mountApiUserList({ query = {}, auth = {} } = {}) {
  const wrapper = await mountListView(ApiUserList, { deep: true, routes: userRoutes, query, auth })
  await settle()
  return wrapper
}

/** The text of every body row, one string per row. */
function rowTexts(wrapper) {
  return wrapper.findAll('tbody tr').map((row) => row.text())
}

function revokeButtons(wrapper) {
  return wrapper.findAll('button').filter((button) => button.text() === 'Revoke')
}

describe('ApiUserList, wire contract', () => {
  test('the initial load sends the page and the page size, and nothing else', async () => {
    await mountApiUserList()

    expect(api.requests().at(-1)).toMatchObject({
      path: '/api/company/apiuser/',
      query: { page: '1', page_size: '20' },
    })
  })

  test('shows a row for every API user the backend returned', async () => {
    const wrapper = await mountApiUserList()

    expect(rowTexts(wrapper).length).toBe(2)
    expect(rowTexts(wrapper)[0]).toContain('api-jan')
    expect(rowTexts(wrapper)[0]).toContain('Jan integration')
  })

  test('links each username to that API user’s edit page', async () => {
    const wrapper = await mountApiUserList()

    const hrefs = wrapper.findAll('tbody a').map((link) => link.attributes('href'))
    expect(hrefs).toContain('/company/api-users/form/41')
    expect(hrefs).toContain('/company/api-users/form/42')
  })

  test('the add link shows for staff and superusers only', async () => {
    const staff = await mountApiUserList({ auth: { isStaff: true } })
    expect(staff.find('a[href="/company/api-users/form"]').exists()).toBe(true)

    const plain = await mountApiUserList({ auth: { isStaff: false, isSuperuser: false } })
    expect(plain.find('a[href="/company/api-users/form"]').exists()).toBe(false)
  })

  test('columns are not sortable — the endpoint declares no ordering parameter', async () => {
    // Same declared-contract finding as the sales/planning/customer lists:
    // only page/page_size/q ride the wire, so the columns stay non-sortable.
    const wrapper = await mountApiUserList()

    expect(wrapper.find('th[aria-label^="Sort by"]').exists()).toBe(false)
    expect(wrapper.find('.sortable-header').exists()).toBe(false)
  })
})

describe('ApiUserList token lifecycle', () => {
  test('shows the token on each row', async () => {
    const wrapper = await mountApiUserList()

    expect(wrapper.text()).toContain('tok-active-1')
    expect(wrapper.text()).toContain('tok-revoked-2')
  })

  test('an active key offers Revoke and its validity window', async () => {
    const wrapper = await mountApiUserList()

    expect(rowTexts(wrapper)[0]).toContain('Active')
    // 2026-01-01 plus 30 days, as the legacy list computed it.
    expect(rowTexts(wrapper)[0]).toContain('Valid until: 31/01/2026')
  })

  test('a revoked key says Revoked and offers no Revoke', async () => {
    const wrapper = await mountApiUserList()

    expect(rowTexts(wrapper)[1]).toContain('Revoked')
    expect(revokeButtons(wrapper)).toHaveLength(1)
  })

  test('copies the token and tells the user', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, writable: true, value: { writeText } })
    try {
      const wrapper = await mountApiUserList()

      const copy = wrapper.findAll('button').find((button) => button.text() === 'Copy')
      await copy.trigger('click')
      await settle()

      expect(writeText).toHaveBeenCalledWith('tok-active-1')
      expect(toasts().map((toast) => toast.body)).toContain('Token copied to clipboard')
    } finally {
      delete navigator.clipboard
    }
  })

  test('revokes through the confirmation modal and refetches', async () => {
    const wrapper = await mountApiUserList()

    await revokeButtons(wrapper)[0].trigger('click')
    await settle()
    modal('revoke-api-user-modal').ok()
    await settle()

    const revoked = api.requests().filter((sent) => sent.method === 'post')
    expect(revoked).toHaveLength(1)
    expect(revoked[0]).toMatchObject({ path: '/api/company/apiuser/41/revoke/' })
    expect(toasts().map((toast) => toast.body)).toContain('API key has been revoked')
    const listFetches = api.requests().filter((sent) => sent.method === 'get')
    expect(listFetches.length).toBeGreaterThan(1)
  })

  test('does not revoke anything until the confirmation is accepted', async () => {
    const wrapper = await mountApiUserList()

    await revokeButtons(wrapper)[0].trigger('click')
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })

  test('tells the user when the revoke fails', async () => {
    api.post('/api/company/apiuser/{id}/revoke/', serverError)
    const wrapper = await mountApiUserList()

    await revokeButtons(wrapper)[0].trigger('click')
    await settle()
    modal('revoke-api-user-modal').ok()
    await settle()

    expect(toasts().map((toast) => toast.body)).toContain('Error revoking API key')
  })
})

describe('ApiUserList search and pagination', () => {
  test('the toolbar search commits the term to the wire', async () => {
    const wrapper = await mountApiUserList()

    await wrapper.get('input[aria-label="Search API users"]').setValue('jan')
    await pastDebounce()

    expect(api.requests().at(-1).query).toMatchObject({ q: 'jan' })
  })

  test('the next-page button asks for page two', async () => {
    const wrapper = await mountApiUserList()

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({ page: '2', page_size: '20' })
  })
})

describe('ApiUserList loading, empty and error states', () => {
  test('says so when the backend returned nothing', async () => {
    api.get('/api/company/apiuser/', paginated([]))
    const wrapper = await mountApiUserList()

    expect(wrapper.text()).toContain('No API users found')
  })

  test('tells the user when the list cannot be loaded', async () => {
    api.get('/api/company/apiuser/', serverError)

    await mountApiUserList()

    expect(toasts().map((toast) => toast.body)).toContain('Error loading API users')
  })
})

describe('ApiUserList delete', () => {
  test('deletes through the confirmation modal and refetches', async () => {
    const wrapper = await mountApiUserList()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-api-user-modal').ok()
    await settle()

    const deleteSent = api.requests().find((sent) => sent.method === 'delete')
    expect(deleteSent).toMatchObject({ path: '/api/company/apiuser/41/' })
    expect(toasts().map((toast) => toast.body)).toContain('API user has been deleted')
    const listFetches = api.requests().filter((sent) => sent.method === 'get')
    expect(listFetches.length).toBeGreaterThan(1)
  })

  test('does not delete anything until the confirmation is accepted', async () => {
    const wrapper = await mountApiUserList()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'delete')).toEqual([])
  })
})
