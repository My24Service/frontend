import { describe, expect, test } from 'vitest'
import * as v from 'valibot'

import { emptyContract, contractFormSchema, validateContract } from '@/features/member/contract/schemas'

const valid = { name: 'My24Service Normal', module_paths_pks: '7:258,255' }

describe('contractFormSchema', () => {
  test('accepts a payload the API would store', () => {
    expect(v.safeParse(contractFormSchema, valid).success).toBe(true)
  })

  test('refuses a contract with no parts selected', () => {
    expect(v.safeParse(contractFormSchema, { ...valid, module_paths_pks: '' }).success).toBe(false)
    expect(v.safeParse(contractFormSchema, { name: 'x', module_paths_pks: undefined }).success).toBe(false)
  })

  test('is the generated request schema, which already refuses blanks', () => {
    expect(v.safeParse(contractFormSchema, { ...valid, name: '' }).success).toBe(false)

    expect(v.safeParse(contractFormSchema, { ...valid, name: 'a'.repeat(255) }).success).toBe(true)
    expect(v.safeParse(contractFormSchema, { ...valid, name: 'a'.repeat(256) }).success).toBe(false)
  })

  test('accepts an optional max_users of zero or more', () => {
    expect(v.parse(contractFormSchema, valid)).toEqual(valid)
    expect(v.safeParse(contractFormSchema, { ...valid, max_users: 0 }).success).toBe(true)
    expect(v.safeParse(contractFormSchema, { ...valid, max_users: -1 }).success).toBe(false)
    const result = v.parse(contractFormSchema, { ...valid, modules_text: '', id: 28 })
    expect(Object.keys(result).sort()).toEqual(['module_paths_pks', 'name'])
  })
})

describe('emptyContract', () => {
  test('gives a fresh form its defaults', () => {
    expect(emptyContract()).toEqual({ name: '', module_paths_pks: '' })
  })

  test('the default is not yet submittable', () => {
    expect(validateContract(emptyContract())).toEqual({
      name: 'Please enter a name',
      module_paths_pks: 'Please select at least one module part',
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

  test('blames the parts encoding when nothing is selected', () => {
    expect(validateContract({...valid, module_paths_pks: ''})).toEqual({
      module_paths_pks: 'Please select at least one module part',
    })
  })
})
