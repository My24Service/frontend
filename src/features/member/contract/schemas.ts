import * as v from 'valibot'

import {
  fieldErrors,
  requiredMessages,
  type FieldErrors,
  type FieldLabels,
} from '@/features/forms'
import { formDefaults } from '@/models/schema'
/**
 * The blank form, derived from the request component. `max_users` is the one
 * field the schema cannot decide: the entry is optional, so its inferred blank
 * is `0`, and a create has no opinion about it rather than an opinion of zero.
 */
export function emptyContract(): Api.ContractCreateRequest {
  return formDefaults(schemas.vMemberContractCreateBody, {max_users: undefined})
}

export type ContractFieldErrors = FieldErrors<keyof Api.ContractCreateRequest & string>

export const FIELD_LABELS = {
  name: () => $trans('Name'),
  module_paths: () => $trans('Module parts'),
} satisfies FieldLabels<keyof Api.ContractCreateRequest & string>

/** The line under an untouched field: the same required line the validation shows. */
export const PLACEHOLDERS = requiredMessages(FIELD_LABELS)

export function validateContract(values: Api.ContractCreateRequest): ContractFieldErrors {
  return fieldErrors(schemas.vMemberContractCreateBody, values, {}, FIELD_LABELS)
}

export function parseContract(values: Api.ContractCreateRequest): Api.ContractCreateRequest {
  return v.parse(schemas.vMemberContractCreateBody, values)
}
