import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ModulePartForm } from '@/features/member'
import ModuleList from '@/views/member/ModuleList.vue'
import moduleModel from '@/models/member/Module.js'
import { vModulePart } from '@/api/valibot.gen'

import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { goldensFor } from '../../helpers/golden.js'
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
 * ModulePartForm, rewritten as the tracer-bullet Slice's form (#321).
 *
 * This is the characterisation spec from #320 brought forward onto its own
 * replacement: the same DOM-driven scenarios against screens that read through
 * vue-query and validate through the generated valibot request schema instead
 * of Vuelidate.
 *
 * **Declared exceptions** (recorded on #321). The recorded goldens for this
 * screen put `module_name` — and on edit, `id` — in the request bodies,
 * because the old form posted the hand-written model's whole field bag. The
 * request schemas declare neither field, so the rewritten form sends exactly
 * what they declare.
 *
 * The goldens' GET requests still bind the rewritten screen, and are asserted
 * verbatim from the recording (`goldensFor('module-part-form')`) rather than
 * re-derived — see the `_why` note at the top of that file for how the
 * recording and the declared body deltas coexist.
 *
 * Two characterised bugs die with the rewrite, also on the exceptions list:
 * the module dropdown no longer inherits a search typed on the Modules list
 * (there is no shared model singleton left to leak through), and a member with
 * no modules no longer hangs the create form behind its loading overlay.
 */

const api = installApiSeam()

/**
 * The recorded requests of the pre-rewrite screen, one scenario at a time.
 * The GETs are still this screen's contract and are asserted verbatim; the
 * POST/PATCH bodies are not, and each delta below is marked DECLARED
 * EXCEPTION with its reason.
 */
const formGoldens = goldensFor('module-part-form')
const recordedGets = (scenario) => formGoldens[scenario].filter((sent) => sent.method === 'get')

/**
 * The demo tenant's modules and its module part 254, both observed.
 *
 * The order of `MODULES` is load-bearing: the form defaults a new part to
 * `modules[0]`, so which module comes first decides what a plain create sends.
 * Here that is `3d` (9), which is what makes the recorded "create against a
 * chosen module" golden - sending 7 - a choice rather than the default.
 */
const MODULES = moduleList

const DETAIL = fixtureFor(vModulePart, modulePart254)

useFreshModel(moduleModel)

beforeEach(() => {
  // Answers `q` the way the backend does - `icontains`, so case-insensitively.
  // Only the legacy Modules list searches with `q` these days; the rewritten
  // form never sends it (pinned below).
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

function moduleRefused(wrapper) {
  return wrapper
    .findAll('.invalid-feedback')
    .filter((node) => node.text().includes('Please choose a module'))
    .some((node) => node.classes('d-block'))
}

/** The module dropdown as a user sees it: the option labels, and the chosen one. */
function moduleChoices(wrapper) {
  return wrapper.findAll('select option').map((option) => option.text())
}

describe('ModulePartForm module dropdown', () => {
  test('offers the modules the backend returned', async () => {
    const wrapper = await mountPartForm()

    expect(moduleChoices(wrapper)).toEqual(
      MODULES.results.map((module) => module.name),
    )
  })

  test('asks for the modules as recorded, on the create form', async () => {
    await mountPartForm()

    expect(api.requests().filter((sent) => sent.method === 'get')).toEqual(recordedGets('create'))
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

  // Fixed as part of the rewrite; was a characterised bug. The old form asked
  // a module-level singleton for its dropdown, so a term typed into the
  // Modules list' search filtered what a user saw here. The rewritten form
  // asks for the unfiltered page itself - there is no shared state to leak.
  describe('after a search on the Modules list', () => {
    beforeEach(async () => {
      const list = await mountList(ModuleList)
      await openSearch(list)
      modal('search-modal').type('invoic')
      modal('search-modal').ok()
      await settle()
    })

    test('asks for the modules without the other screen\'s search term', async () => {
      await mountPartForm()

      expect(api.requests().at(-1)).toMatchObject({
        path: '/api/member/module/',
        query: { page: '1' },
      })
      expect(api.requests().at(-1).query.q).toBeUndefined()
    })

    test('and offers every module rather than the ones that survived it', async () => {
      const wrapper = await mountPartForm()

      expect(moduleChoices(wrapper)).toEqual(MODULES.results.map((module) => module.name))
    })
  })

  test('keeps the loading overlay up until the modules arrive', async () => {
    let release
    api.get('/api/member/module/', () => new Promise((resolve) => { release = resolve }))

    const wrapperPromise = mountForm(ModulePartForm, { deep: true, routes: memberRoutes })
    // Let the mount start fetching, then look before releasing.
    await new Promise((resolve) => setTimeout(resolve, 0))
    const wrapper = wrapperPromise

    expect(wrapper.find('.b-overlay').exists()).toBe(true)

    release(MODULES)
    await settle()

    expect(wrapper.find('.b-overlay').exists()).toBe(false)
  })
})

describe('ModulePartForm, creating a module part', () => {
  test('opens on an empty form headed New module part', async () => {
    const wrapper = await mountPartForm()

    expect(wrapper.text()).toContain('New module part')
    expect(wrapper.get('#module-part_name').element.value).toBe('')
  })

  test('asks for the modules, then puts the create on the wire', async () => {
    const wrapper = await mountPartForm()

    await typeName(wrapper, 'something new')
    await chooseModule(wrapper, '7')
    await submit(wrapper)

    expect(api.requests().filter((sent) => sent.method === 'get')).toEqual(recordedGets('create'))

    const posts = api.requests().filter((sent) => sent.method === 'post')
    expect(posts).toHaveLength(1)
    expect(posts[0].path).toBe('/api/member/module-part/')
    // DECLARED EXCEPTION (#321): the recorded golden carries `module_name: ''`
    // alongside these fields, because the old form posted the model's whole
    // field bag. The request schema declares name, module and
    // is_always_selected and nothing else, so that is what the rewritten form
    // sends.
    expect(posts[0].body).toEqual({
      name: 'something new',
      module: 7,
      is_always_selected: false,
    })
  })

  test('lands a plain create on the first module offered', async () => {
    const wrapper = await mountPartForm()

    await typeName(wrapper, 'a new part')
    await submit(wrapper)

    const posts = api.requests().filter((sent) => sent.method === 'post')
    expect(posts[0].body).toEqual({
      name: 'a new part',
      module: 9,
      is_always_selected: false,
    })
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

  test('refuses a part whose name is longer than the API accepts', async () => {
    const wrapper = await mountPartForm()

    await typeName(wrapper, 'a'.repeat(256))
    await submit(wrapper)

    expect(
      wrapper
        .findAll('.invalid-feedback')
        .some((node) => node.text().includes('Please use at most 255 characters')),
    ).toBe(true)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
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

  test('asks for the modules before the part, as recorded', async () => {
    await mountPartForm({ pk: 254 })

    expect(api.requests().filter((sent) => sent.method === 'get')).toEqual(recordedGets('edit'))
  })

  test('puts the update on the wire with only the declared fields', async () => {
    const wrapper = await mountPartForm({ pk: 254 })

    // The capture ticked "Always selected?" on part 254 and submitted, leaving
    // the name alone.
    await wrapper.get('#module-part_is_always_selected').setValue(true)
    await submit(wrapper)

    const patches = api.requests().filter((sent) => sent.method === 'patch')
    expect(patches).toHaveLength(1)
    expect(patches[0].path).toBe('/api/member/module-part/254/')
    // DECLARED EXCEPTION (#321): the recorded golden carries `id` and
    // `module_name` alongside these fields, because the old form patched the
    // loaded record straight back. The request schema declares name, module
    // and is_always_selected and nothing else, so that is what the rewritten
    // form sends.
    expect(patches[0].body).toEqual({
      name: 'dashboard',
      module: 7,
      is_always_selected: true,
    })
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

// FIXED AS PART OF THE REWRITE; was a characterised bug.
//
// init() used to do `modulePart.module = modules[0].value` with no guard, so a
// member with no modules crashed the create form with an unhandled rejection
// and left it stuck behind its loading overlay. The rewritten form guards the
// default and lets validation stop the submit instead.
describe('ModulePartForm, on a member with no modules', () => {
  beforeEach(() => {
    api.get('/api/member/module/', paginated([]))
  })

  test('renders an empty dropdown instead of hanging', async () => {
    const wrapper = await mountPartForm()

    expect(wrapper.find('.b-overlay').exists()).toBe(false)
    expect(wrapper.findAll('select option')).toHaveLength(0)
  })

  test('refuses the submit rather than sending a module-less part', async () => {
    const wrapper = await mountPartForm()

    await typeName(wrapper, 'orphan part')
    await submit(wrapper)

    expect(moduleRefused(wrapper)).toBe(true)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
    expect(routerGo()).not.toHaveBeenCalled()
  })
})
