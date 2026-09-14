import { describe, expect, test } from 'vitest'
import * as v from 'valibot'

import { vEngineerRequestWritable } from '@/api/valibot.gen'

import {
  emptyEngineerUser,
  validateEngineerUserForm,
} from '@/features/user/engineer/schemas'

const valid = {
  username: 'eng-jan',
  first_name: 'Jan',
  last_name: 'Monteur',
  email: 'eng-jan@example.test',
  password1: 'secret-password',
  password2: 'secret-password',
  engineer: {
    mobile: '+31612345678',
    address: 'Main 1',
    postal: '1234 AB',
    city: 'Amsterdam',
    country_code: 'NL',
    passport: 'N12345678',
    email_tablet: 'tablet@example.test',
    vca: 'VCA-1',
    cost_price: '10.00',
    license_plate: 'AB-123-C',
    contract_hours_week: '38.00',
    hourly_rate: '25.00',
    preferred_location: 7,
    hide_from_dispatch: false,
  },
}

/** `valid` with some of its engineer fields replaced. */
function withEngineer(engineer, values = valid) {
  return { ...values, engineer: { ...values.engineer, ...engineer } }
}

describe('vEngineerRequestWritable', () => {
  test('accepts a payload the API would store', () => {
    expect(
      v.safeParse(vEngineerRequestWritable, {
        username: 'eng-jan',
        email: 'eng-jan@example.test',
        first_name: 'Jan',
        last_name: 'Monteur',
        engineer: {
          mobile: '+31612345678',
          hourly_rate: '25.00',
          preferred_location: 7,
          hide_from_dispatch: false,
        },
      }).success,
    ).toBe(true)
  })

  test('is the generated request schema, with the identity fields made required', () => {
    expect(v.safeParse(vEngineerRequestWritable, {
      username: '',
      email: 'eng-jan@example.test',
      first_name: 'Jan',
      last_name: 'Monteur',
      engineer: { hourly_rate: '25.00' },
    }).success).toBe(false)

    expect(v.safeParse(vEngineerRequestWritable, {
      username: 'eng-jan',
      email: 'not-an-email',
      first_name: 'Jan',
      last_name: 'Monteur',
      engineer: { hourly_rate: '25.00' },
    }).success).toBe(false)

    expect(v.safeParse(vEngineerRequestWritable, {
      username: 'eng-jan',
      email: 'eng-jan@example.test',
      first_name: 'Jan',
      last_name: 'Monteur',
      engineer: { hourly_rate: '25.00' },
    }).success).toBe(true)
  })

  test('the preferred location stays optional — engineers without one are legal', () => {
    expect(v.safeParse(vEngineerRequestWritable, {
      username: 'eng-jan',
      email: 'eng-jan@example.test',
      first_name: 'Jan',
      last_name: 'Monteur',
      engineer: { hourly_rate: '25.00', preferred_location: null },
    }).success).toBe(true)
  })

  test('strips fields the request schema does not declare', () => {
    const result = v.parse(vEngineerRequestWritable, {
      username: 'eng-jan',
      email: 'eng-jan@example.test',
      first_name: 'Jan',
      last_name: 'Monteur',
      engineer: { hourly_rate: '25.00' },
      password1: 'secret-password',
      password2: 'secret-password',
      id: 41,
      full_name: 'Jan Monteur',
      hourly_rate_currency: 'EUR',
    })
    expect(Object.keys(result).sort()).toEqual(
      ['email', 'engineer', 'first_name', 'last_name', 'username'],
    )
  })
})

describe('emptyEngineerUser', () => {
  test('gives a fresh form its defaults', () => {
    expect(emptyEngineerUser()).toEqual({
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      password1: '',
      password2: '',
      engineer: {
        mobile: '',
        address: '',
        postal: '',
        city: '',
        country_code: '',
        passport: '',
        email_tablet: '',
        vca: '',
        cost_price: '0.00',
        license_plate: '',
        contract_hours_week: '38.00',
        hourly_rate: '0.00',
        preferred_location: null,
        hide_from_dispatch: false,
      },
    })
  })

  test('the defaults are not yet submittable on create', () => {
    const errors = validateEngineerUserForm(emptyEngineerUser(), {isCreate: true})
    expect(errors.username).toBe('Username is required')
    expect(errors.first_name).toBe('Please enter a first name')
    expect(errors.email).toBe('Please enter a valid email')
    expect(errors.password1).toBe('Please enter a password')
    expect(errors.preferred_location).toBe('Please select a preferred location')
  })
})

describe('validateEngineerUserForm', () => {
  test('passes a good payload with no messages', () => {
    expect(validateEngineerUserForm(valid, {isCreate: true})).toEqual({})
  })

  test('blames each blank field by name', () => {
    expect(validateEngineerUserForm({...valid, username: ''}, {isCreate: true}).username)
      .toBe('Username is required')
    expect(validateEngineerUserForm({...valid, email: 'nope'}, {isCreate: true}).email)
      .toBe('Please enter a valid email')
    expect(validateEngineerUserForm({...valid, first_name: ''}, {isCreate: true}).first_name)
      .toBe('Please enter a first name')
    expect(validateEngineerUserForm({...valid, last_name: ''}, {isCreate: true}).last_name)
      .toBe('Please enter a last name')
  })

  test('on create both passwords are required and must match', () => {
    expect(validateEngineerUserForm({...valid, password1: '', password2: ''}, {isCreate: true}))
      .toEqual({
        password1: 'Please enter a password',
        password2: 'Passwords do not match',
      })
    expect(validateEngineerUserForm({...valid, password2: 'other'}, {isCreate: true}))
      .toEqual({password2: 'Passwords do not match'})
  })

  test('on edit empty passwords pass, a filled one still needs its confirm', () => {
    expect(validateEngineerUserForm({...valid, password1: '', password2: ''}, {isCreate: false}))
      .toEqual({})
    expect(validateEngineerUserForm({...valid, password1: 'new-secret', password2: ''}, {isCreate: false}))
      .toEqual({password2: 'Passwords do not match'})
    expect(validateEngineerUserForm(
      {...valid, password1: 'new-secret', password2: 'new-secret'},
      {isCreate: false},
    )).toEqual({})
  })

  test('refuses an unchosen preferred location, on create and on edit', () => {
    expect(validateEngineerUserForm(withEngineer({preferred_location: null}), {isCreate: true}).preferred_location)
      .toBe('Please select a preferred location')
    expect(validateEngineerUserForm(withEngineer({preferred_location: null}), {isCreate: false}).preferred_location)
      .toBe('Please select a preferred location')
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
      ...emptyEngineerUser(),
      username: 'jan jansen',
      first_name: 'Jan',
      last_name: 'Monteur',
      email: 'jan@example.test',
      password1: 'secret-password',
      password2: 'secret-password',
      engineer: { ...emptyEngineerUser().engineer, preferred_location: 7 },
    }
    expect(validateEngineerUserForm(values, { isCreate: true }).username)
      .toBe('Please use only letters, digits and @ . + - _')
  })
})
