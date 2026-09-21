import { beforeEach, describe, expect, test, vi } from 'vitest'
import { vPicture } from '@/api/valibot.gen'
import { PictureForm } from '@/features/company'
import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: spy } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: spy }) }
})

const api = installApiSeam()

const PICTURE_PATH = '/api/company/picture/'

/** A stored picture: its `picture` is the response URL, not base64. */
const PICTURE = fixtureFor(vPicture, {
  id: 31,
  name: 'Warehouse',
  picture: 'https://example.com/media/warehouse.jpg',
  created: '01-01-2026',
})

const bodies = () => toasts().map((toast) => toast.body)
// Paths carry the id (`/api/company/picture/31/`), so a write is picked by
// method, not by the collection path.
const writes = () => api.requests()
  .filter((request) => ['post', 'patch'].includes(request.method))

/** Let every request a submit sets off come back. */
async function drain(wrapper) {
  for (let i = 0; i < 4; i++) {
    await settle()
    await wrapper.vm.$nextTick()
  }
}

async function click(wrapper, label) {
  await wrapper.findAll('button').find((button) => button.text() === label).trigger('click')
  await drain(wrapper)
}

/** Pick a file the way the browser's picker does: a `change` event. */
async function chooseFile(wrapper, name = 'warehouse.png') {
  const input = wrapper.get('input[type="file"]')
  const file = new File(['fake-png-bytes'], name, { type: 'image/png' })
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
  await drain(wrapper)
}

function previewSrc(wrapper, heading) {
  const h3 = wrapper.findAll('h3').find((h) => h.text() === heading)
  return h3.element.parentElement.querySelector('img').getAttribute('src')
}

beforeEach(() => {
  api.get('/api/company/picture/{id}/', PICTURE)
  api.post(PICTURE_PATH, ({ body }) => fixtureFor(vPicture, { id: 32, ...body }))
  api.patch('/api/company/picture/{id}/', ({ body }) => fixtureFor(vPicture, { id: 31, ...body }))
})

function mountPicture(options = {}) {
  return mountForm(PictureForm, {
    deep: true,
    props: { pk: null },
    ...options,
  })
}

describe('PictureForm create', () => {
  test('an empty name blocks the submit', async () => {
    const wrapper = mountPicture()
    await settle()

    await click(wrapper, 'Submit')

    expect(wrapper.text()).toContain('Please enter a name')
    expect(writes()).toHaveLength(0)
  })

  test('a name alone creates with no picture key', async () => {
    const wrapper = mountPicture()
    await settle()

    await wrapper.get('#picture_name').setValue('Warehouse')
    await click(wrapper, 'Submit')

    const post = writes().find((request) => request.method === 'post')
    expect(post.body).toEqual({ name: 'Warehouse' })
    expect(bodies()).toContain('Picture has been created')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a picked file previews and rides the body as base64', async () => {
    const wrapper = mountPicture()
    await settle()

    await wrapper.get('#picture_name').setValue('Warehouse')
    await chooseFile(wrapper)

    // The user sees what they picked before they save it.
    expect(previewSrc(wrapper, 'Upload preview')).toMatch(/^data:image\/png;base64,/)
    await click(wrapper, 'Submit')

    const post = writes().find((request) => request.method === 'post')
    expect(post.body.name).toBe('Warehouse')
    expect(post.body.picture).toMatch(/^data:image\/png;base64,/)
    expect(bodies()).toContain('Picture has been created')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a failed create keeps the form and reports it', async () => {
    api.post(PICTURE_PATH, serverError)
    const wrapper = mountPicture()
    await settle()

    await wrapper.get('#picture_name').setValue('Warehouse')
    await click(wrapper, 'Submit')

    expect(bodies()).toContain('Error creating picture')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('PictureForm edit', () => {
  test('the record fills the name and shows its stored image', async () => {
    const wrapper = mountPicture({ props: { pk: 31 } })
    await settle()

    expect(wrapper.get('#picture_name').element.value).toBe('Warehouse')
    expect(previewSrc(wrapper, 'Current image')).toBe('https://example.com/media/warehouse.jpg')
  })

  test('saving without a new file sends no picture key', async () => {
    const wrapper = mountPicture({ props: { pk: 31 } })
    await settle()

    // The record's own `picture` is a URL the write endpoint rejects with a
    // 400; the legacy form sent it back on every rename. An absent PATCH key
    // leaves the stored file unchanged.
    await wrapper.get('#picture_name').setValue('Warehouse, renamed')
    await click(wrapper, 'Submit')

    const patch = writes().find((request) => request.method === 'patch')
    expect(patch.body).toEqual({ name: 'Warehouse, renamed' })
    expect(bodies()).toContain('Picture has been updated')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a picked file replaces the stored image', async () => {
    const wrapper = mountPicture({ props: { pk: 31 } })
    await settle()

    await chooseFile(wrapper)
    await click(wrapper, 'Submit')

    const patch = writes().find((request) => request.method === 'patch')
    expect(patch.body.name).toBe('Warehouse')
    expect(patch.body.picture).toMatch(/^data:image\/png;base64,/)
    expect(bodies()).toContain('Picture has been updated')
  })

  test('clearing the name blocks the submit on an edit too', async () => {
    const wrapper = mountPicture({ props: { pk: 31 } })
    await settle()

    // This form saves a whole picture, never a partial body, so the name the
    // generated patch body leaves optional is required here.
    await wrapper.get('#picture_name').setValue('')
    await click(wrapper, 'Submit')

    expect(wrapper.text()).toContain('Please enter a name')
    expect(writes()).toHaveLength(0)
  })

  test('a failed load tells the user', async () => {
    api.get('/api/company/picture/{id}/', serverError)
    mountPicture({ props: { pk: 31 } })
    await settle()

    expect(bodies()).toContain('Error fetching picture')
  })
})
