import * as v from 'valibot'

import { vMemberModulePartCreateBody } from '@/api/valibot.gen'
import {
  fieldErrors,
  requiredMessages,
  type FieldErrors,
  type FieldLabels,
} from '@/features/forms'
import { formDefaults } from '@/models/schema'
import { $trans } from '@/services/i18n'

export type ModulePartFormValues =
  Omit<v.InferInput<typeof vMemberModulePartCreateBody>, 'module'> & {module: number | null}

/**
 * The blank form, derived from the request component. `module` is the one
 * decision the schema cannot make for us: the entry is a required integer, so
 * its inferred blank is `0`, while an unchosen picker is `null`.
 */
export function emptyModulePart(): ModulePartFormValues {
  return formDefaults(vMemberModulePartCreateBody, {module: null})
}

export type ModulePartFieldErrors = FieldErrors<keyof ModulePartFormValues & string>

export const FIELD_LABELS = {
  name: () => $trans('Name'),
  module: () => $trans('Module'),
} satisfies FieldLabels<keyof ModulePartFormValues & string>

/** The line under an untouched field: the same required line the validation shows. */
export const PLACEHOLDERS = requiredMessages(FIELD_LABELS)

export function validateModulePart(values: ModulePartFormValues): ModulePartFieldErrors {
  return fieldErrors(vMemberModulePartCreateBody, values, {}, FIELD_LABELS)
}

export function parseModulePart(values: ModulePartFormValues): v.InferOutput<typeof vMemberModulePartCreateBody> {
  return v.parse(vMemberModulePartCreateBody, values)
}
