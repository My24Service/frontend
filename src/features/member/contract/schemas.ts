import * as v from 'valibot'

import type { ContractCreateRequest } from '@/api/types.gen'
import { vMemberContractCreateBody } from '@/api/valibot.gen'
import { fieldErrors, requiredMessages, type FieldErrors } from '@/features/forms/validation'
import type { FieldLabels } from '@/features/forms/validated-form-context'
import { $trans } from '@/services/i18n'

export function emptyContract(): ContractCreateRequest {
  return { name: '', module_paths: [] }
}

export type ContractFieldErrors = FieldErrors<keyof ContractCreateRequest & string>

export const FIELD_LABELS = {
  name: () => $trans('Name'),
  module_paths: () => $trans('Module parts'),
} satisfies FieldLabels<keyof ContractCreateRequest & string>

/** The line under an untouched field: the same required line the validation shows. */
export const PLACEHOLDERS = requiredMessages(FIELD_LABELS)

export function validateContract(values: ContractCreateRequest): ContractFieldErrors {
  return fieldErrors(vMemberContractCreateBody, values, {}, FIELD_LABELS)
}

export function parseContract(values: ContractCreateRequest): ContractCreateRequest {
  return v.parse(vMemberContractCreateBody, values)
}
