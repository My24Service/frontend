import { describe, expect, test } from 'vitest'
import * as v from 'valibot'

import { vSalesUserRequestWritable } from '@/api/valibot.gen'

import {
  emptySalesUser,
  validateSalesUserForm,
} from '@/features/user/sales/schemas'

const valid = {
  username: 'jan',
  first_name: 'Jan',
  last_name: 'Jansen',
  email: 'jan@example.test',
  password1: 'secret-password',
  password2: 'secret-password',
  uses_time_registration: true,
  contract_hours_week: '38.00',
}

describe('vSalesUserRequestWritable', () => {
  test('accepts a payload the API would store', () => {
    expect(
      v.safeParse(vSalesUserRequestWritable, {
        username: 'jan',
        email: 'jan@example.test',
        first_name: 'Jan',
        last_name: 'Jansen',
        sales_user: {uses_time_registration: true, contract_hours_week: '38.00'},
      }).success,
    ).toBe(true)
  })

  test('is the generated request schema, with the identity fields made required', () => {
    expect(v.safeParse(vSalesUserRequestWritable, {
      username: '',
      email: 'jan@example.test',
      first_name: 'Jan',
      last_name: 'Jansen',
      sales_user: {},
    }).success).toBe(false)

    expect(v.safeParse(vSalesUserRequestWritable, {
      username: 'jan',
      email: 'not-an-email',
      first_name: 'Jan',
      last_name: 'Jansen',
      sales_user: {},
    }).success).toBe(false)

    expect(v.safeParse(vSalesUserRequestWritable, {
      username: 'jan',
      email: 'jan@example.test',
      first_name: 'Jan',
      last_name: 'Jansen',
      sales_user: {},
    }).success).toBe(true)
  })

  test('strips fields the request schema does not declare', () => {
    const result = v.parse(vSalesUserRequestWritable, {
      username: 'jan',
      email: 'jan@example.test',
      first_name: 'Jan',
      last_name: 'Jansen',
      sales_user: {},
      password1: 'secret-password',
      password2: 'secret-password',
      id: 11,
      full_name: 'Jan Jansen',
      num_customers: 3,
    })
    expect(Object.keys(result).sort()).toEqual(
      ['email', 'first_name', 'last_name', 'sales_user', 'username'],
    )
  })
})

describe('emptySalesUser', () => {
  test('gives a fresh form its defaults', () => {
    expect(emptySalesUser()).toEqual({
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      password1: '',
      password2: '',
      uses_time_registration: false,
      contract_hours_week: '0.00',
    })
  })

  test('the defaults are not yet submittable on create', () => {
    const errors = validateSalesUserForm(emptySalesUser(), {isCreate: true})
    expect(errors.username).toBe('Username is required')
    expect(errors.first_name).toBe('Please enter a first name')
    expect(errors.email).toBe('Please enter a valid email address')
    expect(errors.password1).toBe('Please enter a password')
  })
})

describe('validateSalesUserForm', () => {
  test('passes a good payload with no messages', () => {
    expect(validateSalesUserForm(valid, {isCreate: true})).toEqual({})
  })

  test('blames each blank field by name', () => {
    expect(validateSalesUserForm({...valid, username: ''}, {isCreate: true}).username)
      .toBe('Username is required')
    expect(validateSalesUserForm({...valid, email: 'nope'}, {isCreate: true}).email)
      .toBe('Please enter a valid email address')
    expect(validateSalesUserForm({...valid, first_name: ''}, {isCreate: true}).first_name)
      .toBe('Please enter a first name')
    expect(validateSalesUserForm({...valid, last_name: ''}, {isCreate: true}).last_name)
      .toBe('Please enter a last name')
  })

  test('on create both passwords are required and must match', () => {
    expect(validateSalesUserForm({...valid, password1: '', password2: ''}, {isCreate: true}))
      .toEqual({
        password1: 'Please enter a password',
        password2: 'Passwords do not match',
      })
    expect(validateSalesUserForm({...valid, password2: 'other'}, {isCreate: true}))
      .toEqual({password2: 'Passwords do not match'})
  })

  test('on edit empty passwords pass, a filled one still needs its confirm', () => {
    expect(validateSalesUserForm({...valid, password1: '', password2: ''}, {isCreate: false}))
      .toEqual({})
    expect(validateSalesUserForm({...valid, password1: 'new-secret', password2: ''}, {isCreate: false}))
      .toEqual({password2: 'Passwords do not match'})
    expect(validateSalesUserForm(
      {...valid, password1: 'new-secret', password2: 'new-secret'},
      {isCreate: false},
    )).toEqual({})
  })
})

/**
 * The API's username charset (`/^[\w.@+-]+$/`) is declared by the generated
 * request schema. It went unenforced for as long as this form redeclared the
 * `username` entry instead of using it.
 */
describe('username charset', () => {
  test('it refuses a username the API would refuse', () => {
    const values = {
      ...emptySalesUser(),
      username: 'jan jansen',
      first_name: 'Jan',
      last_name: 'Jansen',
      email: 'jan@example.test',
      password1: 'secret-password',
      password2: 'secret-password',
    }
    expect(validateSalesUserForm(values, { isCreate: true }).username)
      .toBe('Please use only letters, digits and @ . + - _')
  })
})
