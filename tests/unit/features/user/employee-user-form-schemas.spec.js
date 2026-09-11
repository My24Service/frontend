import { describe, expect, test } from 'vitest'
import * as v from 'valibot'

import { vEmployeeUserRequestWritable } from '@/api/valibot.gen'

import {
  emptyEmployeeUser,
  validateEmployeeUserForm,
} from '@/features/user/employee/schemas'

const valid = {
  username: 'emp-jan',
  first_name: 'Jan',
  last_name: 'Employee',
  email: 'emp-jan@example.test',
  password1: 'secret-password',
  password2: 'secret-password',
  contract_hours_week: '38.00',
  branch: null,
}

describe('vEmployeeUserRequestWritable', () => {
  test('accepts a payload the API would store', () => {
    expect(
      v.safeParse(vEmployeeUserRequestWritable, {
        username: 'emp-jan',
        email: 'emp-jan@example.test',
        first_name: 'Jan',
        last_name: 'Employee',
        employee_user: {uses_time_registration: true, contract_hours_week: '38.00', branch: null},
      }).success,
    ).toBe(true)
  })

  test('is the generated request schema, with the identity fields made required', () => {
    expect(v.safeParse(vEmployeeUserRequestWritable, {
      username: '',
      email: 'emp-jan@example.test',
      first_name: 'Jan',
      last_name: 'Employee',
      employee_user: {},
    }).success).toBe(false)

    expect(v.safeParse(vEmployeeUserRequestWritable, {
      username: 'emp-jan',
      email: 'not-an-email',
      first_name: 'Jan',
      last_name: 'Employee',
      employee_user: {},
    }).success).toBe(false)

    expect(v.safeParse(vEmployeeUserRequestWritable, {
      username: 'emp-jan',
      email: 'emp-jan@example.test',
      first_name: 'Jan',
      last_name: 'Employee',
      employee_user: {},
    }).success).toBe(true)
  })

  test('leaves the branch null until one is picked', () => {
    expect(v.safeParse(vEmployeeUserRequestWritable, {
      username: 'emp-jan',
      email: 'emp-jan@example.test',
      first_name: 'Jan',
      last_name: 'Employee',
      employee_user: {contract_hours_week: '38.00', branch: null},
    }).success).toBe(true)

    expect(v.safeParse(vEmployeeUserRequestWritable, {
      username: 'emp-jan',
      email: 'emp-jan@example.test',
      first_name: 'Jan',
      last_name: 'Employee',
      employee_user: {contract_hours_week: '38.00', branch: 7},
    }).success).toBe(true)
  })

  test('strips fields the request schema does not declare', () => {
    const result = v.parse(vEmployeeUserRequestWritable, {
      username: 'emp-jan',
      email: 'emp-jan@example.test',
      first_name: 'Jan',
      last_name: 'Employee',
      employee_user: {},
      password1: 'secret-password',
      password2: 'secret-password',
      id: 31,
      full_name: 'Jan Employee',
    })
    expect(Object.keys(result).sort()).toEqual(
      ['email', 'employee_user', 'first_name', 'last_name', 'username'],
    )
  })
})

describe('emptyEmployeeUser', () => {
  test('gives a fresh form its defaults', () => {
    expect(emptyEmployeeUser()).toEqual({
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      password1: '',
      password2: '',
      contract_hours_week: '0.00',
      branch: null,
    })
  })

  test('the defaults are not yet submittable on create', () => {
    const errors = validateEmployeeUserForm(emptyEmployeeUser(), {isCreate: true})
    expect(errors.username).toBe('Username is required')
    expect(errors.first_name).toBe('Please enter a first name')
    expect(errors.email).toBe('Please enter a valid email')
    expect(errors.password1).toBe('Please enter a password')
  })
})

describe('validateEmployeeUserForm', () => {
  test('passes a good payload with no messages', () => {
    expect(validateEmployeeUserForm(valid, {isCreate: true})).toEqual({})
  })

  test('passes a good payload with a branch picked', () => {
    expect(validateEmployeeUserForm({...valid, branch: 7}, {isCreate: true})).toEqual({})
  })

  test('blames each blank field by name', () => {
    expect(validateEmployeeUserForm({...valid, username: ''}, {isCreate: true}).username)
      .toBe('Username is required')
    expect(validateEmployeeUserForm({...valid, email: 'nope'}, {isCreate: true}).email)
      .toBe('Please enter a valid email')
    expect(validateEmployeeUserForm({...valid, first_name: ''}, {isCreate: true}).first_name)
      .toBe('Please enter a first name')
    expect(validateEmployeeUserForm({...valid, last_name: ''}, {isCreate: true}).last_name)
      .toBe('Please enter a last name')
  })

  test('on create both passwords are required and must match', () => {
    expect(validateEmployeeUserForm({...valid, password1: '', password2: ''}, {isCreate: true}))
      .toEqual({
        password1: 'Please enter a password',
        password2: 'Passwords do not match',
      })
    expect(validateEmployeeUserForm({...valid, password2: 'other'}, {isCreate: true}))
      .toEqual({password2: 'Passwords do not match'})
  })

  test('on edit empty passwords pass, a filled one still needs its confirm', () => {
    expect(validateEmployeeUserForm({...valid, password1: '', password2: ''}, {isCreate: false}))
      .toEqual({})
    expect(validateEmployeeUserForm({...valid, password1: 'new-secret', password2: ''}, {isCreate: false}))
      .toEqual({password2: 'Passwords do not match'})
    expect(validateEmployeeUserForm(
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
      ...emptyEmployeeUser(),
      username: 'jan jansen',
      first_name: 'Jan',
      last_name: 'Jansen',
      email: 'jan@example.test',
      password1: 'secret-password',
      password2: 'secret-password',
    }
    expect(validateEmployeeUserForm(values, { isCreate: true }).username)
      .toBe('Please use only letters, digits and @ . + - _')
  })
})
