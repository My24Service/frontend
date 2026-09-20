import { beforeEach, describe, expect, test, vi } from 'vitest'

import { SettingsForm } from '@/features/member'
import { vMemberSettings } from '@/api/valibot.gen'
import { parseSettings, settingsFromRecord, validateSettings } from '@/features/member/settings/schemas'

import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../../support/form-harness.js'
import { memberRoutes } from '../../support/member-routes.js'

/**
 * The typed settings screen: one record per tenant, read and patched on
 * /api/member/member/my_settings/. Seams: the typed read into the form, the
 * lists as comma text, what the form refuses, and the patch on the wire.
 */

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

const SETTINGS = fixtureFor(vMemberSettings, {
  countries: ['NL', 'BE'],
  order_types: ['onderhoud', 'projecten'],
  date_format: '%d/%m/%Y',
  default_currency: 'EUR',
  invoice_default_vat: 21,
  invoice_default_hourly_rate: '45.00',
  invoice_default_call_out_costs: '0.00',
  invoice_default_price_per_km: '0.00',
  invoice_default_term_of_payment_days: 30,
  quotation_default_expire_days: 30,
  quotation_default_call_out_costs: '0.00',
  quotation_default_vat: 21,
  quotation_default_hourly_rate: '0.00',
  quotation_default_price_per_km: '0.00',
  customer_id_autoincrement: true,
  order_uses_equipment: false,
  sick_leave_user_allowed_create: false,
  sick_leave_user_allowed_end: false,
  equipment_planning_quick_create: true,
  equipment_quick_create: true,
  equipment_location_planning_quick_create: true,
  equipment_location_quick_create: true,
  order_list_include_reference: false,
  workorder_show_related_orders: false,
  break_calculation: false,
  customer_id_start: 1000,
  order_id: 10000,
  quotation_id: 1000,
  workorder_id: 1000,
  purchase_order_id: 10000,
  invoice_id: 1000,
  break_calculation_after_minutes: 480,
  break_calculation_duration_minutes: 30,
  app_session_token_expiry_days: 14,
})

beforeEach(() => {
  api.get('/api/member/member/my_settings/', SETTINGS)
  api.patch('/api/member/member/my_settings/', SETTINGS)
})

async function mountSettingsForm() {
  const wrapper = mountForm(SettingsForm, { deep: true, routes: memberRoutes })
  await settle()
  return wrapper
}

async function type(wrapper, selector, value) {
  const field = wrapper.get(selector)
  await field.setValue(value)
  await field.trigger('change')
}

async function submit(wrapper) {
  await wrapper.get('header .btn-primary').trigger('click')
  await settle()
  await wrapper.vm.$nextTick()
}

function shownFeedback(wrapper) {
  return wrapper.findAll('.invalid-feedback').filter((node) => node.classes('d-block')).map((node) => node.text())
}

describe('settings schemas', () => {
  test('settingsFromRecord holds lists as comma text and numbers as text', () => {
    const values = settingsFromRecord(SETTINGS)
    expect(values.countries).toBe('NL, BE')
    expect(values.order_id).toBe('10000')
    expect(values.invoice_default_hourly_rate).toBe('45.00')
    expect(values.break_calculation).toBe(false)
  })

  test('parseSettings puts the typed body on the wire', () => {
    const body = parseSettings({ ...settingsFromRecord(SETTINGS), countries: 'nl , de', order_id: '20000', invoice_default_hourly_rate: '12,5' })
    expect(body.countries).toEqual(['nl', 'de'])
    expect(body.order_id).toBe(20000)
    expect(body.invoice_default_hourly_rate).toBe('12.5')
    expect(body.break_calculation).toBe(false)
  })

  test('validateSettings refuses a non-integer counter, a bad amount and an empty list', () => {
    const errors = validateSettings({ ...settingsFromRecord(SETTINGS), order_id: '12a', invoice_default_vat: '2.5', quotation_default_hourly_rate: 'abc', countries: '' })
    expect(errors.order_id).toBe('Please enter a number')
    expect(errors.invoice_default_vat).toBe('Please enter a whole number')
    expect(errors.quotation_default_hourly_rate).toBe('Please enter an amount, like 12.50')
    expect(errors.countries).toBe('Please enter a countries')
    expect(Object.keys(errors)).toHaveLength(4)
  })
})

describe('SettingsForm', () => {
  test('reads the typed settings into grouped fields', async () => {
    const wrapper = await mountSettingsForm()

    expect(api.requests()).toEqual([{ method: 'get', path: '/api/member/member/my_settings/', query: {} }])
    expect(wrapper.findAll('.settings-group h6').map((node) => node.text())).toEqual([
      'Locale', 'Invoice', 'Quotation', 'Order', 'Equipment', 'Break calculation',
    ])
    expect(wrapper.get('#settings_countries').element.value).toBe('NL, BE')
    expect(wrapper.get('#settings_order_id').element.value).toBe('10000')
    expect(wrapper.get('#settings_equipment_quick_create').element.checked).toBe(true)
    expect(wrapper.get('#settings_break_calculation').element.checked).toBe(false)
    expect(wrapper.find('#settings_gripp_api_key').exists()).toBe(false)
  })

  test('patches the whole typed body and stays on the screen', async () => {
    const wrapper = await mountSettingsForm()

    await type(wrapper, '#settings_order_id', '20000')
    await wrapper.get('#settings_break_calculation').setValue(true)
    await submit(wrapper)

    const patch = api.requests().find((request) => request.method === 'patch')
    expect(patch.path).toBe('/api/member/member/my_settings/')
    expect(patch.body.order_id).toBe(20000)
    expect(patch.body.break_calculation).toBe(true)
    expect(patch.body.countries).toEqual(['NL', 'BE'])
    expect(Object.keys(patch.body)).toHaveLength(34)
    expect(toasts().map((toast) => toast.body)).toContain('Settings updated')
    expect(routerGo()).not.toHaveBeenCalled()
  })

  test('refuses a bad counter and sends nothing', async () => {
    const wrapper = await mountSettingsForm()

    await type(wrapper, '#settings_invoice_id', '2.5')
    await submit(wrapper)

    expect(shownFeedback(wrapper)).toContain('Please enter a whole number')
    expect(api.requests().filter((request) => request.method === 'patch')).toEqual([])
  })
})
