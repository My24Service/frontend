import { describe, expect, test } from 'vitest'
import * as v from 'valibot'

import { emptyModule, moduleFormSchema, validateModule } from '@/features/member/module/schemas'

/**
 * The Module form's validation, directly.
 *
 * Same arrangement as the Module Part form's (the pattern this ticket exists
 * to prove transfers): validation parses against the **generated** request
 * schema (`vMemberModuleCreateBody`), so what a form may send is exactly what
 * the API declares, and the parse output is what goes on the wire.
 *
 * The one deliberate strengthening carries over too: `name` gains
 * `minLength(1)`, because DRF's `required=True` rejects a blank string while
 * the generated schema (maxLength only) would parse one. See the comment in
 * module-part/schemas.ts and ADR 0003.
 */

const valid = { name: 'orders' }

describe('moduleFormSchema', () => {
  test('accepts a payload the API would store', () => {
    expect(v.safeParse(moduleFormSchema, valid).success).toBe(true)
  })

  test('is the generated request schema, strengthened for blank names', () => {
    expect(v.safeParse(moduleFormSchema, { name: '' }).success).toBe(false)

    expect(v.safeParse(moduleFormSchema, { name: 'a'.repeat(255) }).success).toBe(true)
    expect(v.safeParse(moduleFormSchema, { name: 'a'.repeat(256) }).success).toBe(false)
  })

  test('rejects a non-string name', () => {
    expect(v.safeParse(moduleFormSchema, { name: 42 }).success).toBe(false)
    expect(v.safeParse(moduleFormSchema, {}).success).toBe(false)
  })

  test('strips fields the request schema does not declare', () => {
    // The old form handed `id` and the audit timestamps straight back on
    // update; the parsed output holds only declared keys.
    const result = v.parse(moduleFormSchema, { ...valid, id: 2, created: 'x', modified: 'y' })
    expect(Object.keys(result)).toEqual(['name'])
  })
})

describe('emptyModule', () => {
  test('gives a fresh form its default', () => {
    expect(emptyModule()).toEqual({ name: '' })
  })

  test('the default is not yet submittable', () => {
    expect(validateModule(emptyModule())).toEqual({ name: 'Please enter a name' })
  })
})

describe('validateModule', () => {
  test('passes a good payload with no messages', () => {
    expect(validateModule(valid)).toEqual({})
  })

  test('blames the name field for a blank name', () => {
    expect(validateModule({ name: '' })).toEqual({ name: 'Please enter a name' })
  })

  test('blames the name field for an over-long name', () => {
    expect(validateModule({ name: 'a'.repeat(256) })).toEqual({
      name: 'Please use at most 255 characters',
    })
  })
})
