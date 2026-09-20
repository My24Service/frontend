import * as v from 'valibot'

import { vMemberModulePartCreateBody } from '@/api/valibot.gen'
import { fieldErrors, requiredMessages, type FieldErrors } from '@/features/forms/validation'
import type { FieldLabels } from '@/features/forms/validated-form-context'
import { $trans } from '@/services/i18n'

export type ModulePartFormValues =
  Omit<v.InferInput<typeof vMemberModulePartCreateBody>, 'module'> & {module: number | null}

export function emptyModulePart(): ModulePartFormValues {
  return { name: '', module: null, is_always_selected: false }
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
