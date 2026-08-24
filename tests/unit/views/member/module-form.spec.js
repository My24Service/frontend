import { beforeEach, describe, expect, test, vi } from 'vitest'

import ModuleForm from '@/views/member/ModuleForm.vue'
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
 * ModuleForm as it behaves today, before the Slice rewrites it (#320).
 *
 * Driven through the DOM: typed into `#module_name`, submitted by clicking the
 * button a user clicks. Requests are asserted against
 * `tests/unit/golden/module-form.json`, recorded from the running application
 * against a development tenant — see tests/unit/golden/README.md.
 *
 * The two failure paths cannot be driven against a healthy tenant, so they have
 * no golden. What they assert is what the user is told, which is a claim about
 * this component and needs no citation: the request that produced the failure
 * is the same one the create and edit goldens already record.
 */

const api = installApiSeam()
const goldens = goldensFor('module-form')

const MODULE = fixtureFor(vModule, { id: 7, name: 'Planning' })

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

beforeEach(() => {
  api.get('/api/member/module/{id}/', MODULE)
  api.post('/api/member/module/', MODULE)
  api.patch('/api/member/module/{id}/', MODULE)
})

describe('ModuleForm, creating a module', () => {
  test('opens on an empty form headed New module', async () => {
    const wrapper = await mountModuleForm()

    expect(wrapper.text()).toContain('New module')
    expect(wrapper.get('#module_name').element.value).toBe('')
  })

  goldenTest(goldens, 'create', 'module-form', async () => {
    const wrapper = await mountModuleForm()

    await typeName(wrapper, 'Planning')
    await submit(wrapper)

    return api.requests()
  })

  test('confirms the creation and goes back', async () => {
    const wrapper = await mountModuleForm()

    await typeName(wrapper, 'Planning')
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

  test('tells the user when the create fails, and stays on the form', async () => {
    api.post('/api/member/module/', serverError)
    const wrapper = await mountModuleForm()

    await typeName(wrapper, 'Planning')
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error creating module')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('ModuleForm, editing a module', () => {
  test('opens on the module it was given, headed Edit module', async () => {
    const wrapper = await mountModuleForm({ pk: 7 })

    expect(wrapper.text()).toContain('Edit module')
    expect(wrapper.get('#module_name').element.value).toBe('Planning')
  })

  goldenTest(goldens, 'edit', 'module-form', async () => {
    const wrapper = await mountModuleForm({ pk: 7 })

    await typeName(wrapper, 'Planning & dispatch')
    await submit(wrapper)

    return api.requests()
  })

  test('confirms the update and goes back', async () => {
    const wrapper = await mountModuleForm({ pk: 7 })

    await typeName(wrapper, 'Planning & dispatch')
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Module has been updated')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('tells the user when the module cannot be fetched', async () => {
    api.get('/api/member/module/{id}/', serverError)

    await mountModuleForm({ pk: 7 })

    expect(toasts().map((toast) => toast.body)).toContain('Error fetching module')
  })

  test('tells the user when the update fails, and stays on the form', async () => {
    api.patch('/api/member/module/{id}/', serverError)
    const wrapper = await mountModuleForm({ pk: 7 })

    await typeName(wrapper, 'Planning & dispatch')
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error updating module')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('ModuleForm, cancelling', () => {
  test('goes back without sending anything', async () => {
    const wrapper = await mountModuleForm()

    await typeName(wrapper, 'Planning')
    await wrapper.get('.modal-footer .btn-secondary').trigger('click')
    await settle()

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })
})
