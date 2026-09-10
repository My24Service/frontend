import * as v from 'valibot'

import { vMemberContractCreateBody } from '@/api/valibot.gen'
import { fieldErrors, type FieldErrors, type FieldMessages } from '@/features/forms/validation'
import { $trans } from '@/services/i18n'

/**
 * This form adds nothing to `vMemberContractCreateBody`: it already declares a
 * non-blank `name` of at most 255 characters and a non-blank
 * `module_paths_pks` (the encoded parts selection, empty when nothing is
 * ticked). Copy lives in FIELD_MESSAGES, and the parse output is exactly what
 * goes on the wire.
 */
export type ContractFormValues = v.InferInput<typeof vMemberContractCreateBody>

export function emptyContract(): ContractFormValues {
  return { name: '', module_paths_pks: '' }
}

export type ContractFieldErrors = FieldErrors<keyof ContractFormValues & string>

const MESSAGES = {
  name_required: () => $trans('Please enter a name'),
  name_max_length: () => $trans('Please use at most 255 characters'),
  paths_required: () => $trans('Please select at least one module part'),
} as const

export const FIELD_MESSAGES = {
  name: (issue?: v.BaseIssue<unknown>) => issue?.type === 'max_length' ? MESSAGES.name_max_length() : MESSAGES.name_required(),
  module_paths_pks: MESSAGES.paths_required,
} satisfies FieldMessages<keyof ContractFormValues & string>

export function validateContract(values: ContractFormValues): ContractFieldErrors {
  return fieldErrors(vMemberContractCreateBody, values, FIELD_MESSAGES)
}

export function parseContract(values: ContractFormValues): v.InferOutput<typeof vMemberContractCreateBody> {
  return v.parse(vMemberContractCreateBody, values)
}
