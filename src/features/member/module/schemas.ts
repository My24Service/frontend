import * as v from 'valibot'

import type { ModuleRequest } from '@/api/types.gen'
import { vMemberModuleCreateBody } from '@/api/valibot.gen'
import { fieldErrors, requiredMessages, type FieldErrors } from '@/features/forms'
import type { FieldLabels } from '@/features/forms'
import { formDefaults } from '@/models/schema'
import { $trans } from '@/services/i18n'

/**
 * The blank form, derived from the request component rather than spelled out:
 * a field the serializer gains shows up here without anyone editing this file,
 * and one it drops fails the typecheck.
 */
export function emptyModule(): ModuleRequest {
  return formDefaults(vMemberModuleCreateBody)
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
