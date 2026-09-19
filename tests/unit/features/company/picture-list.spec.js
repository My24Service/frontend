import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { vPicture } from '@/api/valibot.gen'
import PictureList from '@/features/company/picture/PictureList.vue'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountListView, toastCreate, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({ create: toastCreate }),
}))

const api = installApiSeam()
const endpoint = '/api/company/picture/'

const routes = [
  { name: 'company-picture-add', path: '/company/pictures/form', component: { template: '<div />' } },
  { name: 'company-picture-edit', path: '/company/pictures/form/:pk', component: { template: '<div />' } },
]

function picture(overrides = {}) {
  return fixtureFor(vPicture, {
    id: 5,
    name: 'Warehouse',
    picture: 'https://example.com/media/warehouse.jpg',
    created: '01-01-2026',
    ...overrides,
  })
}

const bodies = () => toasts().map((toast) => toast.body)
const listRequests = () => api.requests().filter((request) => request.method === 'get' && request.path === endpoint)

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.get(endpoint, () => paginated([picture()], { count: 45 }))
  api.delete(endpoint + '{id}/', noContent)
})
afterEach(() => window.history.replaceState(null, '', '/'))

async function mountPictures(options = {}) {
  return mountListView(PictureList, {
    deep: true,
    routes,
    ...options,
  })
}

describe('PictureList', () => {
  test('loads page one and renders every column', async () => {
    const wrapper = await mountPictures()
    await settle()

    expect(listRequests()[0]).toMatchObject({ path: endpoint, query: { page: '1', page_size: '20' } })
    const body = wrapper.get('tbody').text()
    expect(body).toContain('Warehouse')
    expect(body).toContain('01-01-2026')
    expect(wrapper.get('tbody img').attributes('src')).toBe('https://example.com/media/warehouse.jpg')
    expect(wrapper.get('h3').text()).toContain('Pictures')
  })

  test('a picture without a file shows the placeholder', async () => {
    api.get(endpoint, () => paginated([picture({ picture: undefined })]))
    const wrapper = await mountPictures()
    await settle()

    expect(wrapper.get('tbody img').attributes('src')).toContain('no-img.png')
  })

  test('a sort click sorts the wire through the ordering allow-list', async () => {
    const wrapper = await mountPictures()
    await settle()

    await wrapper.get('th[aria-label="Sort by name"]').trigger('click')
    await settle()

    expect(listRequests().at(-1).query).toMatchObject({ ordering: 'name' })

    await wrapper.get('th[aria-label="Sort by created"]').trigger('click')
    await settle()

    expect(listRequests().at(-1).query).toMatchObject({ ordering: 'created' })
  })

  test('the picture and icons columns offer no sort', async () => {
    const wrapper = await mountPictures()
    await settle()

    // Ordering by the stored file's path is meaningless, and the endpoint's
    // allow-list has no such term - those columns stay non-sortable rather
    // than sending a parameter nothing honours.
    const labels = wrapper.findAll('th').map((th) => th.attributes('aria-label'))
    expect(labels).toContain('Sort by name')
    expect(labels).toContain('Sort by created')
    expect(labels).not.toContain('Sort by picture')
    expect(labels).not.toContain('Sort by icons')
  })

  test('a search term is debounced onto the wire', async () => {
    const wrapper = await mountPictures()
    await settle()

    await wrapper.get('input[aria-label="Search pictures"]').setValue('ware')
    await new Promise((resolve) => setTimeout(resolve, 350))
    await settle()

    expect(listRequests().at(-1).query).toMatchObject({ q: 'ware', page: '1' })
  })

  test('the thumbnail and the edit icon link to the edit route', async () => {
    const wrapper = await mountPictures()
    await settle()

    expect(wrapper.get('tbody a').attributes('href')).toBe('/company/pictures/form/5')
  })

  test('an empty list has an explicit empty state', async () => {
    api.get(endpoint, paginated([]))
    const wrapper = await mountPictures()
    await settle()

    expect(wrapper.get('tbody').text()).toContain('No pictures found')
  })

  test('a load failure tells the user', async () => {
    api.get(endpoint, serverError)
    await mountPictures()
    await settle()

    expect(bodies()).toContain('Error loading pictures')
  })
})

describe('PictureList row actions', () => {
  test('delete confirms, sends the row id and refetches', async () => {
    const wrapper = await mountPictures()
    await settle()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    expect(api.requests().filter((request) => request.method === 'delete')).toHaveLength(0)

    modal('delete-picture-modal').ok()
    await settle()

    expect(api.requests().find((request) => request.method === 'delete').path).toBe(endpoint + '5/')
    expect(listRequests()).toHaveLength(2)
    expect(bodies()).toContain('Picture has been deleted')
  })

  test('a failed delete keeps the row and reports it', async () => {
    api.delete(endpoint + '{id}/', serverError)
    const wrapper = await mountPictures()
    await settle()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-picture-modal').ok()
    await settle()

    expect(wrapper.get('tbody').text()).toContain('Warehouse')
    expect(bodies()).toContain('Error deleting picture')
  })
})
