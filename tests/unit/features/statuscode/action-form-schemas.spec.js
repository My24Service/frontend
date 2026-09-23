import { describe, expect, test } from 'vitest'
import * as v from 'valibot'

import { vActionRequest } from '@/api/valibot.gen'

import {
  actionFromRecord,
  actionTypesFor,
  dateTriggerFieldsFor,
  emptyAction,
  parseAction,
  validateAction,
} from '@/features/statuscode'

const valid = {
  name: 'mail planning',
  type: 'email',
  description: '',
  address: 'planning@example.test',
  subject: 'Order {{ order_id }}',
  template: 'Beste planning',
  company_partner: null,
  json_conditions: [{ field: 'order_type', operator: '=', value: 'storing' }],
  querymode: 'or',
  override_status: false,
}

describe('vActionRequest', () => {
  test('accepts a payload the API would store', () => {
    expect(v.safeParse(vActionRequest, { ...valid, statuscode: 3 }).success).toBe(true)
  })

  test('already refuses a blank name, an unknown type and a blank condition part', () => {
    expect(v.safeParse(vActionRequest, { ...valid, statuscode: 3, name: '' }).success).toBe(false)
    expect(v.safeParse(vActionRequest, { ...valid, statuscode: 3, type: 'carrier_pigeon' }).success).toBe(false)
    expect(v.safeParse(vActionRequest, {
      ...valid, statuscode: 3, json_conditions: [{ field: '', operator: '=', value: 'x' }],
    }).success).toBe(false)
  })
})

describe('emptyAction', () => {
  test('starts as an email action matching any condition, and needs a name', () => {
    expect(emptyAction()).toMatchObject({ type: 'email', querymode: 'or', json_conditions: [], override_status: false })
    expect(validateAction(emptyAction())).toEqual({ name: 'Please enter a name' })
  })
})

describe('validateAction', () => {
  test('passes a good form with no messages', () => {
    expect(validateAction(valid)).toEqual({})
  })

  test('blames the name for being over-long', () => {
    expect(validateAction({ ...valid, name: 'a'.repeat(121) })).toEqual({ name: 'Please use at most 120 characters' })
  })
})

describe('parseAction', () => {
  test('stamps the statuscode on a create', () => {
    expect(parseAction(valid, { isCreate: true, statuscodePk: '3' })).toMatchObject({ statuscode: 3, name: 'mail planning' })
  })

  test('keeps the statuscode the record came with on an edit', () => {
    expect(parseAction({ ...valid, statuscode: 8 }, { isCreate: false, statuscodePk: null }).statuscode).toBe(8)
  })

  test('sends blank optional texts as null', () => {
    const body = parseAction({ ...valid, address: '', subject: '', template: '', description: '' }, { isCreate: true, statuscodePk: '3' })

    expect(body).toMatchObject({ address: null, subject: null, template: null, description: null })
  })

  test('carries a date trigger with the days as a number', () => {
    const body = parseAction(
      { ...valid, num_days: '14', num_days_operator: '<=', num_days_model_field: 'start_date' },
      { isCreate: true, statuscodePk: '3' },
    )

    expect(body).toMatchObject({ num_days: 14, num_days_operator: '<=', num_days_model_field: 'start_date' })
  })

  test('without a date field sends no days either', () => {
    const body = parseAction(
      { ...valid, num_days: '14', num_days_model_field: '' },
      { isCreate: true, statuscodePk: '3' },
    )

    expect(body).toMatchObject({ num_days: null, num_days_model_field: null })
  })
})

describe('validateAction, the date trigger', () => {
  test('wants the number of days once a date field is picked', () => {
    expect(validateAction({ ...valid, num_days: '', num_days_model_field: 'start_date' }))
      .toEqual({ num_days: 'Please enter a whole number' })
  })

  test('refuses a number of days that is not whole', () => {
    expect(validateAction({ ...valid, num_days: '2.5', num_days_model_field: 'start_date' }))
      .toHaveProperty('num_days')
  })
})

describe('dateTriggerFieldsFor', () => {
  test('offers the date fields the backend accepts, and none for other types', () => {
    expect(dateTriggerFieldsFor('order')).toEqual(['start_date', 'end_date'])
    expect(dateTriggerFieldsFor('invoice')).toEqual(['definitive_date'])
    expect(dateTriggerFieldsFor('quotation')).toEqual([])
  })
})

describe('actionFromRecord', () => {
  test('takes the form’s fields off a record, statuscode included', () => {
    const values = actionFromRecord({
      id: 7, ...valid, statuscode: 3, destination: null, conditions: '',
    })

    expect(values).toEqual({
      ...valid, statuscode: 3, num_days: null, num_days_operator: '<=', num_days_model_field: null,
    })
  })

  test('gives a record with null conditions an empty list to add to', () => {
    expect(actionFromRecord({ id: 7, ...valid, statuscode: 3, json_conditions: null, destination: null, conditions: '' }).json_conditions).toEqual([])
  })
})

describe('actionTypesFor', () => {
  test('an order offers the full set, with Gripp only when the tenant has the connector', () => {
    const without = actionTypesFor('order', { hasGripp: false }).map((option) => option.value)
    expect(without).toEqual(['email', 'email_assigned', 'copy', 'status', 'email_workorders', 'send_sms', 'send_fcm'])

    const withGripp = actionTypesFor('order', { hasGripp: true }).map((option) => option.value)
    expect(withGripp).toEqual([...without, 'send_to_gripp'])
  })

  test('every other type offers email, sms and FCM', () => {
    for (const type of ['quotation', 'invoice', 'leave_hours', 'sick_leave', 'work_hours']) {
      expect(actionTypesFor(type, { hasGripp: true }).map((option) => option.value)).toEqual(['email', 'send_sms', 'send_fcm'])
    }
  })
})
