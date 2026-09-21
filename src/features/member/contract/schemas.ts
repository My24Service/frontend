import * as v from 'valibot'

import type { ContractCreateRequest } from '@/api/types.gen'
import { vMemberContractCreateBody } from '@/api/valibot.gen'
import { fieldErrors, requiredMessages, type FieldErrors } from '@/features/forms'
import type { FieldLabels } from '@/features/forms'
import { formDefaults } from '@/models/schema'
import { $trans } from '@/services/i18n'

/**
 * The blank form, derived from the request component. `max_users` is the one
 * field the schema cannot decide: the entry is optional, so its inferred blank
 * is `0`, and a create has no opinion about it rather than an opinion of zero.
 */
export function emptyContract(): ContractCreateRequest {
  return formDefaults(vMemberContractCreateBody, {max_users: undefined})
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
