import {
  writeContract,
  requiredMessages,
  type FieldErrors,
  type FieldLabels,
} from '@/features/forms'
import { formDefaults } from '@/models/schema'
export type ModulePartFormValues =
  Omit<Api.MemberModulePart.CreateInput, 'module'> & {module: number | null}

/**
 * The blank form, derived from the request component. `module` is the one
 * decision the schema cannot make for us: the entry is a required integer, so
 * its inferred blank is `0`, while an unchosen picker is `null`.
 */
export function emptyModulePart(): ModulePartFormValues {
  return formDefaults(Api.MemberModulePart.create.body, {module: null})
}

export type ModulePartFieldErrors = FieldErrors<keyof ModulePartFormValues>

export const FIELD_LABELS = {
  name: () => $trans('Name'),
  module: () => $trans('Module'),
} as const satisfies FieldLabels<keyof ModulePartFormValues>

/** The line under an untouched field: the same required line the validation shows. */
export const PLACEHOLDERS = requiredMessages(FIELD_LABELS)

/** What the form checks and sends: the whole module part, on a create and an edit alike. */
export const modulePartWrite = writeContract(Api.MemberModulePart, {
  validateWith: Api.MemberModulePart.create.body,
  labels: FIELD_LABELS,
})
