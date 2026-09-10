import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ModulePartForm } from '@/features/member'
import { vModulePart } from '@/api/valibot.gen'

import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { goldensFor } from '../../helpers/golden.js'
import { moduleList, modulePart254 } from '../../fixtures/member-demo-tenant.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { memberRoutes } from '../../support/member-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

const formGoldens = goldensFor('module-part-form')

/**
 * Declared delta (unit 5.1, the page-1-only option lists): the module dropdown
 * asks for the whole collection now — page_size 1000, the API's paginator
 * ceiling (my24service apps/core/rest.py My24Pagination, max_page_size 1000,
 * which clamps a larger value rather than rejecting it) — where the recording,
 * taken before the fix, asked for page one alone. Every other recorded GET
 * stays verbatim, and the shape that goes on the wire is pinned by its own test
 * in the dropdown describe below.
 */
const MODULE_LIST_GET = {
  method: 'get',
  path: '/api/member/module/',
  query: {page: '1', page_size: '1000'},
}

const recordedGets = (scenario) =>
  formGoldens[scenario]
    .filter((sent) => sent.method === 'get')
    .map((sent) => (sent.path === '/api/member/module/' ? MODULE_LIST_GET : sent))

const MODULES = moduleList

const DETAIL = fixtureFor(vModulePart, modulePart254)

beforeEach(() => {
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

  // The dropdown is filled from this one read, so it must carry more than the
  // API's default page of 20 modules (my24service apps/core/rest.py
  // My24Pagination: page_size 20, max_page_size 1000).
  test('asks for every module, not just the first page', async () => {
    await mountPartForm()

    const modules = api.requests().find((sent) => sent.path === '/api/member/module/')

    expect(modules.query).toEqual({page: '1', page_size: '1000'})
  })

  test('asks for the modules as recorded, on the create form', async () => {
    await mountPartForm()

    expect(api.requests().filter((sent) => sent.method === 'get')).toEqual(recordedGets('create'))
  })

  test('starts a new part on the first module offered', async () => {
    const wrapper = await mountPartForm()

    expect(wrapper.get('select').element.value).toBe('9')
  })

  test('keeps the loaded module when editing rather than defaulting to the first', async () => {
    const wrapper = await mountPartForm({ pk: 254 })

    expect(wrapper.get('select').element.value).toBe('7')
  })

  test('keeps the loading overlay up until the modules arrive', async () => {
    let release
    api.get('/api/member/module/', () => new Promise((resolve) => { release = resolve }))

    const wrapperPromise = mountForm(ModulePartForm, { deep: true, routes: memberRoutes })
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

    await wrapper.get('#module-part_is_always_selected').setValue(true)
    await submit(wrapper)

    const patches = api.requests().filter((sent) => sent.method === 'patch')
    expect(patches).toHaveLength(1)
    expect(patches[0].path).toBe('/api/member/module-part/254/')
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
