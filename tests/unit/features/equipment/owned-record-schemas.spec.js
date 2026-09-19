import { describe, expect, test } from 'vitest'

import {
  vBuildingBranchCreateRequest,
  vBuildingCustomerCreateRequest,
  vPatchedBuildingRequest,
} from '@/api/valibot.gen'
import { ownedRecordSchemas } from '@/features/equipment/owner/owned-record-schemas'

/**
 * The owner rule and the variant switch the three owned forms share, checked
 * against the smallest generated pair (the building's). The rule is the one
 * the schemas cannot say - valibot reports a failed oneOf at the root, and
 * whether an owner is required at all depends on the role - so the matrix is
 * create/edit x chooser/pinned x branch/customer.
 */

const CREATE = {isCreate: true, id: null}
const EDIT = {isCreate: false, id: 31}

const building = ownedRecordSchemas({
  branch: vBuildingBranchCreateRequest,
  customer: vBuildingCustomerCreateRequest,
  patch: vPatchedBuildingRequest,
  messages: {name: () => 'Please enter a name'},
})

describe('ownedRecordSchemas.validate, the owner rule', () => {
  test('a chooser on a branch tenant must pick a branch', () => {
    const errors = building.validate({name: 'A', branch: null, customer: null}, CREATE, {kind: 'branch', responsible: true})
    expect(errors).toEqual({branch: 'Please select a branch'})
  })

  test('a chooser on a branchless tenant must pick a customer', () => {
    const errors = building.validate({name: 'A', branch: null, customer: null}, CREATE, {kind: 'customer', responsible: true})
    expect(errors).toEqual({customer: 'Please select a customer'})
  })

  test('a pinned role is not asked to select an owner', () => {
    // Their slot is filled for them once branch-my answers, so the rule's copy
    // is off. The generated variant still declares the key, and reports it in
    // its own words until then - which the form's overlay covers.
    const errors = building.validate({name: 'A', branch: null, customer: null}, CREATE, {kind: 'branch', responsible: false})
    expect(errors.branch).toBeDefined()
    expect(errors.branch).not.toBe('Please select a branch')
    expect(building.validate({name: 'A', branch: 9, customer: null}, CREATE, {kind: 'branch', responsible: false})).toEqual({})
  })

  test('a filled owner slot passes', () => {
    expect(building.validate({name: 'A', branch: 9, customer: null}, CREATE, {kind: 'branch', responsible: true})).toEqual({})
    expect(building.validate({name: 'A', branch: null, customer: 7}, CREATE, {kind: 'customer', responsible: true})).toEqual({})
  })

  test('an edit never asks for an owner, whoever the user is', () => {
    for (const responsible of [true, false]) {
      for (const kind of ['branch', 'customer']) {
        expect(building.validate({name: 'A', branch: null, customer: null}, EDIT, {kind, responsible})).toEqual({})
      }
    }
  })

  test('the generated entries report under the caller\'s copy beside the owner rule', () => {
    const errors = building.validate({name: '', branch: null, customer: null}, CREATE, {kind: 'branch', responsible: true})
    expect(errors).toEqual({name: 'Please enter a name', branch: 'Please select a branch'})
  })
})

describe('ownedRecordSchemas.parse, the variant switch', () => {
  test('a branch-owned create is stripped of the customer slot', () => {
    expect(building.parse({name: 'A', branch: 9, customer: null}, CREATE, 'branch')).toEqual({name: 'A', branch: 9})
  })

  test('a customer-owned create is stripped of the branch slot', () => {
    expect(building.parse({name: 'A', branch: null, customer: 7}, CREATE, 'customer')).toEqual({name: 'A', customer: 7})
  })

  test('an edit round-trips both owner keys through the patch body', () => {
    expect(building.parse({name: 'A', branch: 9, customer: null}, EDIT, 'branch')).toEqual({name: 'A', branch: 9, customer: null})
  })

  test('a create whose variant key is missing throws, as the schema says', () => {
    expect(() => building.parse({name: 'A', branch: null, customer: null}, CREATE, 'branch')).toThrow()
  })
})
