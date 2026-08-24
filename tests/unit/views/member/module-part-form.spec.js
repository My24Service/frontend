import { beforeEach, describe, expect, test, vi } from 'vitest'

import ModulePartForm from '@/views/member/ModulePartForm.vue'
import moduleModel from '@/models/member/Module.js'
import { vModulePart, vPaginatedModuleList } from '@/api/valibot.gen'

import { goldenTest, goldensFor } from '../../helpers/golden.js'
import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../../support/form-harness.js'
import { serverError, useFreshModel } from '../../support/list-harness.js'
import { memberRoutes } from '../../support/member-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * ModulePartForm as it behaves today, before the Slice rewrites it (#320).
 *
 * This spec was the closest thing the repository had to a good form test, and
 * this is it brought onto the network seam and extended. Two things changed
 * and both were the point:
 *
 *   - it ran against a client fake, which records whatever request the code
 *     made and asserts it as correct. It now runs at the network boundary,
 *     against handlers generated from `openapi/schema.yaml`.
 *   - it drove the component by hand — `wrapper.vm.modulePart.name = …`,
 *     `await wrapper.vm.submitForm()` — which is a test of the component's
 *     internals rather than of the screen. It now types into the fields and
 *     clicks the button a user clicks, and reads the select the way a user
 *     reads it.
 *
 * Requests are asserted against `tests/unit/golden/module-part-form.json`,
 * recorded from the running application against a development tenant; see
 * tests/recorder/README.md.
 *
 * Module Part is the resource the tracer-bullet Slice goes first on, so this
 * file is that rewrite's contract.
 */

const api = installApiSeam()
const goldens = goldensFor('module-part-form')

const MODULES = paginated(
  [
    fixtureFor(itemSchemaOf(vPaginatedModuleList), { id: 1, name: 'Planning' }),
    fixtureFor(itemSchemaOf(vPaginatedModuleList), { id: 2, name: 'Invoicing' }),
  ],
  { count: 2 },
)

const DETAIL = fixtureFor(vModulePart, {
  id: 42,
  name: 'Dispatch',
  module: 2,
  module_name: 'Invoicing',
  is_always_selected: true,
})

useFreshModel(moduleModel)

beforeEach(() => {
  api.get('/api/member/module/', MODULES)
  api.get('/api/member/module-part/{id}/', DETAIL)
  api.post('/api/member/module-part/', DETAIL)
  api.patch('/api/member/module-part/{id}/', DETAIL)
})

async function mountPartForm(props = {}) {
  const wrapper = mountForm(ModulePartForm, { deep: true, routes: memberRoutes, props })
  await settle()
  return wrapper
}

async function typeName(wrapper, value) {
  const field = wrapper.get('#module-part_name')
  await field.setValue(value)
  await field.trigger('change')
}

/** Pick a module in the dropdown, by its option value. */
async function chooseModule(wrapper, value) {
  await wrapper.get('select').setValue(value)
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

/** The module dropdown as a user sees it: the option labels, and the chosen one. */
function moduleChoices(wrapper) {
  return wrapper.findAll('select option').map((option) => option.text())
}

// The relationship between a Module and its Parts, as the UI expresses it: the
// form has to ask for the Modules before a user can attach a Part to one, and
// the request that populates the dropdown is part of this screen's contract.
describe('ModulePartForm module dropdown', () => {
  test('offers the modules the backend returned', async () => {
    const wrapper = await mountPartForm()

    expect(moduleChoices(wrapper)).toEqual(['Planning', 'Invoicing'])
  })

  test('asks for the modules on the create form', async () => {
    await mountPartForm()

    expect(api.requests().filter((sent) => sent.path === '/api/member/module/')).toHaveLength(1)
  })

  test('starts a new part on the first module offered', async () => {
    const wrapper = await mountPartForm()

    expect(wrapper.get('select').element.value).toBe('1')
  })

  // The create branch's "default to the first module" does not run on edit;
  // the loaded record's own module wins.
  test('keeps the loaded module when editing rather than defaulting to the first', async () => {
    const wrapper = await mountPartForm({ pk: 42 })

    expect(wrapper.get('select').element.value).toBe('2')
  })
})

describe('ModulePartForm, creating a module part', () => {
  test('opens on an empty form headed New module part', async () => {
    const wrapper = await mountPartForm()

    expect(wrapper.text()).toContain('New module part')
    expect(wrapper.get('#module-part_name').element.value).toBe('')
  })

  goldenTest(goldens, 'create', 'module-part-form', async () => {
    const wrapper = await mountPartForm()

    await typeName(wrapper, 'Dispatch')
    await submit(wrapper)

    return api.requests()
  })

  goldenTest(goldens, 'create against a chosen module', 'module-part-form', async () => {
    const wrapper = await mountPartForm()

    await typeName(wrapper, 'Dispatch')
    await chooseModule(wrapper, '2')
    await submit(wrapper)

    return api.requests()
  })

  test('confirms the creation and goes back', async () => {
    const wrapper = await mountPartForm()

    await typeName(wrapper, 'Dispatch')
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Module part has been created')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('refuses a part with no name, and sends nothing', async () => {
    const wrapper = await mountPartForm()

    await submit(wrapper)

    expect(nameRefused(wrapper)).toBe(true)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
    expect(routerGo()).not.toHaveBeenCalled()
  })

  test('tells the user when the create fails, and stays on the form', async () => {
    api.post('/api/member/module-part/', serverError)
    const wrapper = await mountPartForm()

    await typeName(wrapper, 'Dispatch')
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error creating module part')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('ModulePartForm, editing a module part', () => {
  test('opens on the part it was given, headed Edit module part', async () => {
    const wrapper = await mountPartForm({ pk: 42 })

    expect(wrapper.text()).toContain('Edit module part')
    expect(wrapper.get('#module-part_name').element.value).toBe('Dispatch')
  })

  goldenTest(goldens, 'edit', 'module-part-form', async () => {
    const wrapper = await mountPartForm({ pk: 42 })

    await typeName(wrapper, 'Dispatch renamed')
    await submit(wrapper)

    return api.requests()
  })

  test('confirms the update and goes back', async () => {
    const wrapper = await mountPartForm({ pk: 42 })

    await typeName(wrapper, 'Dispatch renamed')
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Module part has been updated')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('tells the user when the part cannot be fetched', async () => {
    api.get('/api/member/module-part/{id}/', serverError)

    await mountPartForm({ pk: 42 })

    expect(toasts().map((toast) => toast.body)).toContain('Error fetching module part')
  })

  test('tells the user when the update fails, and stays on the form', async () => {
    api.patch('/api/member/module-part/{id}/', serverError)
    const wrapper = await mountPartForm({ pk: 42 })

    await typeName(wrapper, 'Dispatch renamed')
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error updating module part')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('ModulePartForm, cancelling', () => {
  test('goes back without sending anything', async () => {
    const wrapper = await mountPartForm()

    await typeName(wrapper, 'Dispatch')
    await wrapper.get('.modal-footer .btn-secondary').trigger('click')
    await settle()

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })
})

// BUG, FLAGGED AND DELIBERATELY NOT PINNED BY A TEST.
//
// init() does `modulePart.value.module = modules.value[0].value` with no guard,
// so a member with no modules configured hits
//
//   TypeError: Cannot read properties of undefined (reading 'value')
//
// on the create form. init() is async and nothing catches it, so the rejection
// is unhandled and the form stays stuck behind its loading overlay with
// isLoading true. Verified by running exactly that scenario.
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
