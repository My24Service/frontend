import { describe, expect, test } from 'vitest'
import * as v from 'valibot'

import { fieldErrors, requiredOrMaxLength } from '@/features/forms/validation'

/**
 * `fieldErrors` is where a form's copy meets a request schema's issues, so its
 * keying rule is the contract every form's template renders against.
 *
 * A field is keyed by its whole path: a flat schema's field is its own name,
 * and a sub-object's (`api_user.name`) carries the path. A nested `mobile` and
 * a top-level one are therefore different keys, and neither shadows the other.
 */

const FLAT = v.object({
  username: v.pipe(v.string(), v.minLength(1)),
  email: v.pipe(v.string(), v.regex(/@/)),
  unaddressed: v.pipe(v.string(), v.minLength(4)),
})

const NESTED = v.object({
  username: v.pipe(v.string(), v.minLength(1)),
  api_user: v.object({
    name: v.pipe(v.string(), v.minLength(1)),
    expire_in_days: v.pipe(v.number(), v.minValue(1)),
  }),
})

const FLAT_MESSAGES = {
  username: () => 'Username is required',
  email: () => 'Please enter a valid email',
}

describe('fieldErrors, flat schemas', () => {
  test('keys each issue by the field valibot blamed', () => {
    const errors = fieldErrors(FLAT, { username: '', email: 'nope', unaddressed: '' }, FLAT_MESSAGES)

    expect(errors.username).toBe('Username is required')
    expect(errors.email).toBe('Please enter a valid email')
  })

  test('a field the messages do not name keeps valibot\'s own message', () => {
    const errors = fieldErrors(FLAT, { username: 'jan', email: 'jan@example.test' }, FLAT_MESSAGES)

    expect(Object.keys(errors)).toEqual(['unaddressed'])
    expect(errors.unaddressed).toEqual(expect.any(String))
    expect(errors.unaddressed).not.toBe('')
  })

  test('reports only the first issue per field', () => {
    const twice = v.object({ name: v.pipe(v.string(), v.minLength(3), v.regex(/^[a-z]+$/)) })

    const errors = fieldErrors(twice, { name: 'AB' }, { name: () => 'Lower-case letters only' })

    expect(errors).toEqual({ name: 'Lower-case letters only' })
  })

  test('a passing payload has no errors at all', () => {
    expect(fieldErrors(FLAT, { username: 'jan', email: 'jan@example.test', unaddressed: 'fine' },
      FLAT_MESSAGES)).toEqual({})
  })
})

describe('fieldErrors, nested schemas', () => {
  test('keys a sub-object issue by its whole path', () => {
    const errors = fieldErrors(NESTED, { username: 'jan', api_user: { name: '', expire_in_days: 0 } }, {
      username: FLAT_MESSAGES.username,
      api_user: {
        name: () => 'Name is required',
        expire_in_days: () => 'Please enter the number of days',
      },
    })

    expect(errors).toEqual({
      'api_user.name': 'Name is required',
      'api_user.expire_in_days': 'Please enter the number of days',
    })
  })

  test('a nested field and a top-level field of the same name do not collide', () => {
    const colliding = v.object({
      mobile: v.pipe(v.string(), v.minLength(1)),
      api_user: v.object({ mobile: v.pipe(v.string(), v.minLength(1)) }),
    })

    const errors = fieldErrors(colliding, { mobile: '', api_user: { mobile: '' } }, {
      mobile: () => 'Mobile is required',
      api_user: { mobile: () => 'The token owner\'s mobile is required' },
    })

    expect(errors).toEqual({
      mobile: 'Mobile is required',
      'api_user.mobile': 'The token owner\'s mobile is required',
    })
  })

  test('a top-level message still keys at the top level beside a nested tree', () => {
    const errors = fieldErrors(NESTED, { username: '', api_user: { name: 'Jan', expire_in_days: 1 } }, {
      username: FLAT_MESSAGES.username,
      api_user: {
        name: () => 'Name is required',
        expire_in_days: () => 'Please enter the number of days',
      },
    })

    expect(errors).toEqual({ username: 'Username is required' })
  })

  test('a nested issue the tree does not name keys by its whole path', () => {
    const errors = fieldErrors(NESTED, { username: 'jan', api_user: { name: 'Jan', expire_in_days: 0 } }, {
      username: FLAT_MESSAGES.username,
      api_user: { name: () => 'Name is required' },
    })

    expect(Object.keys(errors)).toEqual(['api_user.expire_in_days'])
    expect(errors['api_user.expire_in_days']).toEqual(expect.any(String))
  })

  test('a sub-object the tree says nothing about keys each issue by path', () => {
    const errors = fieldErrors(NESTED, { username: 'jan', api_user: { name: '', expire_in_days: 0 } })

    expect(Object.keys(errors).sort()).toEqual(['api_user.expire_in_days', 'api_user.name'])
  })
})

describe('requiredOrMaxLength', () => {
  const message = requiredOrMaxLength(() => 'Please enter a name', () => 'Please use at most 255 characters')

  test('reports the max-length copy for a max_length issue', () => {
    expect(message({ type: 'max_length' })).toBe('Please use at most 255 characters')
  })

  test('reports the required copy for any other issue', () => {
    expect(message({ type: 'min_length' })).toBe('Please enter a name')
  })

  test('reports the required copy when called without an issue', () => {
    expect(message()).toBe('Please enter a name')
  })
})
