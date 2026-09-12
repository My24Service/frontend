import { describe, expect, test } from 'vitest'
import * as v from 'valibot'

import { vStatuscodeRequest } from '@/api/valibot.gen'

import {
  emptyStatuscode,
  parseStatuscode,
  statuscodeFromRecord,
  validateStatuscode,
} from '@/features/statuscode/statuscode/schemas'

const valid = {
  statuscode: 'Aangemaakt',
  color: '#ff3300',
  text_color: '#ffffff',
  description: 'opdracht aangemaakt',
  new_status_template: 'aangemaakt door {{ username }}',
  num_days: null,
  num_days_operator: '<',
  num_days_model_field: null,
}

describe('vStatuscodeRequest', () => {
  test('accepts a payload the API would store', () => {
    expect(v.safeParse(vStatuscodeRequest, { ...valid, code_type: 'order' }).success).toBe(true)
  })

  test('already refuses a blank statuscode and a missing code type', () => {
    expect(v.safeParse(vStatuscodeRequest, { ...valid, code_type: 'order', statuscode: '' }).success).toBe(false)
    expect(v.safeParse(vStatuscodeRequest, valid).success).toBe(false)
  })

  test('is lax about the colour — that rule is the form’s', () => {
    expect(v.safeParse(vStatuscodeRequest, { ...valid, code_type: 'order', color: null }).success).toBe(true)
  })
})

describe('emptyStatuscode', () => {
  test('is not yet submittable: it needs a statuscode and a colour', () => {
    expect(validateStatuscode(emptyStatuscode())).toEqual({
      statuscode: 'Please enter a statuscode',
      color: 'Please choose a color',
    })
  })
})

describe('validateStatuscode', () => {
  test('passes a good form with no messages', () => {
    expect(validateStatuscode(valid)).toEqual({})
  })

  test('blames the colour when none was picked', () => {
    expect(validateStatuscode({ ...valid, color: '' })).toEqual({ color: 'Please choose a color' })
  })

  test('blames the number of days when it is not a whole number', () => {
    expect(validateStatuscode({ ...valid, num_days: '2.5', num_days_model_field: 'created' })).toEqual({
      num_days: 'Please enter a valid integer',
    })
  })
})

describe('parseStatuscode', () => {
  test('stamps the code type on the body', () => {
    expect(parseStatuscode(valid, 'quotation').code_type).toBe('quotation')
  })

  test('sends a cleared description and template as null, so an edit can blank them', () => {
    const body = parseStatuscode({ ...valid, description: '', new_status_template: '', text_color: '' }, 'order')

    expect(body.description).toBeNull()
    expect(body.new_status_template).toBeNull()
    expect(body.text_color).toBeNull()
  })

  test('carries the expiry condition for a quotation, with the days as a number', () => {
    const body = parseStatuscode(
      { ...valid, num_days: '14', num_days_operator: '>=', num_days_model_field: 'created' },
      'quotation',
    )

    expect(body).toMatchObject({ num_days: 14, num_days_operator: '>=', num_days_model_field: 'created' })
  })

  test('leaves the expiry condition off every other code type', () => {
    const body = parseStatuscode(
      { ...valid, num_days: '14', num_days_operator: '>=', num_days_model_field: 'created' },
      'order',
    )

    expect('num_days' in body).toBe(false)
    expect('num_days_operator' in body).toBe(false)
    expect('num_days_model_field' in body).toBe(false)
  })
})

describe('statuscodeFromRecord', () => {
  test('takes the form’s fields off a record and nothing else', () => {
    const values = statuscodeFromRecord({
      id: 3,
      code_type: 'quotation',
      actions: [],
      settings_key: 'x',
      ...valid,
      num_days: 7,
      num_days_model_field: 'created',
    })

    expect(values).toEqual({ ...valid, num_days: 7, num_days_model_field: 'created' })
  })

  test('gives a record with no operator the form’s default', () => {
    expect(statuscodeFromRecord({ id: 3, code_type: 'order', actions: [], ...valid, num_days_operator: undefined }).num_days_operator).toBe('<')
  })
})
