import * as v from 'valibot'

import { vMemberContractCreateBody } from '@/api/valibot.gen'
import { fieldErrors, requiredMessages, type FieldErrors } from '@/features/forms/validation'
import type { FieldLabels } from '@/features/forms/validated-form-context'
import { $trans } from '@/services/i18n'

export type ContractFormValues = v.InferInput<typeof vMemberContractCreateBody>

export function emptyContract(): ContractFormValues {
  return { name: '', module_paths: [] }
}

export type ContractFieldErrors = FieldErrors<keyof ContractFormValues & string>

export const FIELD_LABELS = {
  name: () => $trans('Name'),
  module_paths: () => $trans('Module parts'),
} satisfies FieldLabels<keyof ContractFormValues & string>

/** The line under an untouched field: the same required line the validation shows. */
export const PLACEHOLDERS = requiredMessages(FIELD_LABELS)

export function validateContract(values: ContractFormValues): ContractFieldErrors {
  return fieldErrors(vMemberContractCreateBody, values, {}, FIELD_LABELS)
}

export function parseContract(values: ContractFormValues): v.InferOutput<typeof vMemberContractCreateBody> {
  return v.parse(vMemberContractCreateBody, values)
}
