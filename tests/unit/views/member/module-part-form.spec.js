import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import modulePartModel from '@/models/member/ModulePart.js'
import moduleModel from '@/models/member/Module.js'

import ModulePartForm from '@/views/member/ModulePartForm.vue'

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
// These describe what ModulePartForm does *today*, before the module dropdown
// transform moves to the model layer and the component is converted to
// <script setup>. The contract they pin down is the HTTP traffic a given form
// state produces, plus the shape of the `modules` select options, which is the
// piece the refactor moves.
//
// Do not "fix" a failing expectation here during the refactor without deciding
// deliberately that the behaviour is meant to change.

// vi.mock is hoisted and scoped per module, so the mock itself has to live here;
// it points at the harness's shared spy.
vi.mock('bootstrap-vue-next', async () => {
  const { toastCreate: create } = await import('../../support/form-harness.js')
  return { useToast: () => ({ create }) }
})

const models = [modulePartModel, moduleModel]

const MODULES = [
  { id: 1, name: 'Planning' },
  { id: 2, name: 'Invoicing' },
]

const DETAIL = {
  id: 42,
  name: 'Dispatch',
  module: 2,
  module_name: 'Invoicing',
  is_always_selected: true,
}

let http

/** Mount this form. Thin wrapper so the tests read the same as before. */
function mount(props = {}, stubs = {}) {
  return mountForm(ModulePartForm, { props, stubs })
}

/** created() is async; it settles by turning isLoading back off. */
async function ready(wrapper) {
  await vi.waitFor(() => expect(wrapper.vm.isLoading).toBe(false))
  return wrapper
}

beforeEach(() => {
  // list() reads response.data.results, so the default GET has to be a page.
  http = installFakeClients(models, {
    defaultGet: { data: { count: MODULES.length, results: MODULES } },
  })
  http.get.mockImplementation((url) => {
    if (url === '/get-csrf-token/') {
      return Promise.resolve({ data: { token: 'csrf-token' } })
    }
    if (url === '/member/module-part/42/') {
      return Promise.resolve({ data: { ...DETAIL } })
    }
    return Promise.resolve({ data: { count: MODULES.length, results: MODULES } })
  })
  toastCreate.mockClear()
})

afterEach(() => {
  restoreClients()
})

describe('ModulePartForm - create', () => {
  test('turns the module list into select options', async () => {
    const wrapper = await ready(mount())

    // The shape BFormSelect wants, built by hand in created() today.
    expect(wrapper.vm.modules).toEqual([
      { value: 1, text: 'Planning' },
      { value: 2, text: 'Invoicing' },
    ])
  })

  test('starts from the model defaults with the first module selected', async () => {
    const wrapper = await ready(mount())

    expect(wrapper.vm.modulePart).toMatchObject({
      name: '',
      is_always_selected: false,
    })
    expect(wrapper.vm.modulePart.module).toBe(1)
  })

  test('posts the module part and navigates back', async () => {
    const wrapper = await ready(mount())

    wrapper.vm.modulePart.name = 'Dispatch'

    await wrapper.vm.submitForm()

    expect(urls('post')).toEqual(['/member/module-part/'])
    const [, payload] = http.post.mock.calls[0]
    expect(payload).toMatchObject({ name: 'Dispatch', module: 1 })

    expect(toastTitles()).toEqual(['Created'])
    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(wrapper.vm.buttonDisabled).toBe(false)
    expect(wrapper.vm.isLoading).toBe(false)
  })

  test('sends nothing when the name is missing', async () => {
    const wrapper = await ready(mount())

    wrapper.vm.modulePart.name = ''

    await wrapper.vm.submitForm()

    expect(http.post).not.toHaveBeenCalled()
    expect(routerGo()).not.toHaveBeenCalled()
    expect(wrapper.vm.buttonDisabled).toBe(false)
    expect(wrapper.vm.isLoading).toBe(false)
  })

  test('does not navigate when the post fails', async () => {
    const wrapper = await ready(mount())

    http.post.mockRejectedValueOnce(new Error('boom'))
    wrapper.vm.modulePart.name = 'Dispatch'

    await wrapper.vm.submitForm()

    expect(toastTitles()).toEqual(['Error'])
    expect(routerGo()).not.toHaveBeenCalled()
    expect(wrapper.vm.buttonDisabled).toBe(false)
    expect(wrapper.vm.isLoading).toBe(false)
  })
})

describe('ModulePartForm - edit', () => {
  async function readyEdit() {
    const wrapper = mount({ pk: 42 })
    await vi.waitFor(() => expect(wrapper.vm.modulePart.name).toBe('Dispatch'))
    return wrapper
  }

  test('loads the module part', async () => {
    const wrapper = await readyEdit()

    expect(wrapper.vm.modulePart).toMatchObject({
      id: 42,
      module: 2,
      is_always_selected: true,
    })
  })

  // The create branch's "default to the first module" does not run on edit;
  // the loaded record's own module wins.
  test('keeps the loaded module rather than defaulting to the first', async () => {
    const wrapper = await readyEdit()

    expect(wrapper.vm.modulePart.module).toBe(2)
  })

  test('patches the module part and navigates back', async () => {
    const wrapper = await readyEdit()

    wrapper.vm.modulePart.name = 'Dispatch renamed'
    await wrapper.vm.submitForm()

    expect(urls('patch')).toEqual(['/member/module-part/42/'])
    const [, payload] = http.patch.mock.calls[0]
    expect(payload).toMatchObject({ id: 42, name: 'Dispatch renamed' })

    expect(toastTitles()).toEqual(['Updated'])
    expect(routerGo()).toHaveBeenCalledWith(-1)
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

  test('toasts an error when the module part cannot be fetched', async () => {
    http.get.mockImplementation((url) => {
      if (url === '/get-csrf-token/') {
        return Promise.resolve({ data: { token: 'csrf-token' } })
      }
      if (url === '/member/module-part/42/') {
        return Promise.reject(new Error('boom'))
      }
      return Promise.resolve({ data: { count: MODULES.length, results: MODULES } })
    })

    const wrapper = mount({ pk: 42 })
    await vi.waitFor(() => expect(toastTitles()).toEqual(['Error']))

    expect(wrapper.vm.isLoading).toBe(false)
  })
})

describe('ModulePartForm - navigation', () => {
  test('cancelForm goes back', async () => {
    const wrapper = await ready(mount())

    wrapper.vm.cancelForm()

    expect(routerGo()).toHaveBeenCalledWith(-1)
  })
})

// BUG, FLAGGED AND DELIBERATELY NOT PINNED BY A TEST.
//
// created() does `this.modulePart.module = this.modules[0].value` with no guard,
// so a member with no modules configured hits
//
//   TypeError: Cannot read properties of undefined (reading 'value')
//     at ModulePartForm.vue:136
//
// on the create form. created() is async and nothing catches it, so the
// rejection is unhandled and the form stays stuck behind its loading overlay
// with isLoading true. Verified by running exactly that scenario.
//
// There is no test for it here on purpose. Reproducing it produces an unhandled
// rejection that vitest records as a suite-level error and exits 1 with, even
// though every test passes. Vitest collects those through its own process
// handler, so a local try/finally cannot contain it, and the only suppression -
// dangerouslyIgnoreUnhandledErrors - is global and would mask real errors across
// the whole suite. Pinning this one behaviour is not worth that.
//
// It becomes straightforward to cover once the transform moves to the model:
// the guard belongs next to it, and the model method is testable directly
// without mounting anything.
