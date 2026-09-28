import { beforeEach, describe, expect, test, vi } from 'vitest'

import MaterialForm from '@/views/inventory/MaterialForm.vue'
import {
  vInventoryMaterialCreateResponse,
  vInventoryMaterialPartialUpdateResponse,
  vMaterial,
} from '@/api/valibot.gen'

import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toastCreate, toastTitles } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'

// CHARACTERISATION TESTS.
//
// These describe what MaterialForm does *today*, before the payload shaping in
// submitForm moves to the model layer. The contract they pin down is which
// fields reach the API for a given form state - in particular when the image
// field is sent and when it is dropped, which is the whole point of the
// refactor that follows.

const api = installApiSeam()

const DETAIL = {
  id: 42,
  name: 'Widget',
  supplier_relation: 3,
  supplier_name: 'ACME',
  image: 'https://example.test/media/widget.png',
}

function mount(props = {}, stubs = {}) {
  return mountForm(MaterialForm, { props, stubs })
}

/** A data URI, the shape imageSelected() puts into material.image. */
const UPLOAD = 'data:image/png;base64,AAAA'

beforeEach(() => {
  api.get('/api/inventory/material/{id}/', fixtureFor(vMaterial, DETAIL))
  // The supplier picker searches on mount.
  api.get('/api/inventory/supplier/autocomplete/', [])
  api.post('/api/inventory/material/', fixtureFor(vInventoryMaterialCreateResponse, { id: 100 }))
  api.patch('/api/inventory/material/{id}/', fixtureFor(vInventoryMaterialPartialUpdateResponse, DETAIL))
  toastCreate.mockClear()
})

/** The paths and bodies of the requests made with `method`, in order. */
const sent = (method) => api.requests().filter((request) => request.method === method)
const payloadOf = (method) => sent(method)[0]?.body

/** Submit, and let the write and whatever follows it land. */
async function submit(wrapper) {
  await wrapper.vm.submitForm()
  await settle()
}

describe('MaterialForm - create', () => {
  test('posts the material and navigates back', async () => {
    const wrapper = mount()
    await settle()

    wrapper.vm.material.name = 'Widget'

    await submit(wrapper)

    expect(sent('post').map(({ path }) => path)).toEqual(['/api/inventory/material/'])
    const payload = payloadOf('post')
    expect(payload).toMatchObject({ name: 'Widget' })

    expect(toastTitles()).toEqual(['Created'])
    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(wrapper.vm.buttonDisabled).toBe(false)
    expect(wrapper.vm.isLoading).toBe(false)
  })

  test('drops a null image rather than sending it', async () => {
    const wrapper = mount()
    await settle()

    wrapper.vm.material.name = 'Widget'
    wrapper.vm.material.image = null

    await submit(wrapper)

    const payload = payloadOf('post')
    expect(payload).not.toHaveProperty('image')
  })

  test('sends a newly picked image', async () => {
    const wrapper = mount()
    await settle()

    wrapper.vm.material.name = 'Widget'
    wrapper.vm.material.image = UPLOAD

    await submit(wrapper)

    const payload = payloadOf('post')
    expect(payload.image).toBe(UPLOAD)
  })

  test('sends nothing when the name is missing', async () => {
    const wrapper = mount()
    await settle()

    wrapper.vm.material.name = ''

    await submit(wrapper)

    expect(sent('post')).toEqual([])
    expect(routerGo()).not.toHaveBeenCalled()
  })

  test('does not navigate when the post fails', async () => {
    api.post('/api/inventory/material/', serverError)

    const wrapper = mount()
    await settle()

    wrapper.vm.material.name = 'Widget'

    await submit(wrapper)

    expect(toastTitles()).toEqual(['Error'])
    expect(routerGo()).not.toHaveBeenCalled()
    expect(wrapper.vm.buttonDisabled).toBe(false)
    expect(wrapper.vm.isLoading).toBe(false)
  })

  test('selectSupplier copies the supplier id and name onto the material', async () => {
    const wrapper = mount()
    await settle()

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
    await submit(wrapper)

    expect(sent('patch').map(({ path }) => path)).toEqual(['/api/inventory/material/42/'])
    const payload = payloadOf('patch')
    expect(payload).toMatchObject({ id: 42, name: 'Gadget' })

    expect(toastTitles()).toEqual(['Updated'])
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  // The image comes back from the detail endpoint as a URL. Sending that URL
  // back would be wrong, so an unchanged image is left out of the payload
  // entirely; only a freshly picked file is uploaded.
  test('does not send the existing image URL back', async () => {
    const wrapper = await readyEdit()

    await submit(wrapper)

    const payload = payloadOf('patch')
    expect(payload).not.toHaveProperty('image')
  })

  test('sends the image when the user picked a new file', async () => {
    const wrapper = await readyEdit()

    // What imageSelected() does: replace the URL with the file's data URI.
    wrapper.vm.material.image = UPLOAD

    await submit(wrapper)

    const payload = payloadOf('patch')
    expect(payload.image).toBe(UPLOAD)
  })

  test('does not navigate when the patch fails', async () => {
    const wrapper = await readyEdit()

    api.patch('/api/inventory/material/{id}/', serverError)
    await submit(wrapper)

    expect(toastTitles()).toEqual(['Error'])
    expect(routerGo()).not.toHaveBeenCalled()
    expect(wrapper.vm.buttonDisabled).toBe(false)
    expect(wrapper.vm.isLoading).toBe(false)
  })
})
