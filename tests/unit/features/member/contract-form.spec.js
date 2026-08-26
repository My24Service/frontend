import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ContractForm } from '@/features/member'
import { vContract } from '@/api/valibot.gen'

import { goldensFor } from '../../helpers/golden.js'
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

/**
 * ContractForm, rewritten into the feature folder (#323).
 *
 * A Contract is a name plus a set of Module Parts, chosen with checkboxes and
 * folded into one `module_paths_pks` string (`../contract/module-paths.ts`).
 * The encoding round-trip is pinned directly; here it is driven the way a user
 * drives it, through the rendered checkboxes.
 *
 * **Declared exceptions** (#323). The recorded bodies carry three fields the
 * request schemas do not accept from this form: `id` (edit), `modules_text`
 * (read-only) and `max_users` (default 0, no input rendered) — all riding in
 * on the old model's field bag. The rewritten form sends `{name,
 * module_paths_pks}` and nothing else. Both goldens are therefore diffed
 * against the recording with those body keys overridden; every other part of
 * every request — including both GETs and their order — still matches the
 * recording exactly.
 *
 * Unlike its siblings' specs, the module-data response here needed no derived-
 * fixture caveat: #317 annotated the endpoint truthfully, so the seam holds
 * the fixture against the generated schema like every other response.
 */

const api = installApiSeam()
const goldens = goldensFor('contract-form')

const MODULE_DATA = moduleData

const DETAIL = fixtureFor(vContract, contract28)

/** The parts encoding contract 28 stores, as the demo tenant holds it. */
const STORED_PATHS = contract28.module_paths_pks

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

/** Tick or untick a module-level checkbox, the way a user clicks it. */
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

/**
 * The recorded requests for a scenario, with one write's body replaced by the
 * rewritten form's — the shape of a declared body delta: everything about the
 * recording still binds except the keys named in the exception.
 */
function withBody(recorded, method, body) {
  return recorded.map((sent) => (sent.method === method ? {...sent, body} : sent))
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

  // The capture ticked one part in `mobile` (246) and one in `invoices` (294)
  // and submitted. The six always-selected parts of `company` ride along
  // without being touched, which is what makes the encoded payload three
  // groups rather than two.
  test('puts the create on the wire matching the recording except the declared delta', async () => {
    const wrapper = await mountContractForm()

    await typeName(wrapper, 'new contract')
    await tickPart(wrapper, 246)
    await tickPart(wrapper, 294)
    await submit(wrapper)

    const recorded = goldens.create

    // DECLARED EXCEPTION (#323): the recording's POST carries `modules_text`
    // and `max_users` alongside, because the old form posted its model's whole
    // field bag. The request schema accepts neither from this form
    // (modules_text is read-only; max_users has no input here), so the
    // rewritten form sends the two declared fields and nothing else. Every
    // other part of every request still matches the recording.
    expect(api.requests()).toEqual(withBody(recorded, 'post', {
      name: 'new contract',
      module_paths_pks: '1:246|7:258,255,279,259,275,256|11:294',
    }))
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

    // The mount starts the fetch; settle() lets every macrotask in flight
    // land while the tree's own promise stays pending, so the overlay is
    // observed mid-load rather than after it.
    const wrapper = mountForm(ContractForm, { deep: true, routes: memberRoutes })
    await settle()

    expect(wrapper.find('.b-overlay').exists()).toBe(true)

    release(MODULE_DATA)
    await settle()

    expect(wrapper.find('.b-overlay').exists()).toBe(false)
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

  test('puts the update on the wire, lossless except the declared delta', async () => {
    const wrapper = await mountContractForm({ pk: 28 })

    // Opened and submitted with nothing changed, which is what the capture
    // did. It is the sharper scenario anyway: it pins that the checkbox round
    // trip is lossless — `module_paths_pks` goes back out exactly as it came
    // in.
    await submit(wrapper)

    const recorded = goldens.edit

    // DECLARED EXCEPTION (#323): the recording's PATCH carries `id`,
    // `modules_text` and `max_users` alongside, because the old form handed
    // the loaded record straight back. The request schema accepts none of them
    // from this form, so the rewritten form sends the two declared fields —
    // the encoding byte-for-byte what came in. Every other part of every
    // request, including both GETs in their recorded order, still matches.
    expect(api.requests()).toEqual(withBody(recorded, 'patch', {
      name: 'My24Service Normal',
      module_paths_pks: STORED_PATHS,
    }))
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

// The module-level checkbox, as repaired: the legacy control was wired to an
// array nothing ever read, so clicking it toggled a visual that snapped back
// on the next part change — a control that did nothing a user could perceive.
// It now does what the affordance promises: on selects every part of the
// module, off falls back to the always-selected floor (the same place the
// "none" link leaves you).
describe('ContractForm, the module-level checkbox', () => {
  test('reads checked only once every part of the module is selected', async () => {
    const wrapper = await mountContractForm()

    expect(wrapper.get('#module1').element.checked).toBe(false)

    // One part of `mobile` is a partial selection, not a module selection.
    await tickPart(wrapper, 246)
    expect(wrapper.get('#module1').element.checked).toBe(false)

    await tickModule(wrapper, 1)
    expect(wrapper.get('#module1').element.checked).toBe(true)
  })

  test('switching it on puts every part of the module on the wire', async () => {
    const wrapper = await mountContractForm()

    await typeName(wrapper, 'new contract')
    // `3d` carries a single part (291), so switching its module on must tick
    // and send that one part.
    await tickModule(wrapper, 9)
    await submit(wrapper)

    const groups = api.requests().find((sent) => sent.method === 'post')
      .body.module_paths_pks.split('|')
    // Only the switched-on module and the always-selected floor ride along,
    // whichever way the backend ordered the tree.
    expect(groups).toHaveLength(2)
    expect(groups).toContain('9:291')
    expect(groups).toContain('7:258,255,279,259,275,256')
  })

  test('switching it off keeps only the always-selected parts', async () => {
    const wrapper = await mountContractForm()

    await typeName(wrapper, 'new contract')
    await tickModule(wrapper, 7)
    await tickModule(wrapper, 7, false)
    await tickPart(wrapper, 246)
    await submit(wrapper)

    const post = api.requests().find((sent) => sent.method === 'post')
    // `mobile` survives as its one chosen part; `company` fell back to its
    // six always-selected rather than disappearing with the switch.
    expect(post.body.module_paths_pks).toBe('1:246|7:258,255,279,259,275,256')
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
