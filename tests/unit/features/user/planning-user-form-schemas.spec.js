import { describe, expect, test } from 'vitest'
import * as v from 'valibot'

import { vPlanningUserRequestWritable } from '@/api/valibot.gen'

import {
  emptyPlanningUser,
  validatePlanningUserForm,
} from '@/features/user'

const valid = {
  username: 'plan-jan',
  first_name: 'Jan',
  last_name: 'Planner',
  email: 'plan-jan@example.test',
  password1: 'secret-password',
  password2: 'secret-password',
  planning_user: {
    uses_time_registration: true,
    contract_hours_week: '38.00',
  },
}

describe('vPlanningUserRequestWritable', () => {
  test('accepts a payload the API would store', () => {
    expect(
      v.safeParse(vPlanningUserRequestWritable, {
        username: 'plan-jan',
        email: 'plan-jan@example.test',
        first_name: 'Jan',
        last_name: 'Planner',
        planning_user: {uses_time_registration: true, contract_hours_week: '38.00'},
      }).success,
    ).toBe(true)
  })

  test('is the generated request schema, with the identity fields made required', () => {
    expect(v.safeParse(vPlanningUserRequestWritable, {
      username: '',
      email: 'plan-jan@example.test',
      first_name: 'Jan',
      last_name: 'Planner',
      planning_user: {},
    }).success).toBe(false)

    expect(v.safeParse(vPlanningUserRequestWritable, {
      username: 'plan-jan',
      email: 'not-an-email',
      first_name: 'Jan',
      last_name: 'Planner',
      planning_user: {},
    }).success).toBe(false)

    expect(v.safeParse(vPlanningUserRequestWritable, {
      username: 'plan-jan',
      email: 'plan-jan@example.test',
      first_name: 'Jan',
      last_name: 'Planner',
      planning_user: {},
    }).success).toBe(true)
  })

  test('strips fields the request schema does not declare', () => {
    const result = v.parse(vPlanningUserRequestWritable, {
      username: 'plan-jan',
      email: 'plan-jan@example.test',
      first_name: 'Jan',
      last_name: 'Planner',
      planning_user: {},
      password1: 'secret-password',
      password2: 'secret-password',
      id: 21,
      full_name: 'Jan Planner',
    })
    expect(Object.keys(result).sort()).toEqual(
      ['email', 'first_name', 'last_name', 'planning_user', 'username'],
    )
  })
})

describe('emptyPlanningUser', () => {
  test('gives a fresh form its defaults', () => {
    expect(emptyPlanningUser()).toEqual({
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      password1: '',
      password2: '',
      planning_user: {
        uses_time_registration: false,
        contract_hours_week: '0.00',
      },
    })
  })

  test('the defaults are not yet submittable on create', () => {
    const errors = validatePlanningUserForm(emptyPlanningUser(), {isCreate: true})
    expect(errors.username).toBe('Please enter a username')
    expect(errors.first_name).toBe('Please enter a first name')
    expect(errors.email).toBe('Please enter a valid email')
    expect(errors.password1).toBe('Please enter a password')
  })
})

describe('validatePlanningUserForm', () => {
  test('passes a good payload with no messages', () => {
    expect(validatePlanningUserForm(valid, {isCreate: true})).toEqual({})
  })

  test('blames each blank field by name', () => {
    expect(validatePlanningUserForm({...valid, username: ''}, {isCreate: true}).username)
      .toBe('Please enter a username')
    expect(validatePlanningUserForm({...valid, email: 'nope'}, {isCreate: true}).email)
      .toBe('Please enter a valid email')
    expect(validatePlanningUserForm({...valid, first_name: ''}, {isCreate: true}).first_name)
      .toBe('Please enter a first name')
    expect(validatePlanningUserForm({...valid, last_name: ''}, {isCreate: true}).last_name)
      .toBe('Please enter a last name')
  })

  test('on create both passwords are required and must match', () => {
    expect(validatePlanningUserForm({...valid, password1: '', password2: ''}, {isCreate: true}))
      .toEqual({
        password1: 'Please enter a password',
        password2: 'Passwords do not match',
      })
    expect(validatePlanningUserForm({...valid, password2: 'other'}, {isCreate: true}))
      .toEqual({password2: 'Passwords do not match'})
  })

  test('on edit empty passwords pass, a filled one still needs its confirm', () => {
    expect(validatePlanningUserForm({...valid, password1: '', password2: ''}, {isCreate: false}))
      .toEqual({})
    expect(validatePlanningUserForm({...valid, password1: 'new-secret', password2: ''}, {isCreate: false}))
      .toEqual({password2: 'Passwords do not match'})
    expect(validatePlanningUserForm(
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
      ...emptyPlanningUser(),
      username: 'jan jansen',
      first_name: 'Jan',
      last_name: 'Jansen',
      email: 'jan@example.test',
      password1: 'secret-password',
      password2: 'secret-password',
    }
    expect(validatePlanningUserForm(values, { isCreate: true }).username)
      .toBe('Please use only letters, digits and @ . + - _')
  })
})
