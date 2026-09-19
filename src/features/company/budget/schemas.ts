import * as v from 'valibot'

import { vBudgetRequest, vPatchedBudgetRequest } from '@/api/valibot.gen'
import type { Budget, BudgetRequest, PatchedBudgetRequest } from '@/api/types.gen'
import { fieldErrors, type FieldErrors, type FieldMessages } from '@/features/forms/validation'
import { $trans } from '@/services/i18n'

/**
 * The budget modal's own state. The year rides the input as text and is
 * shaped to a number for the wire; the amount rides the `PriceInput` as the
 * decimal string the request schema declares, `'0.00'` until changed.
 */
export interface BudgetModalValues {
  year: string
  amount: string
}

export type BudgetModalErrors = FieldErrors<keyof BudgetModalValues & string>

/** A budget as the modal is opened for a create: this year, zero amount. */
export function emptyBudget(): BudgetModalValues {
  return { year: String(new Date().getFullYear()), amount: '0.00' }
}

/** The stored record as modal values. */
export function budgetModalFromRecord(record: Budget): BudgetModalValues {
  return { year: String(record.year), amount: record.amount ?? '' }
}

const MESSAGES = {
  year_invalid: () => $trans('Please enter a valid year'),
  amount_invalid: () => $trans('Please enter a valid amount'),
} as const

export const FIELD_MESSAGES = {
  year: MESSAGES.year_invalid,
  amount: MESSAGES.amount_invalid,
} satisfies FieldMessages<keyof BudgetModalValues & string>

/**
 * The wire-shaped body: the year as a number, the amount only when filled.
 * An empty year shapes to `undefined`, which the required number entry
 * refuses - `Number('')` is 0, a year nobody meant.
 */
function shaped(values: BudgetModalValues) {
  return {
    year: values.year.trim() === '' ? undefined : Number(values.year),
    ...(values.amount.trim() === '' ? {} : { amount: values.amount }),
  }
}

/**
 * The modal never validated: whatever was typed went out, so clearing the
 * amount answered 400 on the decimal regex and typing a year answered
 * whatever DRF coerced. Both writes validate the generated body instead.
 */
export function validateBudgetModal(values: BudgetModalValues): BudgetModalErrors {
  return fieldErrors(vBudgetRequest, shaped(values), FIELD_MESSAGES)
}

/**
 * The bodies to send, as the generated request components resolve them. Two
 * functions rather than one switching on edit state: the generated create
 * and update mutations type their bodies exactly, and a union of the two
 * satisfies neither.
 */
export function parseBudgetCreate(values: BudgetModalValues): BudgetRequest {
  return v.parse(vBudgetRequest, shaped(values))
}

export function parseBudgetUpdate(values: BudgetModalValues): PatchedBudgetRequest {
  return v.parse(vPatchedBudgetRequest, shaped(values))
}
