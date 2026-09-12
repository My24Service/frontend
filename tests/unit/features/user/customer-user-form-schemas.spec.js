import { describe, expect, test } from 'vitest'
import * as v from 'valibot'

import { vCustomerUserRequestWritable } from '@/api/valibot.gen'

import {
  emptyCustomerUser,
  validateCustomerUserForm,
} from '@/features/user/customer/schemas'

const valid = {
  username: 'cust-jan',
  first_name: 'Jan',
  last_name: 'Klant',
  email: 'cust-jan@example.test',
  password1: 'secret-password',
  password2: 'secret-password',
  customer_user: {
    customer: 5,
    settings_group: 'default',
  },
}

describe('vCustomerUserRequestWritable', () => {
  test('accepts a payload the API would store', () => {
    expect(
      v.safeParse(vCustomerUserRequestWritable, {
        username: 'cust-jan',
        email: 'cust-jan@example.test',
        first_name: 'Jan',
        last_name: 'Klant',
        customer_user: { customer: 5, settings_group: 'default' },
      }).success,
    ).toBe(true)
  })

  test('is the generated request schema, with the identity fields made required', () => {
    expect(v.safeParse(vCustomerUserRequestWritable, {
      username: '',
      email: 'cust-jan@example.test',
      first_name: 'Jan',
      last_name: 'Klant',
      customer_user: {},
    }).success).toBe(false)

    expect(v.safeParse(vCustomerUserRequestWritable, {
      username: 'cust-jan',
      email: 'not-an-email',
      first_name: 'Jan',
      last_name: 'Klant',
      customer_user: {},
    }).success).toBe(false)
  })

  test('the customer link stays optional — unlinked users are legal', () => {
    expect(v.safeParse(vCustomerUserRequestWritable, {
      username: 'cust-jan',
      email: 'cust-jan@example.test',
      first_name: 'Jan',
      last_name: 'Klant',
      customer_user: { customer: null, settings_group: '' },
    }).success).toBe(true)
  })

  test('strips fields the request schema does not declare', () => {
    const result = v.parse(vCustomerUserRequestWritable, {
      username: 'cust-jan',
      email: 'cust-jan@example.test',
      first_name: 'Jan',
      last_name: 'Klant',
      customer_user: { customer: 5, settings_group: 'default' },
      password1: 'secret-password',
      password2: 'secret-password',
      id: 31,
      full_name: 'Jan Klant',
    })
    expect(Object.keys(result).sort()).toEqual(
      ['customer_user', 'email', 'first_name', 'last_name', 'username'],
    )
  })
})

describe('emptyCustomerUser', () => {
  test('gives a fresh form its defaults', () => {
    expect(emptyCustomerUser()).toEqual({
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      password1: '',
      password2: '',
      customer_user: {
        customer: null,
        settings_group: '',
      },
    })
  })

  test('the defaults are not yet submittable on create', () => {
    const errors = validateCustomerUserForm(emptyCustomerUser(), {isCreate: true})
    expect(errors.username).toBe('Username is required')
    expect(errors.first_name).toBe('Please enter a first name')
    expect(errors.email).toBe('Please enter a valid email')
    expect(errors.password1).toBe('Please enter a password')
  })
})

describe('validateCustomerUserForm', () => {
  test('passes a good payload with no messages', () => {
    expect(validateCustomerUserForm(valid, {isCreate: true})).toEqual({})
  })

  test('blames each blank field by name', () => {
    expect(validateCustomerUserForm({...valid, username: ''}, {isCreate: true}).username)
      .toBe('Username is required')
    expect(validateCustomerUserForm({...valid, email: 'nope'}, {isCreate: true}).email)
      .toBe('Please enter a valid email')
    expect(validateCustomerUserForm({...valid, first_name: ''}, {isCreate: true}).first_name)
      .toBe('Please enter a first name')
    expect(validateCustomerUserForm({...valid, last_name: ''}, {isCreate: true}).last_name)
      .toBe('Please enter a last name')
  })

  test('on create both passwords are required and must match', () => {
    expect(validateCustomerUserForm({...valid, password1: '', password2: ''}, {isCreate: true}))
      .toEqual({
        password1: 'Please enter a password',
        password2: 'Passwords do not match',
      })
    expect(validateCustomerUserForm({...valid, password2: 'other'}, {isCreate: true}))
      .toEqual({password2: 'Passwords do not match'})
  })

  test('on edit empty passwords pass, a filled one still needs its confirm', () => {
    expect(validateCustomerUserForm({...valid, password1: '', password2: ''}, {isCreate: false}))
      .toEqual({})
    expect(validateCustomerUserForm({...valid, password1: 'new-secret', password2: ''}, {isCreate: false}))
      .toEqual({password2: 'Passwords do not match'})
    expect(validateCustomerUserForm(
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
      ...emptyCustomerUser(),
      username: 'jan jansen',
      first_name: 'Jan',
      last_name: 'Jansen',
      email: 'jan@example.test',
      password1: 'secret-password',
      password2: 'secret-password',
    }
    expect(validateCustomerUserForm(values, { isCreate: true }).username)
      .toBe('Please use only letters, digits and @ . + - _')
  })
})
