import {
  writeContract,
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
  return formDefaults(Api.MemberContract.create.body, {max_users: undefined})
}

export type ContractFieldErrors = FieldErrors<keyof Api.ContractCreateRequest>

export const FIELD_LABELS = {
  name: () => $trans('Name'),
  module_paths: () => $trans('Module parts'),
} as const satisfies FieldLabels<keyof Api.ContractCreateRequest>

/** The line under an untouched field: the same required line the validation shows. */
export const PLACEHOLDERS = requiredMessages(FIELD_LABELS)

/** What the form checks and sends: the whole contract, on a create and an edit alike. */
export const contractWrite = writeContract(Api.MemberContract, {
  validateWith: Api.MemberContract.create.body,
  labels: FIELD_LABELS,
})
