import { describe, expect, test } from 'vitest'
import * as v from 'valibot'

import { vMemberModuleCreateBody } from '@/api/valibot.gen'

import { emptyModule, moduleWrite } from '@/features/member'

const valid = { name: 'orders' }

describe('vMemberModuleCreateBody', () => {
  test('accepts a payload the API would store', () => {
    expect(v.safeParse(vMemberModuleCreateBody, valid).success).toBe(true)
  })

  test('is the generated request schema, which already refuses a blank name', () => {
    expect(v.safeParse(vMemberModuleCreateBody, { name: '' }).success).toBe(false)

    expect(v.safeParse(vMemberModuleCreateBody, { name: 'a'.repeat(255) }).success).toBe(true)
    expect(v.safeParse(vMemberModuleCreateBody, { name: 'a'.repeat(256) }).success).toBe(false)
  })

  test('rejects a non-string name', () => {
    expect(v.safeParse(vMemberModuleCreateBody, { name: 42 }).success).toBe(false)
    expect(v.safeParse(vMemberModuleCreateBody, {}).success).toBe(false)
  })

  test('strips fields the request schema does not declare', () => {
    const result = v.parse(vMemberModuleCreateBody, { ...valid, id: 2, created: 'x', modified: 'y' })
    expect(Object.keys(result)).toEqual(['name'])
  })
})

describe('emptyModule', () => {
  test('gives a fresh form its default', () => {
    expect(emptyModule()).toEqual({ name: '' })
  })

  test('the default is not yet submittable', () => {
    expect(moduleWrite.validate(emptyModule(), { isCreate: true })).toEqual({ name: 'Please enter a name' })
  })
})

describe('moduleWrite.validate', () => {
  test('passes a good payload with no messages', () => {
    expect(moduleWrite.validate(valid, { isCreate: true })).toEqual({})
  })

  test('blames the name field for a blank name', () => {
    expect(moduleWrite.validate({ name: '' }, { isCreate: true })).toEqual({ name: 'Please enter a name' })
  })

  test('blames the name field for an over-long name', () => {
    expect(moduleWrite.validate({ name: 'a'.repeat(256) }, { isCreate: true })).toEqual({
      name: 'Please use at most 255 characters',
    })
  })
})
