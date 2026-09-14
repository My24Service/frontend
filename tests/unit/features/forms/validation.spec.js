import { describe, expect, test } from 'vitest'
import * as v from 'valibot'

import { fieldErrors } from '@/features/forms/validation'

/**
 * `fieldErrors` is where a form's copy meets a request schema's issues, so its
 * keying rule is the contract every form's template renders against.
 *
 * Two shapes have to hold at once. A flat schema keys each issue by the field
 * valibot blamed — the behaviour every existing form was written against, so
 * it must not move. A schema with a sub-object (`api_user`, `student_user`)
 * can address a message to a nested path, which keys the error by the deepest
 * leaf the tree maps, not by the sub-object's own name.
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
  test('keys a sub-object issue by the leaf the message tree maps', () => {
    const errors = fieldErrors(NESTED, { username: 'jan', api_user: { name: '', expire_in_days: 0 } }, {
      username: FLAT_MESSAGES.username,
      api_user: {
        name: () => 'Name is required',
        expire_in_days: () => 'Please enter the number of days',
      },
    })

    expect(errors).toEqual({
      name: 'Name is required',
      expire_in_days: 'Please enter the number of days',
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

  test('falls back to the outermost segment when the tree stops short', () => {
    const errors = fieldErrors(NESTED, { username: 'jan', api_user: { name: 'Jan', expire_in_days: 0 } }, {
      username: FLAT_MESSAGES.username,
      api_user: { name: () => 'Name is required' },
    })

    expect(Object.keys(errors)).toEqual(['api_user'])
    expect(errors.api_user).toEqual(expect.any(String))
  })

  test('a sub-object the tree says nothing about keeps its own key', () => {
    const errors = fieldErrors(NESTED, { username: 'jan', api_user: { name: '', expire_in_days: 0 } })

    expect(Object.keys(errors).sort()).toEqual(['api_user'])
  })
})
