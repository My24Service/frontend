import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

import { MemberForm, MemberList } from '@/features/member'
import {
  vMember,
  vPaginatedContractList,
  vPaginatedMemberList,
} from '@/api/valibot.gen'

import { goldenTest, goldensFor } from '../../helpers/golden.js'
import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { companyLogoPng, member19 } from '../../fixtures/member-demo-tenant.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { createTestQueryClient, mountForm, mountListView, routerGo, toasts } from '../../support/form-harness.js'

// These screens leave live vue-query observers behind: an invalidation fires
// a refetch that would otherwise land in whichever test runs next, against
// that test's seam stubs. Unmounting between tests takes the observers - and
// any pending probe timer with them.
enableAutoUnmount(afterEach)
import { serverError } from '../../support/list-harness.js'
import { memberRoutes } from '../../support/member-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * MemberForm, rewritten into the feature folder (#325).
 *
 * The Slice's largest form: create/edit of a Member, two logo uploads, the
 * company-code availability probe, and field-level validation derived from
 * the generated request schema. Reads (the record under edit, the contract
 * dropdown) go through the generated query options; writes go through the
 * generated mutations and invalidate the member-list queries, so the list
 * shows the saved change when the user comes back.
 *
 * **Declared exceptions** (#325):
 *
 *   - The edit recording's PATCH carries `id`, `contract_text`,
 *     `companylogo_url` and `companylogo_workorder_url` — display-only fields
 *     riding in on the old model's round-tripped field bag. The request schema
 *     accepts none of them from this form (readonly, or write-declared
 *     elsewhere), so the rewritten form drops all four; the diffed body below
 *     names them. Every other part of every request still matches.
 *   - The create recording holds twelve `companycode-exists` probes for a
 *     thirteen-character code, because the old form wired the check as an
 *     async rule that fired per keystroke. The rewritten check is debounced —
 *     that is the ticket's own requirement — so the golden comparison strips
 *     the probes from both sides and the debounce itself is pinned live,
 *     where a count can be observed rather than inherited.
 *
 * One smaller behavioural repair is made deliberately: the legacy screen had
 * two submit buttons that disagreed — the header's Save refused an invalid
 * form without showing why, because it never set `submitClicked`. Both buttons
 * now report identically, which is what "validation messages are field-level"
 * means on a page with two ways to submit.
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
 * Member 19 on the demo tenant, observed. The recorded edit golden holds the
 * PATCH body the form built out of this record, minus the four dropped
 * read-only fields named in the exception above.
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

async function mountMemberForm(props = {}, options = {}) {
  const wrapper = mountForm(MemberForm, {
    deep: true,
    routes: memberRoutes,
    main: MAIN,
    props,
    ...options,
  })
  await settle()
  return wrapper
}

async function typeInto(wrapper, id, value) {
  const field = wrapper.get(`#${id}`)
  await field.setValue(value)
  await field.trigger('change')
}

/** Fill everything the form refuses to submit without, code typed in one go. */
async function fillRequired(wrapper, { code = COMPANYCODE } = {}) {
  for (const [id, value] of Object.entries(REQUIRED)) {
    await typeInto(wrapper, id, value)
  }
  if (code !== null) await typeInto(wrapper, 'member_companycode', code)
}

/**
 * Type a company code the way a person types it: one character at a time.
 *
 * With the debounce this produces exactly one probe — for the finished code —
 * no matter how the keystrokes are spaced, because every keystroke resets the
 * timer. That is the property the old screen lacked and this suite's
 * `until` below observes.
 */
async function typeCompanyCodePerKeystroke(wrapper, code) {
  const field = wrapper.get('#member_companycode')
  for (let length = 1; length <= code.length; length++) {
    await field.setValue(code.slice(0, length))
    await settle()
  }
}

function probes() {
  return api.requests().filter((sent) => sent.path === '/api/member/companycode-exists/')
}

/** Poll until `condition` holds, letting macrotasks land between tries. */
async function until(condition, { attempts = 200 } = {}) {
  for (let i = 0; i < attempts; i++) {
    if (condition()) return
    await settle()
  }
  throw new Error('condition never became true')
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
 * FileReader and the base64 that reaches the payload.
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

/** Writes seen so far, to notice when a click's write has landed. */
function writes() {
  return api.requests().filter((sent) => ['post', 'patch', 'put', 'delete'].includes(sent.method)).length
}

/**
 * Click a submit button and wait out what follows it.
 *
 * A valid form sits inside the company-code debounce window, so its write can
 * land hundreds of milliseconds after the click; an invalid one answers with
 * field feedback instead. Either way this returns as soon as the click has
 * had its effect - and bounded, so a click that does nothing fails fast
 * rather than hanging the spec.
 */
async function clickSubmit(wrapper, selector) {
  const before = writes()
  await wrapper.get(selector).trigger('click')

  try {
    await until(
      () => writes() > before || wrapper.findAll('.invalid-feedback.d-block').length > 0,
      {attempts: 2000},
    )
  } catch {
    // Neither a write nor feedback: leave the failure to the assertions below,
    // which see exactly what a user would have waited for - nothing.
  }
  await settle()
  await wrapper.vm.$nextTick()
}

/** The header's Save button. */
async function save(wrapper) {
  await clickSubmit(wrapper, 'header .btn-primary')
}

/** The footer's Submit button. */
async function submitFromFooter(wrapper) {
  await clickSubmit(wrapper, 'footer .btn-primary')
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

/**
 * The recorded requests for a scenario, with every write of one method given
 * the rewritten form's body — the shape of a declared body delta. Each golden
 * here holds exactly one such write, so "every" and "the" coincide today;
 * everything else about the recording still binds except the keys named in
 * the exception.
 */
function withBody(recorded, method, body) {
  return recorded.map((sent) => (sent.method === method ? {...sent, body} : sent))
}

/** The rewritten check is debounced, so the probes come out of both sides. */
function withoutProbes(requests) {
  return requests.filter((sent) => sent.path !== '/api/member/companycode-exists/')
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

  // The extension guard is on the company logo only, as the legacy screen had
  // it, and it bails before the reader runs - so a rejected file leaves the
  // preview alone and never marks the form as having a logo.
  test('ignores a file whose extension is not an accepted image', async () => {
    const wrapper = await mountMemberForm()

    await chooseLogo(wrapper, 'Company logo', { filename: 'contract.pdf' })

    expect(previews(wrapper).some((src) => src?.startsWith('data:'))).toBe(false)
  })

  // Both logos ride the same save when both were chosen - the company logo
  // under `companylogo`, this one under `companylogo_workorder`.
  test('shows the chosen workorder logo as its upload preview', async () => {
    const wrapper = await mountMemberForm()

    await chooseLogo(wrapper, 'workorder')

    expect(previews(wrapper).filter((src) => src?.startsWith('data:image/png;base64,'))).toHaveLength(1)
  })

  test('puts the chosen workorder logo on the wire beside the company logo', async () => {
    const wrapper = await mountMemberForm()

    await fillRequired(wrapper)
    await chooseLogo(wrapper, 'Company logo')
    await chooseLogo(wrapper, 'workorder')
    await save(wrapper)

    const post = api.requests().find((sent) => sent.method === 'post')
    expect(post.body.companylogo.startsWith('data:image/png;base64,')).toBe(true)
    expect(post.body.companylogo_workorder.startsWith('data:image/png;base64,')).toBe(true)
  })

  test('refuses an empty form, and sends nothing', async () => {
    const wrapper = await mountMemberForm()

    await submitFromFooter(wrapper)

    expect(feedbackShown(wrapper, 'Please enter a name')).toBe(true)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })

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

    return withoutProbes(api.requests())
  }, withoutProbes)

  test('confirms the creation and goes back', async () => {
    const wrapper = await mountMemberForm()

    await fillRequired(wrapper)
    await chooseLogo(wrapper, 'Company logo')
    await save(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Member has been created')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('tells the user why the create failed, and stays on the form', async () => {
    api.post('/api/member/member/', serverError)
    const wrapper = await mountMemberForm()

    await fillRequired(wrapper)
    await chooseLogo(wrapper, 'Company logo')
    await save(wrapper)

    // The reason is the API's own - DRF's {detail} envelope, verbatim.
    expect(toasts().map((toast) => toast.body).some((body) => body.includes('boom'))).toBe(true)
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('MemberForm, the company-code check', () => {
  /**
   * Thirteen keystrokes, one probe. Immediately after the last keystroke there
   * is *nothing* on the wire — every keystroke reset the timer — and then the
   * single trailing probe arrives for the finished code.
   */
  test('is debounced: one probe for the finished code, none for the prefixes', async () => {
    const wrapper = await mountMemberForm()

    await typeCompanyCodePerKeystroke(wrapper, COMPANYCODE)

    expect(probes()).toEqual([])

    await until(() => probes().length === 1)

    expect(probes()[0]).toMatchObject({
      method: 'get',
      path: '/api/member/companycode-exists/',
      query: { companycode: COMPANYCODE },
    })

    // And the verdict shows: available is the field turning valid.
    await until(() => wrapper.get('#member_companycode').classes('is-valid'))
  })

  test('reports a code that is already taken before anything is submitted', async () => {
    api.get('/api/member/companycode-exists/', { available: false })
    const wrapper = await mountMemberForm()

    await fillRequired(wrapper, {code: null})
    await typeInto(wrapper, 'member_companycode', COMPANYCODE)

    await until(() => feedbackShown(wrapper, 'Company code is already in use'))

    await chooseLogo(wrapper, 'Company logo')
    await save(wrapper)

    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })

  // Below two characters the legacy rule short-circuited too; a probe for one
  // character would only tell the user something the schema refuses anyway.
  test('does not probe for a one-character code', async () => {
    const wrapper = await mountMemberForm()

    await typeInto(wrapper, 'member_companycode', 't')
    await settle()
    await settle()
    await settle()
    await settle()

    expect(probes()).toEqual([])
  })

  test('a save waits for an in-flight probe rather than racing it', async () => {
    const wrapper = await mountMemberForm()

    await fillRequired(wrapper)
    await selectFor(wrapper, 'Equipment QR code type').setValue('shltr')
    await chooseLogo(wrapper, 'Company logo')

    // Submitted inside the debounce window: the save must wait for the
    // probe's verdict before anything else goes on the wire.
    await save(wrapper)
    await until(() => api.requests().some((sent) => sent.method === 'post'))

    const order = api.requests().map((sent) => sent.path)
    expect(order.indexOf('/api/member/companycode-exists/')).toBeLessThan(order.indexOf('/api/member/member/'))
    expect(toasts().map((toast) => toast.body)).toContain('Member has been created')
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

    const sources = previews(wrapper)
    expect(sources.some((src) => src?.includes('/media/logos/shltr/'))).toBe(true)
  })

  test('does not ask whether the member already owns its own company code', async () => {
    const wrapper = await mountMemberForm({ pk: 19 })

    await save(wrapper)

    expect(probes()).toEqual([])
  })

  test('does ask about a company code the member does not already own', async () => {
    const wrapper = await mountMemberForm({ pk: 19 })

    await typeInto(wrapper, 'member_companycode', 'renamed')
    await until(() => probes().length === 1)

    expect(probes()[0].query).toMatchObject({ companycode: 'renamed' })
  })

  goldenTest(goldens, 'edit', 'member-form', async () => {
    const wrapper = await mountMemberForm({ pk: 19 })

    // Opened and submitted with nothing changed, which is what the capture
    // did. It is the sharper scenario anyway: it pins that the loaded record
    // round-trips losslessly through the request schema.
    await save(wrapper)

    return api.requests()
  }, (requests) => {
    const stripped = withoutProbes(requests)
    // DECLARED EXCEPTION (#325): the recording's PATCH carries `id`,
    // `contract_text`, `companylogo_url` and `companylogo_workorder_url`,
    // because the old form handed the loaded record straight back. The
    // request schema accepts none of them from this form, so the rewritten
    // form drops the four. Every other part of every request still matches.
    const { id, contract_text, companylogo_url, companylogo_workorder_url, ...writable } =
      stripped.find((sent) => sent.method === 'patch').body
    return withBody(stripped, 'patch', writable)
  })

  test('confirms the update and goes back', async () => {
    const wrapper = await mountMemberForm({ pk: 19 })

    await typeInto(wrapper, 'member_name', 'SHLTR Renamed')
    await save(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Member has been updated')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('tells the user when the member cannot be fetched', async () => {
    api.get('/api/member/member/{id}/', serverError)

    await mountMemberForm({ pk: 19 })

    expect(toasts().map((toast) => toast.body)).toContain('Error fetching member')
  })

  test('tells the user why the update failed, and stays on the form', async () => {
    api.patch('/api/member/member/{id}/', serverError)
    const wrapper = await mountMemberForm({ pk: 19 })

    await save(wrapper)

    // The reason is the API's own - DRF's {detail} envelope, verbatim.
    expect(toasts().map((toast) => toast.body).some((body) => body.includes('boom'))).toBe(true)
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('MemberForm, saving', () => {
  test('a save in progress is visible and cannot be submitted twice', async () => {
    let release
    api.post('/api/member/member/', () => new Promise((resolve) => { release = resolve }))
    const wrapper = await mountMemberForm()

    await fillRequired(wrapper)
    await chooseLogo(wrapper, 'Company logo')
    await until(() => probes().length === 1)

    await wrapper.get('footer .btn-primary').trigger('click')
    await wrapper.get('footer .btn-primary').trigger('click')
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'post')).toHaveLength(1)
    expect(wrapper.find('.b-overlay').exists()).toBe(true)
    expect(wrapper.get('footer .btn-primary').attributes('disabled')).toBeDefined()

    release(DETAIL)
    await settle()
  })

  // #313's complaint, ended at its other half: the list shows the saved
  // change when the user comes back, because the save invalidated the list
  // queries - served here over one shared cache, the way the application
  // runs.
  test('returning to the list shows the saved change without a manual refresh', async () => {
    const queryClient = createTestQueryClient()

    api.get(
      '/api/member/member/',
      paginated([fixtureFor(itemSchemaOf(vPaginatedMemberList), { id: 19, name: 'SHLTR' })], { count: 1 }),
    )
    const listBefore = await mountListView(MemberList, {
      deep: true,
      routes: memberRoutes,
      auth: { isSuperuser: true },
      queryClient,
    })
    await until(() => listBefore.text().includes('SHLTR'))

    api.get(
      '/api/member/member/',
      paginated([fixtureFor(itemSchemaOf(vPaginatedMemberList), { id: 19, name: 'SHLTR Renamed' })], { count: 1 }),
    )
    const wrapper = await mountMemberForm({ pk: 19 }, { queryClient })
    await typeInto(wrapper, 'member_name', 'SHLTR Renamed')
    await save(wrapper)

    const listAfter = await mountListView(MemberList, {
      deep: true,
      routes: memberRoutes,
      auth: { isSuperuser: true },
      queryClient,
    })
    // Invalidated by the save, so this remount refetches rather than serving
    // the stale page it still holds.
    await until(() => listAfter.text().includes('SHLTR Renamed'))
  })
})

describe('MemberForm, requesting a member', () => {
  // The request flow (staff inviting a new member) fixes five fields at
  // submit, whatever the form showed: it is a request, not a full onboarding.
  test('forces the request flags onto the create it sends', async () => {
    const wrapper = await mountMemberForm({ isRequest: true })

    await fillRequired(wrapper)
    await chooseLogo(wrapper, 'Company logo')
    await save(wrapper)

    const post = api.requests().find((sent) => sent.method === 'post')
    expect(post.body).toMatchObject({
      is_requested: true,
      is_public: true,
      has_api_users: false,
      is_deleted: false,
      equipment_qr_type: 'my24service',
    })
    expect(toasts().map((toast) => toast.body)).toContain('Request has been created')
  })
})

describe('MemberForm, cancelling', () => {
  test('goes back without sending anything', async () => {
    const wrapper = await mountMemberForm()

    await fillRequired(wrapper)
    await wrapper.get('footer .btn-secondary').trigger('click')
    await settle()

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })
})
