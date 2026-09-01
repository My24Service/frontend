import { describe, expect, test } from 'vitest'
import * as v from 'valibot'

import {
  emptyModulePart,
  modulePartFormSchema,
  validateModulePart,
} from '@/features/member/module-part/schemas'

/**
 * The Module Part form schema, directly.
 *
 * The form validates against the **generated** request schema
 * (`vMemberModulePartCreateBody`), so what a form may send is exactly what the
 * API declares — not a parallel hand-written description that can drift. These
 * specs pin that: the schema is the generated one, a payload the API would
 * reject fails validation with a field-level message, and one the API would
 * store passes.
 *
 * One deliberate strengthening is pinned too: `name` gains `minLength(1)`.
 * The generated schema carries only `maxLength(255)` — DRF's `required=True`
 * does not become a valibot constraint — but the backend's ModelSerializer
 * (allow_blank defaults to False) rejects an empty string with "This field may
 * not be blank", which the old Vuelidate `required` used to catch client-side.
 * Until the generator emits required-ness as a constraint (the request-schema
 * correctness ticket), the form carries it here rather than posting a body it
 * knows the API will refuse.
 */

const valid = { name: 'dashboard', module: 7, is_always_selected: false }

describe('modulePartFormSchema', () => {
  test('accepts a payload the API would store', () => {
    expect(v.safeParse(modulePartFormSchema, valid).success).toBe(true)
  })

  test('is the generated request schema, strengthened for blank names', () => {
    // The generated writable schema accepts '' (maxLength only); the form
    // schema must not.
    expect(v.safeParse(modulePartFormSchema, { ...valid, name: '' }).success).toBe(false)

    // Everything else about the shape stays the generated one: a name of 255
    // characters passes, 256 does not.
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
    // The old form posted `module_name` and `id` along because they rode in on
    // the model's field defaults. The parsed output is what goes on the wire,
    // and it holds only declared keys.
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
