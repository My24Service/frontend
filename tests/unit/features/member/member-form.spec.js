import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'
import { HttpResponse } from 'msw'

import { BFormFile } from 'bootstrap-vue-next'

import { MemberForm, MemberList } from '@/features/member'
import {
  vMember,
  vPaginatedContractList,
  vPaginatedMemberList,
} from '@/api/valibot.gen'

import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { companyLogoPng, member19 } from '../../fixtures/member-demo-tenant.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { createTestQueryClient, mountForm, mountListView, routerGo, toasts } from '../../support/form-harness.js'

enableAutoUnmount(afterEach)
import { serverError } from '../../support/list-harness.js'
import { memberRoutes } from '../../support/member-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

const CONTRACTS = paginated(
  [
    { id: 6, name: 'Advanced+' },
    { id: 23, name: 'My24Service Light' },
    { id: 26, name: 'My24Service no Q&I' },
    { id: 28, name: 'My24Service Normal' },
  ].map((row) => fixtureFor(itemSchemaOf(vPaginatedContractList), row)),
  { count: 9 },
)

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

const COMPANYCODE = 'thisnewmember'

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

async function fillRequired(wrapper, { code = COMPANYCODE } = {}) {
  for (const [id, value] of Object.entries(REQUIRED)) {
    await typeInto(wrapper, id, value)
  }
  if (code !== null) await typeInto(wrapper, 'member_companycode', code)
}

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

async function until(condition, { attempts = 200 } = {}) {
  for (let i = 0; i < attempts; i++) {
    if (condition()) return
    await settle()
  }
  throw new Error('condition never became true')
}

function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function dataUrlFor(bytes) {
  return `data:image/png;base64,${btoa(String.fromCharCode(...bytes))}`
}

function selectFor(wrapper, label) {
  const group = wrapper.findAll('.b-form-group').find((node) => node.text().includes(label))
  return group.get('select')
}

function logoInput(wrapper, label) {
  const group = wrapper.findAll('.b-form-group').find((node) => node.text().includes(label))
  return group.get('input[type="file"]')
}

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

function writes() {
  return api.requests().filter((sent) => ['post', 'patch', 'put', 'delete'].includes(sent.method)).length
}

async function clickSubmit(wrapper, selector) {
  const before = writes()
  await wrapper.get(selector).trigger('click')

  try {
    await until(
      () => writes() > before || wrapper.findAll('.invalid-feedback.d-block').length > 0,
      {attempts: 2000},
    )
  } catch {
  }
  await settle()
  await wrapper.vm.$nextTick()
}

async function save(wrapper) {
  await clickSubmit(wrapper, 'header .btn-primary')
}

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

function withoutProbes(requests) {
  return requests.filter((sent) => sent.path !== '/api/member/companycode-exists/')
}

/**
 * Everything the create puts on the wire, in order: the contract dropdown, then
 * the write. The `companycode-exists` probes the form fires while the code is
 * typed are not listed; `withoutProbes` drops them from the live side.
 *
 * `page_size` 1000 is the API's paginator ceiling (my24service
 * apps/core/rest.py My24Pagination.max_page_size), which clamps a larger value
 * rather than rejecting it: the dropdown needs the whole collection, not a page.
 *
 * The values are the ones `fillRequired` types and `companyLogoPng` uploads.
 */
const CREATE_ON_THE_WIRE = [
  {
    method: 'get',
    path: '/api/member/contract/',
    query: { page: '1', page_size: '1000' },
  },
  {
    method: 'post',
    path: '/api/member/member/',
    query: {},
    body: {
      companycode: 'thisnewmember',
      name: 'New member',
      address: 'blastraat 123',
      postal: '1234AZ',
      city: 'Amsterdam',
      country_code: 'NL',
      tel: '0612345678',
      www: 'https://example.com',
      email: 'info@example.com',
      contacts: 'Me',
      activities: 'Developing',
      info: 'This is a test',
      companylogo: 'data:image/png;base64,' + companyLogoPng,
      contract: 6,
      is_deleted: false,
      member_type: 'maintenance',
      is_public: true,
      has_api_users: false,
      has_branches: false,
      equipment_qr_type: 'shltr',
      is_requested: true,
      has_mobile_activity_user_select: false,
    },
  },
]

describe('MemberForm, creating a member', () => {
  test('opens on an empty form headed New member', async () => {
    const wrapper = await mountMemberForm()

    expect(wrapper.text()).toContain('New member')
    expect(wrapper.get('#member_name').element.value).toBe('')
  })

  test('sizes the single-line fields small and leaves the four-line boxes alone', async () => {
    // The plain fields render through the shared ValidatedFormField, whose
    // input is sm to match the sm label. Its textarea must not pick that size
    // up: form-control-sm shrinks the font of the contacts/activities/info
    // boxes, which are not small fields.
    const wrapper = await mountMemberForm()

    expect(wrapper.get('#member_name').classes()).toContain('form-control-sm')
    for (const id of ['member_contacts', 'member_activities', 'member_info']) {
      expect(wrapper.get(`#${id}`).classes()).not.toContain('form-control-sm')
    }
  })

  test('offers the contracts the backend returned', async () => {
    const wrapper = await mountMemberForm()

    expect(wrapper.findAll('option').map((option) => option.text())).toContain('Advanced+')
  })

  // The dropdown is filled from this one read, so it must carry more than the
  // API's default page of 20 contracts (my24service apps/core/rest.py
  // My24Pagination: page_size 20, max_page_size 1000).
  test('asks for every contract, not just the first page', async () => {
    await mountMemberForm()

    const contracts = api.requests().find((sent) => sent.path === '/api/member/contract/')

    expect(contracts.query).toEqual({ page: '1', page_size: '1000' })
  })

  test('shows the chosen company logo as the upload preview', async () => {
    const wrapper = await mountMemberForm()

    await chooseLogo(wrapper, 'Company logo')

    expect(previews(wrapper).some((src) => src?.startsWith('data:image/png;base64,'))).toBe(true)
  })

  test('ignores a file whose extension is not an accepted image', async () => {
    const wrapper = await mountMemberForm()

    await chooseLogo(wrapper, 'Company logo', { filename: 'contract.pdf' })

    expect(previews(wrapper).some((src) => src?.startsWith('data:'))).toBe(false)
  })

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

  test('a second choice into the same logo field replaces the first', async () => {
    const wrapper = await mountMemberForm()

    await chooseLogo(wrapper, 'Company logo')
    const replacement = Uint8Array.from([9, 8, 7, 6])
    await chooseLogo(wrapper, 'Company logo', { bytes: replacement })
    await fillRequired(wrapper)
    await save(wrapper)

    const post = api.requests().find((sent) => sent.method === 'post')
    expect(post.body.companylogo).toBe(dataUrlFor(replacement))
  })

  test('reads a plain native change event, not just the synthesized shape', async () => {
    const wrapper = await mountMemberForm()

    const event = new Event('change')
    Object.defineProperty(event, 'target', {
      value: { files: [new File([logoBytes()], 'logo.png', { type: 'image/png' })] },
    })
    wrapper.getComponent(BFormFile).vm.$emit('change', event)
    await settle()
    await wrapper.vm.$nextTick()

    expect(previews(wrapper).some((src) => src?.startsWith('data:image/png;base64,'))).toBe(true)
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

    expect(feedbackShown(wrapper, 'Please select a company logo')).toBe(true)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })

  test('puts the create on the wire', async () => {
    const wrapper = await mountMemberForm()

    await fillRequired(wrapper)
    await selectFor(wrapper, 'Equipment QR code type').setValue('shltr')
    await chooseLogo(wrapper, 'Company logo')
    await save(wrapper)

    expect(withoutProbes(api.requests())).toEqual(CREATE_ON_THE_WIRE)
  })

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

    expect(toasts().map((toast) => toast.body).some((body) => body.includes('boom'))).toBe(true)
    expect(routerGo()).not.toHaveBeenCalled()
  })

  test('reads a field-map rejection into the toast it shows', async () => {
    api.post('/api/member/member/', () => new HttpResponse(
      JSON.stringify({
        name: ['This field may not be blank'],
        companycode: ['A member with this company code already exists'],
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    ))
    const wrapper = await mountMemberForm()

    await fillRequired(wrapper)
    await chooseLogo(wrapper, 'Company logo')
    await save(wrapper)

    const bodies = toasts().map((toast) => toast.body)
    expect(bodies.some((body) => body.includes('name: This field may not be blank'))).toBe(true)
    expect(bodies.some((body) =>
      body.includes('companycode: A member with this company code already exists'))).toBe(true)
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('MemberForm, the company-code check', () => {
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

    await until(() => wrapper.get('#member_companycode').classes('is-valid'))
  })

  test('asks only after the ticketed half-second of quiet', async () => {
    const wrapper = await mountMemberForm()

    await typeCompanyCodePerKeystroke(wrapper, COMPANYCODE)

    await pause(200)
    await settle()
    expect(probes()).toEqual([])

    await pause(500)
    await settle()
    expect(probes()).toHaveLength(1)
  })

  test('a failed probe does not block the save', async () => {
    api.get('/api/member/companycode-exists/', serverError)
    const wrapper = await mountMemberForm()

    await fillRequired(wrapper)
    await chooseLogo(wrapper, 'Company logo')
    await until(() => probes().length === 1)

    await save(wrapper)
    await until(() => api.requests().some((sent) => sent.method === 'post'))

    expect(toasts().map((toast) => toast.body)).toContain('Member has been created')
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

    await save(wrapper)
    await until(() => api.requests().some((sent) => sent.method === 'post'))

    const order = api.requests().map((sent) => sent.path)
    expect(order.indexOf('/api/member/companycode-exists/')).toBeLessThan(order.indexOf('/api/member/member/'))
    expect(toasts().map((toast) => toast.body)).toContain('Member has been created')
  })
})

/**
 * The reads and the write the edit makes, in order. The PATCH body carries the
 * record's own stored values back to the backend, so only the request line is
 * pinned here; the field set the form sends is pinned by the tests above that
 * read `patch.body`.
 */
const EDIT_ON_THE_WIRE = [
  { method: 'get', path: '/api/member/contract/', query: { page: '1', page_size: '1000' } },
  { method: 'get', path: '/api/member/member/19/', query: {} },
  { method: 'patch', path: '/api/member/member/19/', query: {} },
]

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

  test('an untouched edit sends no logos back', async () => {
    const wrapper = await mountMemberForm({ pk: 19 })

    await save(wrapper)

    const patch = api.requests().find((sent) => sent.method === 'patch')
    expect(patch.body).not.toHaveProperty('companylogo')
    expect(patch.body).not.toHaveProperty('companylogo_workorder')
  })

  test('a replacement chosen while editing rides the PATCH', async () => {
    const wrapper = await mountMemberForm({ pk: 19 })

    await chooseLogo(wrapper, 'Company logo')
    await chooseLogo(wrapper, 'workorder')
    await save(wrapper)

    const patch = api.requests().find((sent) => sent.method === 'patch')
    expect(patch.body.companylogo.startsWith('data:image/png;base64,')).toBe(true)
    expect(patch.body.companylogo_workorder.startsWith('data:image/png;base64,')).toBe(true)
  })

  test('puts the update on the wire', async () => {
    const wrapper = await mountMemberForm({ pk: 19 })

    await save(wrapper)

    expect(
      withoutProbes(api.requests()).map(({ method, path, query }) => ({ method, path, query })),
    ).toEqual(EDIT_ON_THE_WIRE)
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
    await until(() => listAfter.text().includes('SHLTR Renamed'))
  })
})

describe('MemberForm, requesting a member', () => {
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
