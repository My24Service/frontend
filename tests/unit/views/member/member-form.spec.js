import { beforeEach, describe, expect, test, vi } from 'vitest'

import MemberForm from '@/views/member/MemberForm.vue'
import { vMember, vPaginatedContractList } from '@/api/valibot.gen'

import { goldenTest, goldensFor } from '../../helpers/golden.js'
import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { companyLogoPng, member19 } from '../../fixtures/member-demo-tenant.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { memberRoutes } from '../../support/member-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * MemberForm as it behaves today, before the Slice rewrites it (#319).
 *
 * `member-form-call-shape.spec.js` is the #318 tracer bullet and covers the
 * company-code uniqueness check on its own recorded golden. This file is the
 * rest of what #319 asks for: create, edit, both logo uploads, validation
 * failures and save failures, against `tests/unit/golden/member-form.json` —
 * recorded from the running application against a development tenant, see
 * tests/unit/golden/README.md.
 *
 * Everything is driven through the DOM, and here that is not a stylistic
 * preference — it is the whole reason this file found anything. Two of this
 * screen's rules exist only in the wiring, and the wiring is where it was
 * broken:
 *
 *   - the logo went nowhere. `b-form-file` was bound with `@input`, which that
 *     component does not emit, so the handler received an Event instead of a
 *     File and died on `file.name`. The required-logo rule could not be
 *     satisfied and a Member could not be created at all. Found by choosing a
 *     file the way a user does; calling `imageSelected(file)` would have
 *     exercised the method and proved nothing. Fixed since, so the tests below
 *     describe a working upload — the golden is a real create, not the attempt
 *     it was first written as.
 *   - the uniqueness check has no debounce, so it fires on every keystroke.
 *     The recorded golden holds twelve `companycode-exists` requests for a
 *     thirteen character code. A spec that set the field in one go would record
 *     one request and describe a screen nobody uses; see `typeCompanyCode`.
 *
 * The two submit buttons still disagree, and that is characterised rather than
 * repaired: the header's Save calls submitForm directly and never sets
 * `submitClicked`, so it refuses an invalid form without showing a message.
 */

const api = installApiSeam()
const goldens = goldensFor('member-form')

/**
 * The demo tenant's contracts, in the order it returned them. The order is
 * load-bearing: MemberForm defaults a new member to `contracts[0]`, and the
 * recorded create sent `contract: 6`.
 */
const CONTRACTS = paginated(
  [
    { id: 6, name: 'Advanced+' },
    { id: 23, name: 'My24Service Light' },
    { id: 26, name: 'My24Service no Q&I' },
    { id: 28, name: 'My24Service Normal' },
  ].map((row) => fixtureFor(itemSchemaOf(vPaginatedContractList), row)),
  { count: 9 },
)

/** Every field the form refuses to submit without, and a value it accepts. */
const REQUIRED = {
  member_name: 'New member',
  member_address: 'blastraat 123',
  member_postal: '1234AZ',
  member_city: 'Amsterdam',
  member_tel: '0612345678',
  member_email: 'info@example.com',
  member_www: 'https://example.com',
  member_contacts: 'Me',
  member_activities: 'Developing',
  member_info: 'This is a test',
}

/** The company code the capture typed, one character at a time. */
const COMPANYCODE = 'thisnewmember'

/**
 * Member 19 on the demo tenant, observed.
 *
 * Kept whole rather than built from the generated component with a handful of
 * overrides, because the recorded edit golden holds the PATCH body the form
 * built out of this record — and that body is this record minus exactly the
 * fields `preUpdate` and `submitForm` drop. A fixture with faker's values for
 * `www` and `email` would also fail the form's own rules, which are stricter
 * than the schema's.
 */
const DETAIL = fixtureFor(vMember, member19)

const MAIN = { getCountries: [{ value: 'NL', text: 'Nederland' }] }

beforeEach(() => {
  api.get('/api/member/contract/', CONTRACTS)
  api.get('/api/member/companycode-exists/', { available: true })
  api.get('/api/member/member/{id}/', DETAIL)
  api.post('/api/member/member/', DETAIL)
  api.patch('/api/member/member/{id}/', DETAIL)
})

async function mountMemberForm(props = {}) {
  const wrapper = mountForm(MemberForm, { deep: true, routes: memberRoutes, main: MAIN, props })
  await settle()
  return wrapper
}

async function typeInto(wrapper, id, value) {
  const field = wrapper.get(`#${id}`)
  await field.setValue(value)
  await field.trigger('change')
}

async function fillRequired(wrapper) {
  for (const [id, value] of Object.entries(REQUIRED)) {
    await typeInto(wrapper, id, value)
  }
  await typeCompanyCode(wrapper, COMPANYCODE)
}

/**
 * Type a company code the way a person types it: one character at a time.
 *
 * This is not fussiness. The uniqueness check is an async Vuelidate rule on the
 * field's value with no debounce, so it fires on **every keystroke** - the
 * recorded golden holds twelve `companycode-exists` requests for a thirteen
 * character code, one per character from the second on. Setting the value in
 * one go produces a single request, and would quietly describe a screen that
 * behaves nothing like the one a user drives.
 *
 * The first character sends nothing: the rule short-circuits below two.
 */
async function typeCompanyCode(wrapper, code) {
  const field = wrapper.get('#member_companycode')
  for (let length = 1; length <= code.length; length++) {
    await field.setValue(code.slice(0, length))
    await settle()
  }
  await field.trigger('change')
  await settle()
}

/** A select inside the form group carrying `label`, which has no id of its own. */
function selectFor(wrapper, label) {
  const group = wrapper.findAll('.b-form-group').find((node) => node.text().includes(label))
  return group.get('select')
}

/**
 * The hidden `<input type="file">` behind one of the two logo fields.
 *
 * `b-form-file` puts the id it is given on its *browse button*, and keeps the
 * real input off-screen — so `#member_companylogo` is a `<button>` and cannot
 * be given a file. The field is found by the label a user reads instead.
 */
function logoInput(wrapper, label) {
  const group = wrapper.findAll('.b-form-group').find((node) => node.text().includes(label))
  return group.get('input[type="file"]')
}

/**
 * Choose a file in a logo field, the way the browser's file chooser does.
 *
 * `input.files` is read-only, so it is defined onto the element — which is what
 * a real file chooser ends up doing too — and `change` is the event
 * `b-form-file` listens for. Everything after that is the component's own:
 * FileReader, `fileChanged`, and the base64 that reaches the payload.
 *
 * `bytes` defaults to the PNG the create capture chose, because the recorded
 * golden holds the `data:` URL FileReader produced from exactly those bytes.
 */
async function chooseLogo(wrapper, label, { filename = 'logo.png', bytes = logoBytes() } = {}) {
  const field = logoInput(wrapper, label)
  const file = new File([bytes], filename, { type: 'image/png' })
  Object.defineProperty(field.element, 'files', { value: [file], configurable: true })

  await field.trigger('change')
  await settle()
  await wrapper.vm.$nextTick()
}

function logoBytes() {
  return Uint8Array.from(atob(companyLogoPng), (character) => character.charCodeAt(0))
}

/** The header's Save button. Submits at once, and never sets `submitClicked`. */
async function save(wrapper) {
  await wrapper.get('header .btn-primary').trigger('click')
  await settle()
  await wrapper.vm.$nextTick()
}

/**
 * The footer's Submit button, which is the one that shows validation messages.
 *
 * It goes through `preSubmitForm`, which sets `submitClicked` and then waits a
 * literal second before submitting. Waited out with real time rather than fake
 * timers: this suite's fake-timer trap is that a faked clock stops the click
 * handlers this spec depends on.
 */
async function submitFromFooter(wrapper) {
  await wrapper.get('footer .btn-primary').trigger('click')
  await new Promise((resolve) => setTimeout(resolve, 1100))
  await settle()
  await wrapper.vm.$nextTick()
}

function feedbackShown(wrapper, message) {
  return wrapper
    .findAll('.invalid-feedback')
    .filter((node) => node.text().includes(message))
    .some((node) => node.classes('d-block'))
}

function previews(wrapper) {
  return wrapper.findAll('img').map((img) => img.attributes('src'))
}

describe('MemberForm, creating a member', () => {
  test('opens on an empty form headed New member', async () => {
    const wrapper = await mountMemberForm()

    expect(wrapper.text()).toContain('New member')
    expect(wrapper.get('#member_name').element.value).toBe('')
  })

  test('offers the contracts the backend returned', async () => {
    const wrapper = await mountMemberForm()

    expect(wrapper.findAll('option').map((option) => option.text())).toContain('Advanced+')
  })

  test('shows the chosen company logo as the upload preview', async () => {
    const wrapper = await mountMemberForm()

    await chooseLogo(wrapper, 'Company logo')

    expect(previews(wrapper).some((src) => src?.startsWith('data:image/png;base64,'))).toBe(true)
  })

  // The extension guard is on the company logo only, and it bails before the
  // reader runs - so a rejected file leaves the preview alone and never marks
  // the form as having a logo.
  test('ignores a file whose extension is not an accepted image', async () => {
    const wrapper = await mountMemberForm()

    await chooseLogo(wrapper, 'Company logo', { filename: 'contract.pdf' })

    expect(previews(wrapper).some((src) => src?.startsWith('data:'))).toBe(false)
  })

  // A company logo is required on create and only on create, and nothing but
  // the file input can satisfy it.
  test('refuses a member with no company logo', async () => {
    const wrapper = await mountMemberForm()

    await fillRequired(wrapper)
    await submitFromFooter(wrapper)

    expect(feedbackShown(wrapper, 'Please upload a company logo')).toBe(true)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })

  goldenTest(goldens, 'create', 'member-form', async () => {
    const wrapper = await mountMemberForm()

    await fillRequired(wrapper)
    await selectFor(wrapper, 'Equipment QR code type').setValue('shltr')
    await chooseLogo(wrapper, 'Company logo')
    await save(wrapper)

    return api.requests()
  })

  test('confirms the creation and goes back', async () => {
    const wrapper = await mountMemberForm()

    await fillRequired(wrapper)
    await chooseLogo(wrapper, 'Company logo')
    await save(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Member has been created')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('tells the user when the create fails, and stays on the form', async () => {
    api.post('/api/member/member/', serverError)
    const wrapper = await mountMemberForm()

    await fillRequired(wrapper)
    await chooseLogo(wrapper, 'Company logo')
    await save(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error creating member')
    expect(routerGo()).not.toHaveBeenCalled()
  })

  test('refuses an empty form, and sends nothing', async () => {
    const wrapper = await mountMemberForm()

    await submitFromFooter(wrapper)

    expect(feedbackShown(wrapper, 'Please enter a name')).toBe(true)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })

  // The two submit buttons do not behave alike, and the difference is visible
  // to a user: the header's Save calls submitForm directly, which never sets
  // `submitClicked`, so an invalid form is refused with no message at all.
  test('the header Save refuses an invalid form without saying why', async () => {
    const wrapper = await mountMemberForm()

    await save(wrapper)

    expect(feedbackShown(wrapper, 'Please enter a name')).toBe(false)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })
})

describe('MemberForm, editing a member', () => {
  test('opens on the member it was given, headed Edit member', async () => {
    const wrapper = await mountMemberForm({ pk: 19 })

    expect(wrapper.text()).toContain('Edit member')
    expect(wrapper.get('#member_name').element.value).toBe('SHLTR')
  })

  test('shows the stored logos as the current images', async () => {
    const wrapper = await mountMemberForm({ pk: 19 })

    expect(previews(wrapper).filter(Boolean).length).toBeGreaterThan(0)
  })

  // The capture edited one field - it appended " Etc." to the info text - and
  // saved. The golden is worth having for what it shows the form *dropping* and
  // *keeping* around that one change: `companylogo` and
  // `companylogo_workorder` go, because no file was chosen, while
  // `companylogo_url`, `contract_text` and `deep_link` are handed back although
  // the serializer marks them read-only.
  goldenTest(goldens, 'edit', 'member-form', async () => {
    const wrapper = await mountMemberForm({ pk: 19 })

    await typeInto(wrapper, 'member_info', `${member19.info} Etc.`)
    await save(wrapper)

    return api.requests()
  })

  test('confirms the update and goes back', async () => {
    const wrapper = await mountMemberForm({ pk: 19 })

    await typeInto(wrapper, 'member_name', 'SHLTR Group')
    await save(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Member has been updated')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  // On edit the code the member already has is its own, so the uniqueness rule
  // lets it through without asking the backend.
  test('does not ask whether the member already owns its own company code', async () => {
    const wrapper = await mountMemberForm({ pk: 19 })

    await typeInto(wrapper, 'member_companycode', 'shltr')
    await settle()

    expect(
      api.requests().filter((sent) => sent.path === '/api/member/companycode-exists/'),
    ).toEqual([])
  })

  test('does ask about a company code the member does not already own', async () => {
    const wrapper = await mountMemberForm({ pk: 19 })

    await typeInto(wrapper, 'member_companycode', 'umbrella')
    await settle()

    expect(
      api.requests().filter((sent) => sent.path === '/api/member/companycode-exists/'),
    ).toHaveLength(1)
  })

  test('tells the user when the member cannot be fetched', async () => {
    api.get('/api/member/member/{id}/', serverError)

    await mountMemberForm({ pk: 19 })

    expect(toasts().map((toast) => toast.body)).toContain('Error fetching member')
  })

  test('tells the user when the update fails, and stays on the form', async () => {
    api.patch('/api/member/member/{id}/', serverError)
    const wrapper = await mountMemberForm({ pk: 19 })

    await typeInto(wrapper, 'member_name', 'SHLTR Group')
    await save(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error updating member')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('MemberForm, cancelling', () => {
  test('goes back without sending anything', async () => {
    const wrapper = await mountMemberForm()

    await fillRequired(wrapper)
    await wrapper.get('header .btn-secondary').trigger('click')
    await settle()

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })
})
