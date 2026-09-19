import * as v from 'valibot'

import { vMemberContractCreateBody } from '@/api/valibot.gen'
import {
  fieldErrors,
  requiredOrMaxLength,
  type FieldErrors,
  type FieldMessages,
} from '@/features/forms/validation'
import { $trans } from '@/services/i18n'

export type ContractFormValues = v.InferInput<typeof vMemberContractCreateBody>

export function emptyContract(): ContractFormValues {
  return { name: '', module_paths: [] }
}

export type ContractFieldErrors = FieldErrors<keyof ContractFormValues & string>

const MESSAGES = {
  name_required: () => $trans('Please enter a name'),
  name_max_length: () => $trans('Please use at most 255 characters'),
  paths_required: () => $trans('Please select at least one module part'),
} as const

export const FIELD_MESSAGES = {
  name: requiredOrMaxLength(MESSAGES.name_required, MESSAGES.name_max_length),
  module_paths: MESSAGES.paths_required,
} satisfies FieldMessages<keyof ContractFormValues & string>

export function validateContract(values: ContractFormValues): ContractFieldErrors {
  return fieldErrors(vMemberContractCreateBody, values, FIELD_MESSAGES)
}

export function parseContract(values: ContractFormValues): v.InferOutput<typeof vMemberContractCreateBody> {
  return v.parse(vMemberContractCreateBody, values)
}
