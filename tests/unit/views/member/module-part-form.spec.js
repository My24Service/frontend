import { beforeEach, describe, expect, test, vi } from 'vitest'

import ModulePartForm from '@/views/member/ModulePartForm.vue'
import ModuleList from '@/views/member/ModuleList.vue'
import moduleModel from '@/models/member/Module.js'
import { vModulePart } from '@/api/valibot.gen'

import { goldenTest, goldensFor } from '../../helpers/golden.js'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { moduleList, modulePart254 } from '../../fixtures/member-demo-tenant.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../../support/form-harness.js'
import { mountList, openSearch, serverError, useFreshModel } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'
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
 * tests/unit/golden/README.md.
 *
 * Module Part is the resource the tracer-bullet Slice goes first on, so this
 * file is that rewrite's contract.
 */

const api = installApiSeam()
const goldens = goldensFor('module-part-form')

/**
 * The demo tenant's modules and its module part 254, both observed.
 *
 * The order of `MODULES` is load-bearing: ModulePartForm defaults a new part to
 * `modules[0]`, so which module comes first decides what a plain create sends.
 * Here that is `3d` (9), which is what makes the recorded "create against a
 * chosen module" golden - sending 7 - a choice rather than the default.
 */
const MODULES = moduleList

const DETAIL = fixtureFor(vModulePart, modulePart254)

useFreshModel(moduleModel)

beforeEach(() => {
  // Answers `q` the way the backend does - `icontains`, so case-insensitively.
  // A stub that ignored `q` would let the leak below pass unnoticed; one that
  // matched case-sensitively would empty the dropdown and trip the unguarded
  // `modules[0]` crash described at the foot of this file, which vitest records
  // as a suite-level error no local try/catch can contain.
  api.get('/api/member/module/', ({ query }) =>
    query.q
      ? paginated(
          MODULES.results.filter((module) =>
            module.name.toLowerCase().includes(String(query.q).toLowerCase()),
          ),
        )
      : MODULES,
  )
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

    expect(moduleChoices(wrapper)).toEqual(
      MODULES.results.map((module) => module.name),
    )
  })

  test('asks for the modules on the create form', async () => {
    await mountPartForm()

    expect(api.requests().filter((sent) => sent.path === '/api/member/module/')).toHaveLength(1)
  })

  test('starts a new part on the first module offered', async () => {
    const wrapper = await mountPartForm()

    expect(wrapper.get('select').element.value).toBe('9')
  })

  // The create branch's "default to the first module" does not run on edit;
  // the loaded record's own module wins.
  test('keeps the loaded module when editing rather than defaulting to the first', async () => {
    const wrapper = await mountPartForm({ pk: 254 })

    expect(wrapper.get('select').element.value).toBe('7')
  })
})

// BUG, CHARACTERISED RATHER THAN REPAIRED.
//
// `moduleModel` is a module-level singleton shared with ModuleList, and
// `setSearchQuery` lives on it. So a search typed on the *Modules list* is
// still set when ModulePartForm asks the same model for its dropdown options,
// and the dropdown comes back filtered by a term the user typed on a different
// screen and cannot see from here.
//
// Both screens are driven through their own DOM here, in the order a user
// would: search the list, then open the form. That order is not contrived — it
// is what the capture behind these goldens recorded, where every
// `/api/member/module/` request for the rest of the session carried
// `q=invoice`.
describe('ModulePartForm module dropdown, after a search on the Modules list', () => {
  test('asks for the modules with the other screen\'s search term', async () => {
    const list = await mountList(ModuleList)
    await openSearch(list)
    modal('search-modal').type('invoic')
    modal('search-modal').ok()
    await settle()

    await mountPartForm()

    expect(api.requests().at(-1)).toMatchObject({
      path: '/api/member/module/',
      query: { page: '1', q: 'invoic' },
    })
  })

  test('and offers only the modules that survived it', async () => {
    const list = await mountList(ModuleList)
    await openSearch(list)
    modal('search-modal').type('invoic')
    modal('search-modal').ok()
    await settle()

    const form = await mountPartForm()

    expect(moduleChoices(form)).toEqual(['invoices'])
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

    await typeName(wrapper, 'something new')
    await submit(wrapper)

    return api.requests()
  })

  goldenTest(goldens, 'create against a chosen module', 'module-part-form', async () => {
    const wrapper = await mountPartForm()

    await typeName(wrapper, 'something new')
    await chooseModule(wrapper, '7')
    await submit(wrapper)

    return api.requests()
  })

  test('confirms the creation and goes back', async () => {
    const wrapper = await mountPartForm()

    await typeName(wrapper, 'something new')
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

    await typeName(wrapper, 'something new')
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error creating module part')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('ModulePartForm, editing a module part', () => {
  test('opens on the part it was given, headed Edit module part', async () => {
    const wrapper = await mountPartForm({ pk: 254 })

    expect(wrapper.text()).toContain('Edit module part')
    expect(wrapper.get('#module-part_name').element.value).toBe('dashboard')
  })

  // The capture ticked "Always selected?" on part 254 and submitted, leaving
  // the name alone.
  goldenTest(goldens, 'edit', 'module-part-form', async () => {
    const wrapper = await mountPartForm({ pk: 254 })

    await wrapper.get('#module-part_is_always_selected').setValue(true)
    await submit(wrapper)

    return api.requests()
  })

  test('confirms the update and goes back', async () => {
    const wrapper = await mountPartForm({ pk: 254 })

    await typeName(wrapper, 'dashboard renamed')
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Module part has been updated')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('tells the user when the part cannot be fetched', async () => {
    api.get('/api/member/module-part/{id}/', serverError)

    await mountPartForm({ pk: 254 })

    expect(toasts().map((toast) => toast.body)).toContain('Error fetching module part')
  })

  test('tells the user when the update fails, and stays on the form', async () => {
    api.patch('/api/member/module-part/{id}/', serverError)
    const wrapper = await mountPartForm({ pk: 254 })

    await typeName(wrapper, 'dashboard renamed')
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error updating module part')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('ModulePartForm, cancelling', () => {
  test('goes back without sending anything', async () => {
    const wrapper = await mountPartForm()

    await typeName(wrapper, 'something new')
    await wrapper.get('.modal-footer .btn-secondary').trigger('click')
    await settle()

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })
})

// A SECOND BUG, FLAGGED AND DELIBERATELY NOT PINNED BY A TEST.
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
//
// The leaked search above reaches it a second way, and that route needs no
// misconfigured member at all: search the Modules list for something no module
// matches, then open a Module Part form. The dropdown is empty, `modules[0]` is
// undefined, and the form hangs behind its loading overlay.
