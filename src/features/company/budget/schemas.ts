import { companyBudget } from '@/api/resources.gen'
import type { Budget } from '@/api/types.gen'
import type { FieldErrors } from '@/features/forms'
import type { FieldLabels } from '@/features/forms'
import { writeContract } from '@/features/forms'
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

export const FIELD_LABELS = {
  year: () => $trans('Year'),
  amount: () => $trans('Amount'),
} satisfies FieldLabels<keyof BudgetModalValues & string>

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
 * whatever DRF coerced. Both writes validate the generated body instead - the
 * create body, since the form fills in a whole budget either way.
 */
export const budgetWrite = writeContract(companyBudget, {
  validateWith: companyBudget.create.body,
  shape: shaped,
  labels: FIELD_LABELS,
})
