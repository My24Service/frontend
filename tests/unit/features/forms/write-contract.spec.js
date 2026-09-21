import { describe, expect, test } from 'vitest'

import { companyBranchMy } from '@/api/resources.gen'
import { writeContract } from '@/features/forms'

import {
  branchWrite,
  budgetWrite,
} from '@/features/company'
import { sickLeaveWrite } from '@/features/workforce'

/**
 * Which body a contract reaches for. That a contract's bodies belong to the
 * resource it names is the type checker's to prove - they come off the same
 * generated object - so what is left to check is the choice between them.
 */
describe('the body a contract sends follows the context', () => {
  test('the budget modal sends the patch body, and only a create insists on a year', () => {
    const blank = { year: '', amount: '' }

    // `year` is required on the create component and optional on the patch one,
    // so this pair is the shortest proof that each direction reaches its own
    // schema.
    expect(() => budgetWrite.parseCreate(blank)).toThrow()
    expect(budgetWrite.parseUpdate(blank)).toEqual({})

    const filled = { year: '2026', amount: '12.50' }
    expect(budgetWrite.parseCreate(filled)).toEqual({ year: 2026, amount: '12.50' })
    expect(budgetWrite.parseUpdate(filled)).toEqual({ year: 2026, amount: '12.50' })
  })

  test('a branch edit still validates against the whole-record create body', () => {
    const blank = {
      name: '',
      address: '',
      postal: '',
      city: '',
      country_code: '',
      tel: null,
      email: null,
      contact: null,
      mobile: null,
      image: null,
    }

    // The form saves a whole branch, so the create body is the one that says
    // what a whole branch needs - and a blank name is refused on an edit too.
    expect(branchWrite.validate(blank, {isCreate: true}).name).toBeTruthy()
    expect(branchWrite.validate(blank, {isCreate: false}).name).toBeTruthy()
  })

  test('a sick leave still requires its start day, the ledger rule', () => {
    // The contract's `validateWith` is the strengthened copy
    // (`v.required(create, ['start_date'])`), not the body being sent: without
    // it the optional wire entry would accept a leave with no first day.
    const errors = sickLeaveWrite.validate({user: 3, start_date: ''}, {isCreate: true})
    expect(errors.start_date).toBeTruthy()

    expect(sickLeaveWrite.validate({user: 3, start_date: '2026-09-21'}, {isCreate: true})).toEqual({})
  })

  test('a singleton has one body, and both directions send it', () => {
    // `branch-my` is the caller's own branch: the API only patches it, so the
    // update body stands in for the create it does not have.
    const contract = writeContract(companyBranchMy)
    expect(contract.parseCreate({name: 'HQ'})).toEqual({name: 'HQ'})
    expect(contract.parseUpdate({name: 'HQ'})).toEqual({name: 'HQ'})
  })
})
