import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ModuleForm, ModuleList, ModulePartForm } from '@/features/member'
import { vModule } from '@/api/valibot.gen'

import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountForm, toasts } from '../../support/form-harness.js'
import { mountList, openDelete } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'
import { memberRoutes } from '../../support/member-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * The relationship between a Module and its Module Parts, as the UI expresses
 * it (#322): a Part attaches to a Module through the dropdown on the Part
 * form, fed by GET /api/member/module/. Creating or deleting a Module on the
 * Module screens has to show up there — not because these screens call each
 * other, but because both answer to the same backend list, and the seam proves
 * the round trip.
 *
 * This is integration coverage spanning three screens, which is why it lives
 * in its own file rather than inside either screen's spec: it changes when any
 * of them does, and none of them owns it.
 */

const api = installApiSeam()

const MODULES = [
  fixtureFor(vModule, { id: 9, name: '3d' }),
  fixtureFor(vModule, { id: 12, name: 'newer' }),
]

function paginatedModules(results) {
  return { count: results.length, next: null, previous: null, results }
}

beforeEach(() => {
  api.get('/api/member/module/', paginatedModules(MODULES))
})

async function mountModuleForm() {
  const wrapper = mountForm(ModuleForm, { deep: true, routes: memberRoutes })
  await settle()
  return wrapper
}

async function mountPartForm() {
  const wrapper = mountForm(ModulePartForm, { deep: true, routes: memberRoutes })
  await settle()
  return wrapper
}

function partChoices(wrapper) {
  return wrapper.findAll('select option').map((option) => option.text())
}

async function typeName(wrapper, value) {
  const field = wrapper.get('#module_name')
  await field.setValue(value)
  await field.trigger('change')
}

async function submit(wrapper) {
  await wrapper.get('.modal-footer .btn-primary').trigger('click')
  await settle()
  await wrapper.vm.$nextTick()
}

test('a module created on the Module form is offered on the Module Part form', async () => {
  api.post('/api/member/module/', fixtureFor(vModule, { id: 13, name: 'brand-new' }))

  const form = await mountModuleForm()
  await typeName(form, 'brand-new')
  await submit(form)
  expect(toasts().map((toast) => toast.body)).toContain('Module has been created')

  // What the backend would now answer, including the module just created.
  api.get('/api/member/module/', paginatedModules([...MODULES, fixtureFor(vModule, { id: 13, name: 'brand-new' })]))

  const partForm = await mountPartForm()

  expect(partChoices(partForm)).toContain('brand-new')
})

test('a module deleted from the Modules list stops being offered on the Module Part form', async () => {
  api.delete('/api/member/module/{id}/', noContent)

  const list = await mountList(ModuleList)
  await openDelete(list)

  // What the backend would answer once the delete lands.
  api.get('/api/member/module/', paginatedModules([MODULES[0]]))

  modal('delete-module-modal').ok()
  await settle()

  expect(toasts().map((toast) => toast.body)).toContain('Module has been deleted')

  const partForm = await mountPartForm()

  expect(partChoices(partForm)).toEqual(['3d'])
})
