import { describe, expect, test } from 'vitest'
import * as v from 'valibot'

import { vApiUserRequestWritable } from '@/api/valibot.gen'

import {
  emptyApiUser,
  parseApiUserForm,
  validateApiUserForm,
} from '@/features/user/api/schemas'

const valid = {
  username: 'api-jan',
  password1: 'secret-password',
  password2: 'secret-password',
  name: 'Jan integration',
  expire_start_dt: '2026-01-01',
  expire_in_days: 365,
}

describe('vApiUserRequestWritable', () => {
  test('accepts a payload the API would store', () => {
    expect(
      v.safeParse(vApiUserRequestWritable, {
        username: 'api-jan',
        password: 'secret-password',
        api_user: {
          name: 'Jan integration',
          expire_start_dt: '2026-01-01T00:00:00Z',
          expire_in_days: 365,
        },
      }).success,
    ).toBe(true)
  })

  test('is the generated request schema, with the username and the api_user name made required', () => {
    expect(v.safeParse(vApiUserRequestWritable, {
      username: '',
      api_user: {name: 'Jan integration', expire_in_days: 365},
    }).success).toBe(false)

    expect(v.safeParse(vApiUserRequestWritable, {
      username: 'api-jan',
      api_user: {name: '', expire_in_days: 365},
    }).success).toBe(false)

    expect(v.safeParse(vApiUserRequestWritable, {
      username: 'api-jan',
      api_user: {name: 'Jan integration', expire_in_days: 365},
    }).success).toBe(true)
  })

  test('leaves the token dates optional on the wire', () => {
    expect(v.safeParse(vApiUserRequestWritable, {
      username: 'api-jan',
      api_user: {name: 'Jan integration', expire_in_days: 365},
    }).success).toBe(true)
  })

  test('strips fields the request schema does not declare, including the read-only token', () => {
    const result = v.parse(vApiUserRequestWritable, {
      username: 'api-jan',
      api_user: {
        name: 'Jan integration',
        expire_in_days: 365,
        token: 'tok-active-1',
        token_is_revoked: false,
        uuid: '123e4567-e89b-12d3-a456-426614174000',
      },
      password1: 'secret-password',
      password2: 'secret-password',
      id: 41,
    })
    expect(Object.keys(result).sort()).toEqual(['api_user', 'username'])
    expect(Object.keys(result.api_user).sort()).toEqual(['expire_in_days', 'name'])
  })
})

describe('emptyApiUser', () => {
  test('gives a fresh form its defaults', () => {
    const fresh = emptyApiUser()
    expect({...fresh, expire_start_dt: 'YYYY-MM-DD'}).toEqual({
      username: '',
      password1: '',
      password2: '',
      name: '',
      expire_start_dt: 'YYYY-MM-DD',
      expire_in_days: 365,
    })
    // The legacy model prefilled today; the fresh form does too.
    expect(fresh.expire_start_dt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  test('the defaults are not yet submittable on create', () => {
    const errors = validateApiUserForm(emptyApiUser(), {isCreate: true})
    expect(errors.username).toBe('Username is required')
    expect(errors.name).toBe('Name is required')
    expect(errors.password1).toBe('Please enter a password')
  })
})

describe('validateApiUserForm', () => {
  test('passes a good payload with no messages', () => {
    expect(validateApiUserForm(valid, {isCreate: true})).toEqual({})
  })

  test('blames each blank field by name', () => {
    expect(validateApiUserForm({...valid, username: ''}, {isCreate: true}).username)
      .toBe('Username is required')
    expect(validateApiUserForm({...valid, name: ''}, {isCreate: true}).name)
      .toBe('Name is required')
    expect(validateApiUserForm({...valid, expire_start_dt: ''}, {isCreate: true}).expire_start_dt)
      .toBe('Please enter date')
    expect(validateApiUserForm({...valid, expire_in_days: ''}, {isCreate: true}).expire_in_days)
      .toBe('Please enter the number of days')
  })

  test('refuses token lifetimes the API would refuse', () => {
    expect(validateApiUserForm({...valid, expire_in_days: -1}, {isCreate: true}).expire_in_days)
      .toBe('Please enter the number of days')
    expect(validateApiUserForm({...valid, expire_in_days: 1.5}, {isCreate: true}).expire_in_days)
      .toBe('Please enter the number of days')
  })

  test('on create both passwords are required and must match', () => {
    expect(validateApiUserForm({...valid, password1: '', password2: ''}, {isCreate: true}))
      .toEqual({
        password1: 'Please enter a password',
        password2: 'Passwords do not match',
      })
    expect(validateApiUserForm({...valid, password2: 'other'}, {isCreate: true}))
      .toEqual({password2: 'Passwords do not match'})
  })

  test('on edit empty passwords pass, a filled one still needs its confirm', () => {
    expect(validateApiUserForm({...valid, password1: '', password2: ''}, {isCreate: false}))
      .toEqual({})
    expect(validateApiUserForm({...valid, password1: 'new-secret', password2: ''}, {isCreate: false}))
      .toEqual({password2: 'Passwords do not match'})
    expect(validateApiUserForm(
      {...valid, password1: 'new-secret', password2: 'new-secret'},
      {isCreate: false},
    )).toEqual({})
  })
})

/**
 * The API's username charset (`/^[\w.@+-]+$/`) is declared by the generated
 * request schema. It went unenforced for as long as the sibling forms
 * redeclared the `username` entry instead of using it.
 */
describe('username charset', () => {
  test('it refuses a username the API would refuse', () => {
    expect(validateApiUserForm({...valid, username: 'api jan'}, {isCreate: true}).username)
      .toBe('Please use only letters, digits and @ . + - _')
  })
})

/**
 * `expire_start_dt` is optional on the wire but required on the form: a token
 * without a start has no validity window to display. The strengthening lives
 * on the composed schema, not as a redeclared entry.
 */
describe('valid-from strengthening', () => {
  test('the form refuses what the endpoint would accept', () => {
    expect(v.safeParse(vApiUserRequestWritable, {
      username: 'api-jan',
      api_user: {name: 'Jan integration', expire_in_days: 365},
    }).success).toBe(true)
    expect(validateApiUserForm({...valid, expire_start_dt: ''}, {isCreate: true}).expire_start_dt)
      .toBe('Please enter date')
  })
})

describe('parseApiUserForm', () => {
  test('nests the sub-object, stamps the date and carries the password on create', () => {
    expect(parseApiUserForm(valid, {isCreate: true})).toEqual({
      username: 'api-jan',
      api_user: {
        name: 'Jan integration',
        expire_start_dt: '2026-01-01T00:00:00Z',
        expire_in_days: 365,
      },
      password: 'secret-password',
    })
  })

  test('leaves an untouched password off the edit body', () => {
    const body = parseApiUserForm({...valid, password1: '', password2: ''}, {isCreate: false})
    expect(body).not.toHaveProperty('password')
    expect(body.api_user).toEqual({
      name: 'Jan integration',
      expire_start_dt: '2026-01-01T00:00:00Z',
      expire_in_days: 365,
    })
  })

  test('a filled password rides the edit body', () => {
    const body = parseApiUserForm(
      {...valid, password1: 'new-secret', password2: 'new-secret'},
      {isCreate: false, password: 'new-secret'},
    )
    expect(body.password).toBe('new-secret')
  })
})
