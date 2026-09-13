import { beforeEach, describe, expect, test, vi } from 'vitest'

import { StatuscodeForm } from '@/features/statuscode'
import { vStatuscode } from '@/api/valibot.gen'

import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { statuscodeRoutes } from '../../support/statuscode-routes.js'

/**
 * The statuscode create/edit form, mounted per code type from either tree.
 *
 * Seams under test: the create and the update on the wire, what the form
 * refuses, the blank-to-null of the optional texts, the expiry condition
 * that only a quotation carries, and the invoice type — which the legacy
 * form threw on.
 */

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

const STATUSCODE = fixtureFor(vStatuscode, {
  id: 3,
  code_type: 'quotation',
  statuscode: 'Verzonden',
  color: '#ff3300',
  text_color: '#ffffff',
  description: 'offerte verzonden',
  new_status_template: 'verzonden door {{ username }}',
  actions: [],
  num_days: 14,
  num_days_operator: '>=',
  num_days_model_field: 'sent',
})

// vue3-colorpicker has no DOM worth driving under happy-dom; this stands in
// for it with the one contract the form uses — `v-model:pureColor`.
const ColorPickerStub = {
  props: ['pureColor', 'format'],
  emits: ['update:pureColor'],
  template: '<input class="color-stub" :value="pureColor" :data-format="format" @input="$emit(\'update:pureColor\', $event.target.value)" />',
}

beforeEach(() => {
  api.get('/api/statuscode/statuscode/{id}/', STATUSCODE)
  api.post('/api/statuscode/statuscode/', STATUSCODE)
  api.patch('/api/statuscode/statuscode/{id}/', STATUSCODE)
})

async function mountStatuscodeForm({ codeType = 'order', fromSettings = false, pk = null } = {}) {
  const wrapper = mountForm(StatuscodeForm, {
    deep: true,
    routes: statuscodeRoutes,
    props: { codeType, fromSettings, pk },
    stubs: { ColorPicker: ColorPickerStub },
  })
  await settle()
  return wrapper
}

async function type(wrapper, selector, value) {
  const field = wrapper.get(selector)
  await field.setValue(value)
  await field.trigger('change')
}

async function pickColor(wrapper, which, value) {
  const pickers = wrapper.findAll('.color-stub')
  const picker = pickers[which === 'text' ? 1 : 0]
  await picker.setValue(value)
}

async function submit(wrapper) {
  await wrapper.get('header .btn-primary').trigger('click')
  await settle()
  await wrapper.vm.$nextTick()
}

function shownFeedback(wrapper) {
  return wrapper
    .findAll('.invalid-feedback')
    .filter((node) => node.classes('d-block'))
    .map((node) => node.text())
}

describe('StatuscodeForm, creating a statuscode', () => {
  test('asks both pickers for hex — the wire takes seven characters, not rgb()', async () => {
    const wrapper = await mountStatuscodeForm()

    expect(wrapper.findAll('.color-stub').map((picker) => picker.attributes('data-format'))).toEqual(['hex', 'hex'])
  })

  test('opens empty, headed by a link back to the type’s list', async () => {
    const wrapper = await mountStatuscodeForm({ codeType: 'leave_hours' })

    expect(wrapper.get('#statuscode_statuscode').element.value).toBe('')
    expect(wrapper.get('header a').attributes('href')).toBe('/company/statuscodes/leave_hours')
    expect(wrapper.text()).toContain('new')
  })

  test('the settings tree links back into the settings tree', async () => {
    const wrapper = await mountStatuscodeForm({ codeType: 'leave_hours', fromSettings: true })

    expect(wrapper.get('header a').attributes('href')).toBe('/settings/statuscodes/leave_hours')
  })

  test('puts the create on the wire with the code type, blank texts as null', async () => {
    const wrapper = await mountStatuscodeForm({ codeType: 'order' })

    await type(wrapper, '#statuscode_statuscode', 'Gepland')
    await pickColor(wrapper, 'background', '#00ff00')
    await submit(wrapper)

    expect(api.requests()).toEqual([
      {
        method: 'post',
        path: '/api/statuscode/statuscode/',
        query: {},
        body: {
          code_type: 'order',
          statuscode: 'Gepland',
          color: '#00ff00',
          text_color: null,
          description: null,
          new_status_template: null,
        },
      },
    ])
  })

  test('confirms the creation and goes back', async () => {
    const wrapper = await mountStatuscodeForm()

    await type(wrapper, '#statuscode_statuscode', 'Gepland')
    await pickColor(wrapper, 'background', '#00ff00')
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Statuscode has been created')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('refuses a statuscode with no text and no colour, and sends nothing', async () => {
    const wrapper = await mountStatuscodeForm()

    await submit(wrapper)

    expect(shownFeedback(wrapper)).toEqual(expect.arrayContaining(['Please enter a statuscode', 'Please choose a color']))
    expect(api.requests()).toEqual([])
  })

  test('tells the user when the create fails, and stays on the form', async () => {
    api.post('/api/statuscode/statuscode/', serverError)
    const wrapper = await mountStatuscodeForm()

    await type(wrapper, '#statuscode_statuscode', 'Gepland')
    await pickColor(wrapper, 'background', '#00ff00')
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error creating statuscode')
    expect(routerGo()).not.toHaveBeenCalled()
  })

  test('an invoice statuscode can be created — the legacy form threw on this type', async () => {
    const wrapper = await mountStatuscodeForm({ codeType: 'invoice' })

    await type(wrapper, '#statuscode_statuscode', 'Betaald')
    await pickColor(wrapper, 'background', '#00ff00')
    await submit(wrapper)

    expect(api.requests().at(-1)).toMatchObject({ method: 'post', body: { code_type: 'invoice', statuscode: 'Betaald' } })
  })
})

describe('StatuscodeForm, the expiry condition', () => {
  test('is offered for a quotation and rides the wire with the days as a number', async () => {
    const wrapper = await mountStatuscodeForm({ codeType: 'quotation' })

    expect(wrapper.text()).toContain('Expiry condition')

    await type(wrapper, '#statuscode_statuscode', 'Verzonden')
    await pickColor(wrapper, 'background', '#00ff00')
    await type(wrapper, '#statuscode_num_days_model_field', 'sent')
    await wrapper.get('#statuscode_num_days_operator').setValue('>=')
    await type(wrapper, '#statuscode_num_days', '14')
    await submit(wrapper)

    expect(api.requests().at(-1).body).toMatchObject({
      num_days: 14,
      num_days_operator: '>=',
      num_days_model_field: 'sent',
    })
  })

  test('is not offered for any other type, and stays off the wire', async () => {
    const wrapper = await mountStatuscodeForm({ codeType: 'order' })

    expect(wrapper.text()).not.toContain('Expiry condition')
    expect(wrapper.find('#statuscode_num_days').exists()).toBe(false)
  })
})

describe('StatuscodeForm, editing a statuscode', () => {
  test('opens on the statuscode it was given, expiry condition included', async () => {
    const wrapper = await mountStatuscodeForm({ codeType: 'quotation', pk: 3 })

    expect(wrapper.get('#statuscode_statuscode').element.value).toBe('Verzonden')
    expect(wrapper.get('#statuscode_description').element.value).toBe('offerte verzonden')
    expect(wrapper.findAll('.color-stub')[0].element.value).toBe('#ff3300')
    expect(wrapper.findAll('.color-stub')[1].element.value).toBe('#ffffff')
    expect(wrapper.get('#statuscode_num_days').element.value).toBe('14')
    expect(wrapper.get('#statuscode_num_days_operator').element.value).toBe('>=')
    expect(wrapper.get('#statuscode_num_days_model_field').element.value).toBe('sent')
  })

  test('shows the live preview in the picked colours', async () => {
    const wrapper = await mountStatuscodeForm({ codeType: 'quotation', pk: 3 })

    const preview = wrapper.get('.statuscode-preview')
    expect(preview.text()).toBe('Verzonden')
    expect(preview.attributes('style')).toContain('--bg-color: #ff3300')
    expect(preview.attributes('style')).toContain('--text-color: #ffffff')
  })

  test('puts the update on the wire as a patch of the whole form', async () => {
    const wrapper = await mountStatuscodeForm({ codeType: 'quotation', pk: 3 })

    await type(wrapper, '#statuscode_description', '')
    await submit(wrapper)

    expect(api.requests()).toEqual([
      { method: 'get', path: '/api/statuscode/statuscode/3/', query: {} },
      {
        method: 'patch',
        path: '/api/statuscode/statuscode/3/',
        query: {},
        body: {
          code_type: 'quotation',
          statuscode: 'Verzonden',
          color: '#ff3300',
          text_color: '#ffffff',
          description: null,
          new_status_template: 'verzonden door {{ username }}',
          num_days: 14,
          num_days_operator: '>=',
          num_days_model_field: 'sent',
        },
      },
    ])
    expect(toasts().map((toast) => toast.body)).toContain('Statuscode has been updated')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('tells the user when the statuscode cannot be fetched', async () => {
    api.get('/api/statuscode/statuscode/{id}/', serverError)

    await mountStatuscodeForm({ codeType: 'quotation', pk: 3 })

    expect(toasts().map((toast) => toast.body)).toContain('Error loading statuscode')
  })

  test('cancel goes back without writing', async () => {
    const wrapper = await mountStatuscodeForm({ codeType: 'quotation', pk: 3 })

    await wrapper.get('header .btn-secondary').trigger('click')

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(api.requests().filter((sent) => sent.method !== 'get')).toEqual([])
  })
})
