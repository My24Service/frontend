import { beforeEach, describe, expect, test, vi } from 'vitest'

import ContractForm from '@/views/member/ContractForm.vue'
import { vContract } from '@/api/valibot.gen'

import { goldenTest, goldensFor } from '../../helpers/golden.js'
import { fixtureFor } from '../../helpers/schema-fixture.js'
import { contract28, moduleData } from '../../fixtures/member-module-data.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { memberRoutes } from '../../support/member-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * ContractForm as it behaves today, before the Slice rewrites it (#319).
 *
 * A Contract is a name plus a set of Module Parts, and the parts are chosen
 * with checkboxes and then folded into one `module_paths_pks` string
 * (`"1:1,2|2:3"`). That encoding is the whole substance of this screen, so it
 * is what the goldens are about: `tests/unit/golden/contract-form.json`,
 * recorded from the running application against a development tenant. See
 * tests/unit/golden/README.md.
 *
 * **The module-data response here is derived, and cited.** `openapi/schema.yaml`
 * declares `GET /api/member/get-module-data/` with "No response body", so the
 * seam has no generated schema to hold this fixture to — the one response in
 * these specs that is not checked against the contract. Its shape comes from
 * the view that produces it: `GetAllModuleData.get` in
 * `source/apps/member/views.py:52-68` returns a list of
 * `{id, name, parts: [{id, name, is_always_selected}]}`. That gap is worth
 * closing in the backend annotation rather than here.
 */

const api = installApiSeam()
const goldens = goldensFor('contract-form')

/**
 * The module tree and the contract the capture was taken against, both
 * observed. See ../../fixtures/member-module-data.js for why they are observed
 * rather than invented: the recorded golden holds the `module_paths_pks` string
 * this form folds these checkboxes into, and that string names these exact part
 * ids in this exact order.
 *
 * Planning's part 250 and five others are always-selected, which is what the
 * create form pre-ticks.
 */
const MODULE_DATA = moduleData

const DETAIL = fixtureFor(vContract, contract28)

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

/** Tick or untick a module part's checkbox, the way a user clicks it. */
async function tickPart(wrapper, partId, ticked = true) {
  await wrapper.get(`#el${partId}`).setValue(ticked)
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

  // An always-selected part is ticked before the user touches anything, and
  // cannot be unticked - the checkbox is disabled. On this tenant the six of
  // them all belong to `company`; 255 is its `company` part.
  test('pre-ticks the always-selected parts and will not let them be unticked', async () => {
    const wrapper = await mountContractForm()

    expect(isTicked(wrapper, 255)).toBe(true)
    expect(wrapper.get('#el255').attributes('disabled')).toBeDefined()
    expect(isTicked(wrapper, 292)).toBe(false)
  })

  goldenTest(goldens, 'create', 'contract-form', async () => {
    const wrapper = await mountContractForm()

    await typeName(wrapper, 'Premium')
    await tickPart(wrapper, 292)
    await submit(wrapper)

    return api.requests()
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

  // `module_paths_pks` is the stored encoding and the checkboxes are what a
  // user reads it as. Contract 28 names 53 of the tenant's 67 parts; `webshop`
  // (292) is one it does not.
  test('ticks the parts the stored contract names, and no others', async () => {
    const wrapper = await mountContractForm({ pk: 28 })

    expect(isTicked(wrapper, 294)).toBe(true)
    expect(isTicked(wrapper, 297)).toBe(true)
    expect(isTicked(wrapper, 292)).toBe(false)
  })

  // Opened and submitted with nothing changed, which is what the capture did.
  // It is the sharper scenario anyway: it pins that the checkbox round-trip is
  // lossless — `module_paths_pks` goes back out exactly as it came in — and
  // that the form hands back `modules_text`, which the serializer marks
  // read-only.
  goldenTest(goldens, 'edit', 'contract-form', async () => {
    const wrapper = await mountContractForm({ pk: 28 })

    await submit(wrapper)

    return api.requests()
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

describe('ContractForm, cancelling', () => {
  test('goes back without sending anything', async () => {
    const wrapper = await mountContractForm()

    await typeName(wrapper, 'Premium')
    await wrapper.get('.modal-footer .btn-secondary').trigger('click')
    await settle()

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })
})
