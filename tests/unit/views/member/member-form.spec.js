import { beforeEach, describe, expect, test, vi } from 'vitest'

import MemberForm from '@/views/member/MemberForm.vue'
import { vMember, vPaginatedContractList } from '@/api/valibot.gen'

import { goldenTest, goldensFor } from '../../helpers/golden.js'
import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { member19 } from '../../fixtures/member-demo-tenant.js'
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
 * preference. Two of this screen's rules exist only in the wiring: the
 * uniqueness check is an async Vuelidate rule reached by a `change` on the
 * field, and a logo only reaches the payload if `fileChanged` was set by the
 * file input's own handler. Calling `imageSelected(file)` directly would
 * exercise the method and skip the wiring — and the wiring is where this screen
 * is broken. See "the company logo cannot be chosen" below.
 */

const api = installApiSeam()
const goldens = goldensFor('member-form')

const CONTRACTS = paginated([
  fixtureFor(itemSchemaOf(vPaginatedContractList), { id: 1, name: 'Contract A' }),
])

/** Every field the form refuses to submit without, and a value it accepts. */
const REQUIRED = {
  member_name: 'Acme BV',
  member_address: 'Dorpsstraat 1',
  member_postal: '1234 AB',
  member_city: 'Amsterdam',
  member_tel: '0201234567',
  member_email: 'info@acme.example',
  member_www: 'https://acme.example',
  member_contacts: 'Jan Jansen',
  member_activities: 'Maintenance',
  member_info: 'About Acme',
}

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
  await typeInto(wrapper, 'member_companycode', 'shltr')
  await settle()
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
 * Choose a file in a logo field, the way the browser's file chooser does, and
 * return whatever the handler threw — or null.
 *
 * The throw is caught rather than allowed to escape because it is the
 * behaviour under test. In a browser it is an uncaught error inside a DOM
 * listener, which the page survives and the user never sees; here it would
 * simply fail the test that is trying to write it down.
 */
async function chooseLogo(wrapper, label, filename = 'logo.png') {
  const field = logoInput(wrapper, label)
  const file = new File(['not-really-a-png'], filename, { type: 'image/png' })
  Object.defineProperty(field.element, 'files', { value: [file], configurable: true })

  let thrown = null
  try {
    await field.trigger('input')
  } catch (error) {
    thrown = error
  }

  await settle()
  await wrapper.vm.$nextTick()
  return thrown
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

    expect(wrapper.findAll('option').map((option) => option.text())).toContain('Contract A')
  })

  // BROKEN TODAY, AND CHARACTERISED RATHER THAN REPAIRED.
  //
  // The template binds `@input="imageSelected"` on `<b-form-file>`. That
  // component emits `change` and `update:modelValue` and nothing else, so
  // `@input` is not a component event at all — it falls through to the hidden
  // native `<input type="file">` as a DOM listener. `imageSelected` therefore
  // receives an Event, not a File, and dies on `file.name.split('.')` inside
  // `getExtension`.
  //
  // Nothing catches it. `fileChanged` is never set, `member.companylogo` stays
  // undefined, and the preview never changes — so the required-logo rule on the
  // create form can never be satisfied and a member cannot be created through
  // this screen at all.
  //
  // Recorded here, not fixed: this ticket describes the screen as it is, and
  // the Slice rewriting it needs to know that its "create a member" path has no
  // working predecessor to be equivalent to. It is also the case #313 is about
  // — a green suite over a screen that does not work in a browser.
  test('the company logo cannot be chosen: the handler throws on the event', async () => {
    const wrapper = await mountMemberForm()

    const thrown = await chooseLogo(wrapper, 'Company logo')

    // `getExtension(event.name)` — an Event has no `name`.
    expect(String(thrown)).toContain("Cannot read properties of undefined (reading 'split')")
    expect(previews(wrapper).some((src) => src?.startsWith('data:'))).toBe(false)
  })

  // The workorder logo is wired the same way and breaks the same way, one line
  // later: `imageWorkorderSelected` has no extension guard, so it reaches
  // `reader.readAsDataURL(event)` instead.
  test('the workorder logo cannot be chosen either', async () => {
    const wrapper = await mountMemberForm()

    await chooseLogo(wrapper, 'Optional logo for on the workorder', 'workorder.png')

    expect(previews(wrapper).some((src) => src?.startsWith('data:'))).toBe(false)
  })

  test('and so refuses to create the member, however complete the rest is', async () => {
    const wrapper = await mountMemberForm()

    await fillRequired(wrapper)
    await chooseLogo(wrapper, 'Company logo')
    await submitFromFooter(wrapper)

    expect(feedbackShown(wrapper, 'Please upload a company logo')).toBe(true)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
    expect(routerGo()).not.toHaveBeenCalled()
  })

  // The recorded scenario is the attempt, because the attempt is all there is
  // to record: a completed create cannot be driven against a tenant either.
  goldenTest(goldens, 'create attempt', 'member-form', async () => {
    const wrapper = await mountMemberForm()

    await fillRequired(wrapper)
    await chooseLogo(wrapper, 'Company logo')
    await save(wrapper)

    return api.requests()
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
