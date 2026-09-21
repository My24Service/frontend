import * as v from 'valibot'

import type { ModuleRequest } from '@/api/types.gen'
import { vMemberModuleCreateBody } from '@/api/valibot.gen'
import { fieldErrors, requiredMessages, type FieldErrors } from '@/features/forms/validation'
import type { FieldLabels } from '@/features/forms/validated-form-context'
import { $trans } from '@/services/i18n'

export function emptyModule(): ModuleRequest {
  return { name: '' }
}

export type ModuleFieldErrors = FieldErrors<keyof ModuleRequest & string>

export const FIELD_LABELS = {
  name: () => $trans('Name'),
} satisfies FieldLabels<keyof ModuleRequest & string>

/** The line under an untouched field: the same required line the validation shows. */
export const PLACEHOLDERS = requiredMessages(FIELD_LABELS)

export function validateModule(values: ModuleRequest): ModuleFieldErrors {
  return fieldErrors(vMemberModuleCreateBody, values, {}, FIELD_LABELS)
}

export function parseModule(values: ModuleRequest): ModuleRequest {
  return v.parse(vMemberModuleCreateBody, values)
}
