import { describe, expect, test } from 'vitest'
import * as v from 'valibot'

import {
  emptyModulePart,
  modulePartFormSchema,
  validateModulePart,
} from '@/features/member/module-part/schemas'

const valid = { name: 'dashboard', module: 7, is_always_selected: false }

describe('modulePartFormSchema', () => {
  test('accepts a payload the API would store', () => {
    expect(v.safeParse(modulePartFormSchema, valid).success).toBe(true)
  })

  test('is the generated request schema, strengthened for blank names', () => {
    expect(v.safeParse(modulePartFormSchema, { ...valid, name: '' }).success).toBe(false)

    expect(v.safeParse(modulePartFormSchema, { ...valid, name: 'a'.repeat(255) }).success).toBe(true)
    expect(v.safeParse(modulePartFormSchema, { ...valid, name: 'a'.repeat(256) }).success).toBe(false)
  })

  test('rejects a missing or non-integer module', () => {
    expect(v.safeParse(modulePartFormSchema, { ...valid, module: null }).success).toBe(false)
    expect(v.safeParse(modulePartFormSchema, { ...valid, module: undefined }).success).toBe(false)
    expect(v.safeParse(modulePartFormSchema, { ...valid, module: '7' }).success).toBe(false)
    expect(v.safeParse(modulePartFormSchema, { ...valid, module: 7.5 }).success).toBe(false)
  })

  test('treats is_always_selected as optional but boolean', () => {
    const { is_always_selected, ...without } = valid
    expect(v.safeParse(modulePartFormSchema, without).success).toBe(true)
    expect(v.safeParse(modulePartFormSchema, { ...valid, is_always_selected: 'yes' }).success).toBe(false)
  })

  test('strips fields the request schema does not declare', () => {
    const result = v.parse(modulePartFormSchema, { ...valid, module_name: 'company', id: 254 })
    expect(Object.keys(result).sort()).toEqual(['is_always_selected', 'module', 'name'])
  })
})

describe('emptyModulePart', () => {
  test('gives a fresh form its defaults', () => {
    expect(emptyModulePart()).toEqual({ name: '', module: null, is_always_selected: false })
  })

  test('defaults are not yet submittable', () => {
    expect(validateModulePart(emptyModulePart())).toEqual({
      name: 'Please enter a name',
      module: 'Please choose a module',
    })
  })
})

describe('validateModulePart', () => {
  test('passes a good payload with no messages', () => {
    expect(validateModulePart(valid)).toEqual({})
  })

  test('blames the name field for a blank name', () => {
    expect(validateModulePart({ ...valid, name: '' })).toEqual({
      name: 'Please enter a name',
    })
  })

  test('blames the name field for an over-long name', () => {
    expect(validateModulePart({ ...valid, name: 'a'.repeat(256) })).toEqual({
      name: 'Please use at most 255 characters',
    })
  })

  test('blames the module field when no module is chosen', () => {
    expect(validateModulePart({ ...valid, module: null })).toEqual({
      module: 'Please choose a module',
    })
  })

  test('reports both broken fields at once', () => {
    expect(validateModulePart({ name: '', module: null, is_always_selected: false })).toEqual({
      name: 'Please enter a name',
      module: 'Please choose a module',
    })
  })
})
