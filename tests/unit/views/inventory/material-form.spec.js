import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import materialService from '@/models/inventory/Material.js'
import supplierModel from '@/models/inventory/Supplier'

import MaterialForm from '@/views/inventory/MaterialForm.vue'

import {
  installFakeClients,
  mountForm,
  restoreClients,
  routerGo,
  toastCreate,
  toastTitles,
  urls,
} from '../../support/form-harness.js'

// CHARACTERISATION TESTS.
//
// These describe what MaterialForm does *today*, before the payload shaping in
// submitForm moves to the model layer. The contract they pin down is which
// fields reach the API for a given form state - in particular when the image
// field is sent and when it is dropped, which is the whole point of the
// refactor that follows.

vi.mock('bootstrap-vue-next', async () => {
  const { toastCreate: create } = await import('../../support/form-harness.js')
  return { useToast: () => ({ create }) }
})

const models = [materialService, supplierModel]

const DETAIL = {
  id: 42,
  name: 'Widget',
  supplier_relation: 3,
  supplier_name: 'ACME',
  image: 'https://example.test/media/widget.png',
}

let http

function mount(props = {}, stubs = {}) {
  return mountForm(MaterialForm, { props, stubs })
}

/** A data URI, the shape imageSelected() puts into material.image. */
const UPLOAD = 'data:image/png;base64,AAAA'

beforeEach(() => {
  http = installFakeClients(models)
  http.get.mockImplementation((url) => {
    if (url === '/get-csrf-token/') {
      return Promise.resolve({ data: { token: 'csrf-token' } })
    }
    if (url === '/inventory/material/42/') {
      return Promise.resolve({ data: { ...DETAIL } })
    }
    // supplierModel.search() returns a bare array.
    return Promise.resolve({ data: [] })
  })
  toastCreate.mockClear()
})

afterEach(() => {
  restoreClients()
})

describe('MaterialForm - create', () => {
  test('posts the material and navigates back', async () => {
    const wrapper = mount()
    await wrapper.vm.$nextTick()

    wrapper.vm.material.name = 'Widget'

    await wrapper.vm.submitForm()

    expect(urls('post')).toEqual(['/inventory/material/'])
    const [, payload] = http.post.mock.calls[0]
    expect(payload).toMatchObject({ name: 'Widget' })

    expect(toastTitles()).toEqual(['Created'])
    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(wrapper.vm.buttonDisabled).toBe(false)
    expect(wrapper.vm.isLoading).toBe(false)
  })

  test('drops a null image rather than sending it', async () => {
    const wrapper = mount()
    await wrapper.vm.$nextTick()

    wrapper.vm.material.name = 'Widget'
    wrapper.vm.material.image = null

    await wrapper.vm.submitForm()

    const [, payload] = http.post.mock.calls[0]
    expect(payload).not.toHaveProperty('image')
  })

  test('sends a newly picked image', async () => {
    const wrapper = mount()
    await wrapper.vm.$nextTick()

    wrapper.vm.material.name = 'Widget'
    wrapper.vm.material.image = UPLOAD

    await wrapper.vm.submitForm()

    const [, payload] = http.post.mock.calls[0]
    expect(payload.image).toBe(UPLOAD)
  })

  test('sends nothing when the name is missing', async () => {
    const wrapper = mount()
    await wrapper.vm.$nextTick()

    wrapper.vm.material.name = ''

    await wrapper.vm.submitForm()

    expect(http.post).not.toHaveBeenCalled()
    expect(routerGo()).not.toHaveBeenCalled()
  })

  test('does not navigate when the post fails', async () => {
    http.post.mockRejectedValueOnce(new Error('boom'))

    const wrapper = mount()
    await wrapper.vm.$nextTick()

    wrapper.vm.material.name = 'Widget'

    await wrapper.vm.submitForm()

    expect(toastTitles()).toEqual(['Error'])
    expect(routerGo()).not.toHaveBeenCalled()
    expect(wrapper.vm.buttonDisabled).toBe(false)
    expect(wrapper.vm.isLoading).toBe(false)
  })

  test('selectSupplier copies the supplier id and name onto the material', async () => {
    const wrapper = mount()
    await wrapper.vm.$nextTick()

    wrapper.vm.selectSupplier({ id: 3, name: 'ACME' })

    expect(wrapper.vm.material.supplier_relation).toBe(3)
    expect(wrapper.vm.material.supplier_name).toBe('ACME')
  })
})

describe('MaterialForm - edit', () => {
  async function readyEdit() {
    const wrapper = mount({ pk: 42 })
    await vi.waitFor(() => expect(wrapper.vm.material.name).toBe('Widget'))
    return wrapper
  }

  test('loads the material and shows its image', async () => {
    const wrapper = await readyEdit()

    expect(wrapper.vm.material).toMatchObject({ id: 42, supplier_name: 'ACME' })
    expect(wrapper.vm.current_image).toBe(DETAIL.image)
  })

  test('patches the material and navigates back', async () => {
    const wrapper = await readyEdit()

    wrapper.vm.material.name = 'Gadget'
    await wrapper.vm.submitForm()

    expect(urls('patch')).toEqual(['/inventory/material/42/'])
    const [, payload] = http.patch.mock.calls[0]
    expect(payload).toMatchObject({ id: 42, name: 'Gadget' })

    expect(toastTitles()).toEqual(['Updated'])
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  // The image comes back from the detail endpoint as a URL. Sending that URL
  // back would be wrong, so an unchanged image is left out of the payload
  // entirely; only a freshly picked file is uploaded.
  test('does not send the existing image URL back', async () => {
    const wrapper = await readyEdit()

    await wrapper.vm.submitForm()

    const [, payload] = http.patch.mock.calls[0]
    expect(payload).not.toHaveProperty('image')
  })

  test('sends the image when the user picked a new file', async () => {
    const wrapper = await readyEdit()

    // What imageSelected() does: replace the URL with the file's data URI.
    wrapper.vm.material.image = UPLOAD

    await wrapper.vm.submitForm()

    const [, payload] = http.patch.mock.calls[0]
    expect(payload.image).toBe(UPLOAD)
  })

  test('does not navigate when the patch fails', async () => {
    const wrapper = await readyEdit()

    http.patch.mockRejectedValueOnce(new Error('boom'))
    await wrapper.vm.submitForm()

    expect(toastTitles()).toEqual(['Error'])
    expect(routerGo()).not.toHaveBeenCalled()
    expect(wrapper.vm.buttonDisabled).toBe(false)
    expect(wrapper.vm.isLoading).toBe(false)
  })
})
