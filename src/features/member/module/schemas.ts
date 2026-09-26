import {
  writeContract,
  requiredMessages,
  type FieldErrors,
  type FieldLabels,
} from '@/features/forms'
import { formDefaults } from '@/models/schema'
/**
 * The blank form, derived from the request component rather than spelled out:
 * a field the serializer gains shows up here without anyone editing this file,
 * and one it drops fails the typecheck.
 */
export function emptyModule(): Api.ModuleRequest {
  return formDefaults(Api.MemberModule.create.body)
}

export type ModuleFieldErrors = FieldErrors<keyof Api.ModuleRequest>

export const FIELD_LABELS = {
  name: () => $trans('Name'),
} as const satisfies FieldLabels<keyof Api.ModuleRequest>

/** The line under an untouched field: the same required line the validation shows. */
export const PLACEHOLDERS = requiredMessages(FIELD_LABELS)

/** What the form checks and sends: the whole module, on a create and an edit alike. */
export const moduleWrite = writeContract(Api.MemberModule, {
  validateWith: Api.MemberModule.create.body,
  labels: FIELD_LABELS,
})
