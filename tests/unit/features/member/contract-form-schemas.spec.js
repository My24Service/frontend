import { describe, expect, test } from 'vitest'
import * as v from 'valibot'

import { emptyContract, contractFormSchema, validateContract } from '@/features/member/contract/schemas'

/**
 * The Contract form's validation, directly — the tracer-bullet arrangement
 * (ADR 0003) applied to the resource whose body is mostly one encoded string.
 *
 * The form validates against `vMemberContractCreateBody`, and uses it for
 * edits too: its `module_paths_pks` is required with at least one entry on
 * POST, and optional-but-min-1 on PUT/PATCH — so a payload that passes the
 * create schema is accepted by both. A user who clears every checkbox is
 * refused here rather than being answered by a 400.
 *
 * `name` gains `minLength(1)` as everywhere in this Slice: DRF rejects blank
 * required strings, the generated schema does not know that yet (ADR 0003).
 *
 * What the form sends is the parse output: `{name, module_paths_pks}` and
 * nothing else. The old form also posted `modules_text` (read-only) and
 * `max_users` (default 0, no input rendered) because they rode in on the
 * model's field bag — dropping them is declared on #323.
 */

const valid = { name: 'My24Service Normal', module_paths_pks: '7:258,255' }

describe('contractFormSchema', () => {
  test('accepts a payload the API would store', () => {
    expect(v.safeParse(contractFormSchema, valid).success).toBe(true)
  })

  test('refuses a contract with no parts selected', () => {
    expect(v.safeParse(contractFormSchema, { ...valid, module_paths_pks: '' }).success).toBe(false)
    expect(v.safeParse(contractFormSchema, { name: 'x', module_paths_pks: undefined }).success).toBe(false)
  })

  test('is the generated request schema, strengthened for blank names', () => {
    expect(v.safeParse(contractFormSchema, { ...valid, name: '' }).success).toBe(false)

    expect(v.safeParse(contractFormSchema, { ...valid, name: 'a'.repeat(255) }).success).toBe(true)
    expect(v.safeParse(contractFormSchema, { ...valid, name: 'a'.repeat(256) }).success).toBe(false)
  })

  test('accepts an optional max_users of zero or more', () => {
    expect(v.parse(contractFormSchema, valid)).toEqual(valid)
    expect(v.safeParse(contractFormSchema, { ...valid, max_users: 0 }).success).toBe(true)
    expect(v.safeParse(contractFormSchema, { ...valid, max_users: -1 }).success).toBe(false)
    // Keys the schema does not declare do not survive the parse.
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
