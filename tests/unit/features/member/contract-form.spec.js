import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ContractForm } from '@/features/member'
import { vContract } from '@/api/valibot.gen'

import { fixtureFor } from '../../helpers/schema-fixture.js'
import { contract28, moduleData } from '../../fixtures/member-demo-tenant.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { memberRoutes } from '../../support/member-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

const MODULE_DATA = moduleData

const DETAIL = fixtureFor(vContract, contract28)

const STORED_PATHS = contract28.module_paths

beforeEach(() => {
  api.get('/api/member/get-module-data/', MODULE_DATA)
  api.get('/api/member/contract/{id}/', DETAIL)
  api.post('/api/member/contract/', DETAIL)
  api.patch('/api/member/contract/{id}/', DETAIL)
})

async function mountContractForm(props = {}) {
  const wrapper = mountForm(ContractForm, { deep: true, routes: memberRoutes, props })
  await settle()
  return wrapper
}

async function typeName(wrapper, value) {
  const field = wrapper.get('#contract_name')
  await field.setValue(value)
  await field.trigger('change')
}

async function tickPart(wrapper, partId, ticked = true) {
  await wrapper.get(`#el${partId}`).setValue(ticked)
}

async function tickModule(wrapper, moduleId, ticked = true) {
  await wrapper.get(`#module${moduleId}`).setValue(ticked)
}

function isTicked(wrapper, partId) {
  return wrapper.get(`#el${partId}`).element.checked
}

async function submit(wrapper) {
  await wrapper.get('.modal-footer .btn-primary').trigger('click')
  await settle()
  await wrapper.vm.$nextTick()
}

function nameRefused(wrapper) {
  return wrapper
    .findAll('.invalid-feedback')
    .filter((node) => node.text().includes('Please enter a name'))
    .some((node) => node.classes('d-block'))
}

describe('ContractForm, creating a contract', () => {
  test('opens on an empty form headed New contract', async () => {
    const wrapper = await mountContractForm()

    expect(wrapper.text()).toContain('New contract')
    expect(wrapper.get('#contract_name').element.value).toBe('')
  })

  test('offers every module and part the backend returned', async () => {
    const wrapper = await mountContractForm()

    expect(wrapper.text()).toContain('invoices')
    expect(wrapper.text()).toContain('webshop')
    expect(wrapper.text()).toContain('preliminary')
  })

  test('pre-ticks the always-selected parts and will not let them be unticked', async () => {
    const wrapper = await mountContractForm()

    expect(isTicked(wrapper, 255)).toBe(true)
    expect(wrapper.get('#el255').attributes('disabled')).toBeDefined()
    expect(isTicked(wrapper, 292)).toBe(false)
  })

  test('puts the create on the wire', async () => {
    const wrapper = await mountContractForm()

    await typeName(wrapper, 'new contract')
    await tickPart(wrapper, 246)
    await tickPart(wrapper, 294)
    await submit(wrapper)

    expect(api.requests()).toEqual([
      { method: 'get', path: '/api/member/get-module-data/', query: {} },
      {
        method: 'post',
        path: '/api/member/contract/',
        query: {},
        body: {
          name: 'new contract',
          module_paths: [
            {module: 1, parts: [246]},
            {module: 7, parts: [258, 255, 279, 259, 275, 256]},
            {module: 11, parts: [294]},
          ],
        },
      },
    ])
  })

  test('confirms the creation and goes back', async () => {
    const wrapper = await mountContractForm()

    await typeName(wrapper, 'Premium')
    await tickPart(wrapper, 292)
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('contract has been created')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('refuses a contract with no name, and sends nothing', async () => {
    const wrapper = await mountContractForm()

    await tickPart(wrapper, 292)
    await submit(wrapper)

    expect(nameRefused(wrapper)).toBe(true)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })

  test('tells the user when the create fails, and stays on the form', async () => {
    api.post('/api/member/contract/', serverError)
    const wrapper = await mountContractForm()

    await typeName(wrapper, 'Premium')
    await tickPart(wrapper, 292)
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error creating contract')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('ContractForm, editing a contract', () => {
  test('opens on the contract it was given, headed Edit contract', async () => {
    const wrapper = await mountContractForm({ pk: 28 })

    expect(wrapper.text()).toContain('Edit contract')
    expect(wrapper.get('#contract_name').element.value).toBe('My24Service Normal')
  })

  test('keeps the loading overlay up until the module tree arrives', async () => {
    let release
    api.get('/api/member/get-module-data/', () => new Promise((resolve) => { release = resolve }))

    const wrapper = mountForm(ContractForm, { deep: true, routes: memberRoutes })
    await settle()

    expect(wrapper.find('.b-overlay').exists()).toBe(true)

    release(MODULE_DATA)
    await settle()

    expect(wrapper.find('.b-overlay').exists()).toBe(false)
  })

  test('ticks the parts the stored contract names, and no others', async () => {
    const wrapper = await mountContractForm({ pk: 28 })

    expect(isTicked(wrapper, 294)).toBe(true)
    expect(isTicked(wrapper, 297)).toBe(true)
    expect(isTicked(wrapper, 292)).toBe(false)
  })

  test('puts the update on the wire, lossless except the declared delta', async () => {
    const wrapper = await mountContractForm({ pk: 28 })

    await submit(wrapper)

    expect(api.requests()).toEqual([
      { method: 'get', path: '/api/member/get-module-data/', query: {} },
      { method: 'get', path: '/api/member/contract/28/', query: {} },
      {
        method: 'patch',
        path: '/api/member/contract/28/',
        query: {},
        body: {
          name: 'My24Service Normal',
          module_paths: STORED_PATHS,
        },
      },
      // The write staled every read of the resource, its own detail included:
      // the form is still mounted when it invalidates, so the record refetches
      // before the form leaves.
      { method: 'get', path: '/api/member/contract/28/', query: {} },
    ])
  })

  test('confirms the update and goes back', async () => {
    const wrapper = await mountContractForm({ pk: 28 })

    await tickPart(wrapper, 292)
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('contract has been updated')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('tells the user when the contract cannot be fetched', async () => {
    api.get('/api/member/contract/{id}/', serverError)

    await mountContractForm({ pk: 28 })

    expect(toasts().map((toast) => toast.body)).toContain('Error fetching contract')
  })

  test('tells the user when the update fails, and stays on the form', async () => {
    api.patch('/api/member/contract/{id}/', serverError)
    const wrapper = await mountContractForm({ pk: 28 })

    await tickPart(wrapper, 292)
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error updating contract')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('ContractForm, the module-level checkbox', () => {
  test('reads checked only once every part of the module is selected', async () => {
    const wrapper = await mountContractForm()

    expect(wrapper.get('#module1').element.checked).toBe(false)

    await tickPart(wrapper, 246)
    expect(wrapper.get('#module1').element.checked).toBe(false)

    await tickModule(wrapper, 1)
    expect(wrapper.get('#module1').element.checked).toBe(true)
  })

  test('switching it on puts every part of the module on the wire', async () => {
    const wrapper = await mountContractForm()

    await typeName(wrapper, 'new contract')
    await tickModule(wrapper, 9)
    await submit(wrapper)

    const rows = api.requests().find((sent) => sent.method === 'post').body.module_paths
    expect(rows).toHaveLength(2)
    expect(rows).toContainEqual({module: 9, parts: [291]})
    expect(rows).toContainEqual({module: 7, parts: [258, 255, 279, 259, 275, 256]})
  })

  test('switching it off keeps only the always-selected parts', async () => {
    const wrapper = await mountContractForm()

    await typeName(wrapper, 'new contract')
    await tickModule(wrapper, 7)
    await tickModule(wrapper, 7, false)
    await tickPart(wrapper, 246)
    await submit(wrapper)

    const post = api.requests().find((sent) => sent.method === 'post')
    expect(post.body.module_paths).toEqual([
      {module: 1, parts: [246]},
      {module: 7, parts: [258, 255, 279, 259, 275, 256]},
    ])
  })
})

describe('ContractForm, cancelling', () => {  test('goes back without sending anything', async () => {
    const wrapper = await mountContractForm()

    await typeName(wrapper, 'Premium')
    await wrapper.get('.modal-footer .btn-secondary').trigger('click')
    await settle()

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })
})
