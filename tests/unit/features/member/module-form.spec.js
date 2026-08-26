import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ModuleForm, ModulePartForm } from '@/features/member'
import { vModule } from '@/api/valibot.gen'

import { goldenTest, goldensFor } from '../../helpers/golden.js'
import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { memberRoutes } from '../../support/member-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * ModuleForm, rewritten into the feature folder (#322) — the tracer bullet's
 * form pattern applied to the smallest resource there is: one field.
 *
 * Driven through the DOM: typed into `#module_name`, submitted by clicking
 * the button a user clicks. The create golden is asserted verbatim — the old
 * form's POST body was already exactly what the request schema declares. The
 * edit golden's PATCH carried `id` because the old form handed the loaded
 * record straight back; the request schema does not declare it, so that one
 * delta is a declared exception (#322), pinned to its new shape below while
 * the GETs stay asserted verbatim from the recording.
 *
 * The two failure paths cannot be driven against a healthy tenant, so they have
 * no golden. What they assert is what the user is told, which is a claim about
 * this component and needs no citation: the request that produced the failure
 * is the same one the create and edit goldens already record.
 */

const api = installApiSeam()
const goldens = goldensFor('module-form')

/**
 * Module 2 on the demo tenant, which is the module the capture was taken
 * against. The id and name are the recorded ones because the golden holds the
 * PATCH body the form built out of them — a fixture naming some other module
 * would put a different body on the wire and disagree with the recording for a
 * reason that has nothing to do with the component.
 */
const MODULE = fixtureFor(vModule, { id: 2, name: 'orders' })

/** A paginated envelope around module rows, as DRF sends it. */
function paginatedModules(results) {
  return { count: results.length, next: null, previous: null, results }
}

beforeEach(() => {
  api.get('/api/member/module/{id}/', MODULE)
  api.post('/api/member/module/', MODULE)
  api.patch('/api/member/module/{id}/', MODULE)
})

async function mountModuleForm(props = {}) {
  const wrapper = mountForm(ModuleForm, { deep: true, routes: memberRoutes, props })
  await settle()
  return wrapper
}

/** Type into the name field the way a user does. */
async function typeName(wrapper, value) {
  const field = wrapper.get('#module_name')
  await field.setValue(value)
  await field.trigger('change')
}

/** Click Submit and let the write settle. */
async function submit(wrapper) {
  await wrapper.get('.modal-footer .btn-primary').trigger('click')
  await settle()
  await wrapper.vm.$nextTick()
}

/** Whether the "please enter a name" message is being shown. */
function nameRefused(wrapper) {
  return wrapper
    .findAll('.invalid-feedback')
    .filter((node) => node.text().includes('Please enter a name'))
    .some((node) => node.classes('d-block'))
}

describe('ModuleForm, creating a module', () => {
  test('opens on an empty form headed New module', async () => {
    const wrapper = await mountModuleForm()

    expect(wrapper.text()).toContain('New module')
    expect(wrapper.get('#module_name').element.value).toBe('')
  })

  // Verbatim: the old form's create body was already exactly `{name}`, and it
  // makes no reads first, so nothing here needed an exception.
  goldenTest(goldens, 'create', 'module-form', async () => {
    const wrapper = await mountModuleForm()

    await typeName(wrapper, 'newer')
    await submit(wrapper)

    return api.requests()
  })

  test('confirms the creation and goes back', async () => {
    const wrapper = await mountModuleForm()

    await typeName(wrapper, 'newer')
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Module has been created')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('refuses a module with no name, and sends nothing', async () => {
    const wrapper = await mountModuleForm()

    await submit(wrapper)

    expect(nameRefused(wrapper)).toBe(true)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })

  test('refuses a name longer than the API accepts', async () => {
    const wrapper = await mountModuleForm()

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
    api.post('/api/member/module/', serverError)
    const wrapper = await mountModuleForm()

    await typeName(wrapper, 'newer')
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error creating module')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('ModuleForm, editing a module', () => {
  test('opens on the module it was given, headed Edit module', async () => {
    const wrapper = await mountModuleForm({ pk: 2 })

    expect(wrapper.text()).toContain('Edit module')
    expect(wrapper.get('#module_name').element.value).toBe('orders')
  })

  test('puts the update on the wire, matching the recording except the declared delta', async () => {
    const wrapper = await mountModuleForm({ pk: 2 })

    // Opened and submitted with nothing changed, which is what the capture did
    // and is the sharper scenario anyway: it pins that the form hands the
    // record back the way it received it.
    await submit(wrapper)

    const recorded = goldens.edit

    // DECLARED EXCEPTION (#322): the recording's PATCH carries `id` alongside,
    // because the old form patched the loaded record straight back. The
    // request schema declares `name` and nothing else, so that is what the
    // rewritten form sends — the one key of the recording this spec overrides,
    // with every other part of it still diffed.
    const expected = recorded.map((sent) =>
      sent.method === 'patch' ? {...sent, body: {name: 'orders'}} : sent,
    )

    expect(api.requests()).toEqual(expected)
  })

  test('keeps the loading overlay up until the record arrives', async () => {
    let release
    api.get('/api/member/module/{id}/', () => new Promise((resolve) => { release = resolve }))

    const wrapperPromise = mountForm(ModuleForm, { deep: true, routes: memberRoutes, props: { pk: 2 } })
    await new Promise((resolve) => setTimeout(resolve, 0))
    const wrapper = wrapperPromise

    expect(wrapper.find('.b-overlay').exists()).toBe(true)

    release(MODULE)
    await settle()

    expect(wrapper.find('.b-overlay').exists()).toBe(false)
  })

  test('confirms the update and goes back', async () => {
    const wrapper = await mountModuleForm({ pk: 2 })

    await typeName(wrapper, 'orders renamed')
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Module has been updated')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('tells the user when the module cannot be fetched', async () => {
    api.get('/api/member/module/{id}/', serverError)

    await mountModuleForm({ pk: 2 })

    expect(toasts().map((toast) => toast.body)).toContain('Error fetching module')
  })

  test('tells the user when the update fails, and stays on the form', async () => {
    api.patch('/api/member/module/{id}/', serverError)
    const wrapper = await mountModuleForm({ pk: 2 })

    await typeName(wrapper, 'orders renamed')
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error updating module')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('ModuleForm, cancelling', () => {
  test('goes back without sending anything', async () => {
    const wrapper = await mountModuleForm()

    await typeName(wrapper, 'newer')
    await wrapper.get('.modal-footer .btn-secondary').trigger('click')
    await settle()

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })
})
