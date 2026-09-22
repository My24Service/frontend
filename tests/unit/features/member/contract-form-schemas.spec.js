import { describe, expect, test } from 'vitest'
import * as v from 'valibot'

import { vMemberContractCreateBody } from '@/api/valibot.gen'

import { emptyContract, validateContract } from '@/features/member'

const valid = { name: 'My24Service Normal', module_paths: [{module: 7, parts: [258, 255]}] }

describe('vMemberContractCreateBody', () => {
  test('accepts a payload the API would store', () => {
    expect(v.safeParse(vMemberContractCreateBody, valid).success).toBe(true)
  })

  test('refuses a contract with no parts selected', () => {
    expect(v.safeParse(vMemberContractCreateBody, { ...valid, module_paths: [] }).success).toBe(false)
    expect(v.safeParse(vMemberContractCreateBody, { name: 'x', module_paths: undefined }).success).toBe(false)
  })

  test('is the generated request schema, which already refuses blanks', () => {
    expect(v.safeParse(vMemberContractCreateBody, { ...valid, name: '' }).success).toBe(false)

    expect(v.safeParse(vMemberContractCreateBody, { ...valid, name: 'a'.repeat(255) }).success).toBe(true)
    expect(v.safeParse(vMemberContractCreateBody, { ...valid, name: 'a'.repeat(256) }).success).toBe(false)
  })

  test('accepts an optional max_users of zero or more', () => {
    expect(v.parse(vMemberContractCreateBody, valid)).toEqual(valid)
    expect(v.safeParse(vMemberContractCreateBody, { ...valid, max_users: 0 }).success).toBe(true)
    expect(v.safeParse(vMemberContractCreateBody, { ...valid, max_users: -1 }).success).toBe(false)
    const result = v.parse(vMemberContractCreateBody, { ...valid, modules_text: '', id: 28 })
    expect(Object.keys(result).sort()).toEqual(['module_paths', 'name'])
  })
})

describe('emptyContract', () => {
  test('gives a fresh form its defaults', () => {
    expect(emptyContract()).toEqual({ name: '', module_paths: [] })
  })

  test('the default is not yet submittable', () => {
    expect(validateContract(emptyContract())).toEqual({
      name: 'Please enter a name',
      module_paths: 'Please select a module parts',
    })
  })
})

describe('validateContract', () => {
  test('passes a good payload with no messages', () => {
    expect(validateContract(valid)).toEqual({})
  })

  test('blames the name field for a blank or over-long name', () => {
    expect(validateContract({...valid, name: ''})).toEqual({ name: 'Please enter a name' })
    expect(validateContract({...valid, name: 'a'.repeat(256)})).toEqual({
      name: 'Please use at most 255 characters',
    })
  })

  test('blames the module paths when nothing is selected', () => {
    expect(validateContract({...valid, module_paths: []})).toEqual({
      module_paths: 'Please select a module parts',
    })
  })
})
