import { beforeEach, describe, expect, test, vi } from 'vitest'
import { vPartnerRequest, vPartnerSelect } from '@/api/valibot.gen'
import PartnerRequestsSentForm from '@/features/company/partner/PartnerRequestsSentForm.vue'
import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: spy } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: spy }) }
})

const api = installApiSeam()

const CREATE_PATH = '/api/company/partner-request/'

const MEMBERS = [
  fixtureFor(vPartnerSelect, { id: 11, name: 'Acme BV', city: 'Utrecht' }),
  fixtureFor(vPartnerSelect, { id: 12, name: 'Beta BV', city: 'Amsterdam' }),
]

const multiselectStub = {
  props: ['options'],
  emits: ['select', 'search-change'],
  template: '<div />',
}

const bodies = () => toasts().map((toast) => toast.body)

beforeEach(() => {
  api.get('/api/member/member/get_for_partner_select/', MEMBERS)
  api.post(CREATE_PATH, ({ body }) => fixtureFor(vPartnerRequest, { id: 31, ...body }))
})

function mountRequestForm(options = {}) {
  return mountForm(PartnerRequestsSentForm, {
    deep: true,
    stubs: { VueMultiselect: multiselectStub },
    ...options,
  })
}

function picker(wrapper) {
  return wrapper.findAllComponents(multiselectStub)[0]
}

describe('PartnerRequestsSentForm', () => {
  test('searching narrows the member picker server-side', async () => {
    const wrapper = mountRequestForm()
    await settle()

    // The mount searches once unfiltered, like the legacy screen's created().
    const reads = () => api.requests().filter((request) =>
      request.method === 'get' && request.path === '/api/member/member/get_for_partner_select/')
    expect(reads()[0].query).toMatchObject({ q: '' })

    await picker(wrapper).vm.$emit('search-change', 'acme')
    await settle()

    expect(reads().at(-1).query).toMatchObject({ q: 'acme' })
  })

  test('selecting shows the member info and enables the submit', async () => {
    const wrapper = mountRequestForm()
    await settle()

    await picker(wrapper).vm.$emit('select', MEMBERS[0])
    await settle()

    expect(wrapper.get('#partner_request_company_info').element.value).toBe('Acme BV, Utrecht')
  })

  test('the validator requires a picked member', async () => {
    const { validatePartnerRequest } = await import('@/features/company/partner/schemas')

    // The submit button only renders once a member is picked, so the rule
    // guards the values directly rather than through the DOM.
    expect(validatePartnerRequest({ to_member: null })).toEqual({ to_member: 'Please select a member' })
    expect(validatePartnerRequest({ to_member: 11 })).toEqual({})
  })

  test('a picked member sends the request and goes back', async () => {
    const wrapper = mountRequestForm()
    await settle()

    await picker(wrapper).vm.$emit('select', MEMBERS[0])
    await settle()
    await wrapper.findAll('button').find((button) => button.text() === 'Submit').trigger('click')
    for (let i = 0; i < 4; i++) {
      await settle()
      await wrapper.vm.$nextTick()
    }

    const post = api.requests().find((request) => request.method === 'post')
    expect(post.path).toBe(CREATE_PATH)
    expect(post.body).toEqual({ from_member: null, to_member: 11 })
    expect(bodies()).toContain('Partner request has been sent')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a failed send keeps the pick and reports it', async () => {
    api.post(CREATE_PATH, serverError)
    const wrapper = mountRequestForm()
    await settle()

    await picker(wrapper).vm.$emit('select', MEMBERS[0])
    await settle()
    await wrapper.findAll('button').find((button) => button.text() === 'Submit').trigger('click')
    for (let i = 0; i < 4; i++) {
      await settle()
      await wrapper.vm.$nextTick()
    }

    expect(bodies()).toContain('Error sending partner request')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})
