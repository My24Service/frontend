import { describe, expect, test } from 'vitest'
import * as v from 'valibot'

import {
  fieldErrors,
  requiredMessage,
  requiredOrMaxLength,
  ruleMessage,
  selectMessage,
} from '@/features/forms'

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

  test('a field the messages do not name reads the rule\'s line with its key made readable', () => {
    const errors = fieldErrors(FLAT, { username: 'jan', email: 'jan@example.test', unaddressed: 'ab' },
      FLAT_MESSAGES)

    expect(errors).toEqual({ unaddressed: 'Please use at least 4 characters' })
  })

  test('a field the messages do not name reads the rule\'s line with the form\'s label', () => {
    const errors = fieldErrors(FLAT, { username: 'jan', email: 'jan@example.test', unaddressed: '' },
      FLAT_MESSAGES, { unaddressed: () => 'Remark' })

    expect(errors).toEqual({ unaddressed: 'Please enter a remark' })
  })

  test('a nested field reads its label by whole path first, then by last segment', () => {
    const values = { username: 'jan', api_user: { name: '', expire_in_days: 0 } }

    expect(fieldErrors(NESTED, values, {}, { 'api_user.name': () => 'Token name', expire_in_days: () => 'Days' }))
      .toEqual({ 'api_user.name': 'Please enter a token name', 'api_user.expire_in_days': 'Please enter a value of at least 1' })
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
        expire_in_days: () => 'Please enter a number of days',
      },
    })

    expect(errors).toEqual({
      'api_user.name': 'Name is required',
      'api_user.expire_in_days': 'Please enter a number of days',
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
        expire_in_days: () => 'Please enter a number of days',
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

describe('ruleMessage', () => {
  const issue = (type, extra = {}) => ({ kind: 'validation', type, ...extra })

  test.each([
    ['min_length', { requirement: 1, input: '' }, 'Please enter a name'],
    ['non_empty', { input: '' }, 'Please enter a name'],
    ['min_length', { requirement: 2, input: 'a' }, 'Please use at least 2 characters'],
    ['min_length', { requirement: 2, input: '' }, 'Please enter a name'],
    ['min_length', { requirement: 1, input: [] }, 'Please select a name'],
    ['max_length', { requirement: 255 }, 'Please use at most 255 characters'],
    ['min_value', { requirement: 1 }, 'Please enter a value of at least 1'],
    ['max_value', { requirement: 9 }, 'Please enter a value of at most 9'],
    ['integer', {}, 'Please enter a whole number'],
    ['email', {}, 'Please enter a valid email'],
    ['url', {}, 'Please enter a website'],
    ['regex', {}, 'Please enter a valid name'],
    ['check', {}, 'Please enter a valid name'],
  ])('%s → %s', (type, extra, expected) => {
    expect(ruleMessage(issue(type, extra), 'Name')).toBe(expected)
  })

  test('a schema issue on a null value, an enum or a list asks to select', () => {
    expect(ruleMessage({ kind: 'schema', type: 'number', received: 'null' }, 'Customer')).toBe('Please select a customer')
    expect(ruleMessage({ kind: 'schema', type: 'picklist', received: '""' }, 'Type')).toBe('Please select a type')
    expect(ruleMessage({ kind: 'schema', type: 'array', received: 'undefined' }, 'Roles')).toBe('Please select a roles')
  })

  test('a schema issue on an absent or empty text asks to enter', () => {
    expect(ruleMessage({ kind: 'schema', type: 'string', received: 'undefined' }, 'Name')).toBe('Please enter a name')
    expect(ruleMessage({ kind: 'schema', type: 'string', received: '""' }, 'Name')).toBe('Please enter a name')
  })

  test('a number input that did not parse asks for a number', () => {
    expect(ruleMessage({ kind: 'schema', type: 'number', received: 'NaN' }, 'Year')).toBe('Please enter a number')
  })

  test('any other schema issue is the generic line', () => {
    expect(ruleMessage({ kind: 'schema', type: 'number', received: '"x"' }, 'Year')).toBe('Please enter a valid year')
  })

  test('a label keeps its capital when it reads as an acronym or a compound', () => {
    expect(ruleMessage({ kind: 'schema', type: 'string', received: 'undefined' }, 'VAT number')).toBe('Please enter a VAT number')
    expect(ruleMessage({ kind: 'schema', type: 'string', received: 'undefined' }, 'E-mail')).toBe('Please enter an E-mail')
    expect(ruleMessage({ kind: 'schema', type: 'string', received: 'undefined' }, 'Customer ID')).toBe('Please enter a customer ID')
  })

  test('the article follows the noun, not its first letter', () => {
    expect(requiredMessage('order type')).toBe('Please enter an order type')
    expect(selectMessage('Order type')).toBe('Please select an order type')
    expect(requiredMessage('customer')).toBe('Please enter a customer')
    expect(requiredMessage('user')).toBe('Please enter a user')
    expect(requiredMessage('username')).toBe('Please enter a username')
    expect(requiredMessage('hour')).toBe('Please enter an hour')
  })
})
