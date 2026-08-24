import { beforeEach, describe, expect, test, vi } from 'vitest'

import MemberForm from '@/views/member/MemberForm.vue'
import { vPaginatedContractList } from '@/api/valibot.gen'

import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm } from '../../support/form-harness.js'
import golden from '../../golden/member-form-create.json'

/**
 * MemberForm, run through the network seam (#318).
 *
 * This is the tracer bullet: the screen is still running its original code, so
 * what the golden records is what the application does today, not what a
 * migration made it do. Every other spec in the suite keeps its client fake and
 * comes across when its own Slice is converted.
 *
 * Driven through the DOM — typing into `#member_companycode`, reading the
 * feedback the user would read — rather than by calling `vm.checkCompanyCode`.
 * The uniqueness check is wired as an async Vuelidate rule, so calling the
 * method directly would exercise the request and skip the wiring that decides
 * whether a user ever sees the answer.
 *
 * Two things are asserted, and they are different things:
 *
 *   - the golden — the *whole* set of requests the screen puts on the wire,
 *     recorded below the client. A dropped query parameter changes this file,
 *     which is exactly the failure the old client-fake seam could not see.
 *   - what the user is told: the company code being refused.
 *
 * The seam is strict in both directions, so this spec also stands as evidence
 * that MemberForm's requests conform to `openapi/schema.yaml` and that the
 * contract list it is answered with is one the backend could have sent.
 *
 * The coverage here stops at the tracer bullet. The load, pagination, search,
 * create, edit, delete, validation-failure and save-failure paths — with
 * goldens recorded against a development tenant rather than written here — are
 * #319.
 */

// MemberForm calls useToast() in setup(). In the application that resolves
// through the <BApp> in App.vue; a mounted component has no such ancestor, so
// without this the mount throws before created() runs. Spread the original —
// the auto-import resolver rewrites <b-form-input> & friends into named
// imports from here, and replacing the module wholesale blanks every one.
vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: create } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create }) }
})

const api = installApiSeam()

const CONTRACTS = paginated([fixtureFor(itemSchemaOf(vPaginatedContractList), { id: 1, name: 'Contract A' })])

const MAIN = { getCountries: [] }

/** Mount the create form and let `created()` settle. */
async function mountCreateForm() {
  // `deep: true`: the company-code field has to be a real input for a spec to
  // type into it, and b-overlay must not be stubbed — it is what makes the
  // loading state visible. See support/form-harness.js.
  const wrapper = mountForm(MemberForm, { main: MAIN, deep: true })
  await settle()
  return wrapper
}

/** Type into the company-code field the way a user does, and let the async rule settle. */
async function typeCompanyCode(wrapper, value) {
  const field = wrapper.get('#member_companycode')
  await field.setValue(value)
  await field.trigger('change')
  await settle()
  await wrapper.vm.$nextTick()
}

/**
 * Whether the "already in use" feedback is being shown to the user.
 *
 * Keyed on `d-block`, which is how bootstrap-vue-next surfaces an invalid
 * feedback block, and not on `isVisible()`: the element is in the DOM either
 * way, and under happy-dom no stylesheet is applied to hide it — so
 * `isVisible()` answers `true` for a message the user cannot see.
 */
function companyCodeRefused(wrapper) {
  return wrapper
    .findAll('.invalid-feedback')
    .filter((node) => node.text().includes('Company code is already in use'))
    .some((node) => node.classes('d-block'))
}

beforeEach(() => {
  api.get('/api/member/contract/', CONTRACTS)
  api.get('/api/member/companycode-exists/', { available: true })
})

describe('MemberForm, creating a Member', () => {
  test('puts the recorded set of requests on the wire', async () => {
    const wrapper = await mountCreateForm()

    await typeCompanyCode(wrapper, 'acme')

    expect(api.requests()).toEqual(golden)
  })

  test('tells the user when the company code is taken', async () => {
    api.get('/api/member/companycode-exists/', { available: false })
    const wrapper = await mountCreateForm()

    await typeCompanyCode(wrapper, 'acme')

    expect(companyCodeRefused(wrapper)).toBe(true)
  })

  test('says nothing when the company code is free', async () => {
    const wrapper = await mountCreateForm()

    await typeCompanyCode(wrapper, 'acme')

    expect(companyCodeRefused(wrapper)).toBe(false)
  })

  // The rule short-circuits below two characters, and the request that would
  // ask about a code the backend cannot have is not sent at all.
  test('does not ask about a company code too short to be one', async () => {
    const wrapper = await mountCreateForm()

    await typeCompanyCode(wrapper, 'a')

    expect(api.requests().filter((sent) => sent.path.includes('companycode-exists'))).toEqual([])
  })
})

// The contract list feeds the form's Contract select, and the fixture above is
// built from the generated component rather than written by hand, so this also
// pins that the form reads the field it reads.
describe('MemberForm contract options', () => {
  test('offers the contracts the backend returned', async () => {
    const wrapper = await mountCreateForm()

    // Found by its option text: bootstrap-vue-next puts a generated id on the
    // rendered <select>, so `label-for="member_contract"` is not a handle.
    expect(wrapper.findAll('option').map((option) => option.text())).toContain('Contract A')
  })
})
