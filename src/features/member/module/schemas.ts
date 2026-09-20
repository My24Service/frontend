import * as v from 'valibot'

import { vMemberModuleCreateBody } from '@/api/valibot.gen'
import { fieldErrors, requiredMessages, type FieldErrors } from '@/features/forms/validation'
import type { FieldLabels } from '@/features/forms/validated-form-context'
import { $trans } from '@/services/i18n'

export type ModuleFormValues = v.InferInput<typeof vMemberModuleCreateBody>

export function emptyModule(): ModuleFormValues {
  return { name: '' }
}

export type ModuleFieldErrors = FieldErrors<keyof ModuleFormValues & string>

export const FIELD_LABELS = {
  name: () => $trans('Name'),
} satisfies FieldLabels<keyof ModuleFormValues & string>

/** The line under an untouched field: the same required line the validation shows. */
export const PLACEHOLDERS = requiredMessages(FIELD_LABELS)

export function validateModule(values: ModuleFormValues): ModuleFieldErrors {
  return fieldErrors(vMemberModuleCreateBody, values, {}, FIELD_LABELS)
}

export function parseModule(values: ModuleFormValues): v.InferOutput<typeof vMemberModuleCreateBody> {
  return v.parse(vMemberModuleCreateBody, values)
}
