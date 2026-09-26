import { describe, expect, test } from 'vitest'
import * as v from 'valibot'

import { vMemberModulePartCreateBody } from '@/api/valibot.gen'

import {
  emptyModulePart,
  modulePartWrite,
} from '@/features/member'

const valid = { name: 'dashboard', module: 7, is_always_selected: false }

describe('vMemberModulePartCreateBody', () => {
  test('accepts a payload the API would store', () => {
    expect(v.safeParse(vMemberModulePartCreateBody, valid).success).toBe(true)
  })

  test('is the generated request schema, which already refuses a blank name', () => {
    expect(v.safeParse(vMemberModulePartCreateBody, { ...valid, name: '' }).success).toBe(false)

    expect(v.safeParse(vMemberModulePartCreateBody, { ...valid, name: 'a'.repeat(255) }).success).toBe(true)
    expect(v.safeParse(vMemberModulePartCreateBody, { ...valid, name: 'a'.repeat(256) }).success).toBe(false)
  })

  test('rejects a missing or non-integer module', () => {
    expect(v.safeParse(vMemberModulePartCreateBody, { ...valid, module: null }).success).toBe(false)
    expect(v.safeParse(vMemberModulePartCreateBody, { ...valid, module: undefined }).success).toBe(false)
    expect(v.safeParse(vMemberModulePartCreateBody, { ...valid, module: '7' }).success).toBe(false)
    expect(v.safeParse(vMemberModulePartCreateBody, { ...valid, module: 7.5 }).success).toBe(false)
  })

  test('treats is_always_selected as optional but boolean', () => {
    const { is_always_selected, ...without } = valid
    expect(v.safeParse(vMemberModulePartCreateBody, without).success).toBe(true)
    expect(v.safeParse(vMemberModulePartCreateBody, { ...valid, is_always_selected: 'yes' }).success).toBe(false)
  })

  test('strips fields the request schema does not declare', () => {
    const result = v.parse(vMemberModulePartCreateBody, { ...valid, module_name: 'company', id: 254 })
    expect(Object.keys(result).sort()).toEqual(['is_always_selected', 'module', 'name'])
  })
})

describe('emptyModulePart', () => {
  test('gives a fresh form its defaults', () => {
    expect(emptyModulePart()).toEqual({ name: '', module: null, is_always_selected: false })
  })

  test('defaults are not yet submittable', () => {
    expect(modulePartWrite.validate(emptyModulePart(), { isCreate: true })).toEqual({
      name: 'Please enter a name',
      module: 'Please select a module',
    })
  })
})

describe('modulePartWrite.validate', () => {
  test('passes a good payload with no messages', () => {
    expect(modulePartWrite.validate(valid, { isCreate: true })).toEqual({})
  })

  test('blames the name field for a blank name', () => {
    expect(modulePartWrite.validate({ ...valid, name: '' }, { isCreate: true })).toEqual({
      name: 'Please enter a name',
    })
  })

  test('blames the name field for an over-long name', () => {
    expect(modulePartWrite.validate({ ...valid, name: 'a'.repeat(256) }, { isCreate: true })).toEqual({
      name: 'Please use at most 255 characters',
    })
  })

  test('blames the module field when no module is chosen', () => {
    expect(modulePartWrite.validate({ ...valid, module: null }, { isCreate: true })).toEqual({
      module: 'Please select a module',
    })
  })

  test('reports both broken fields at once', () => {
    expect(modulePartWrite.validate({ name: '', module: null, is_always_selected: false }, { isCreate: true })).toEqual({
      name: 'Please enter a name',
      module: 'Please select a module',
    })
  })
})
