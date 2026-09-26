import * as v from 'valibot'

import {
  fieldErrors,
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

export function validateModule(values: Api.ModuleRequest): ModuleFieldErrors {
  return fieldErrors(Api.MemberModule.create.body, values, {}, FIELD_LABELS)
}

export function parseModule(values: Api.ModuleRequest): Api.ModuleRequest {
  return v.parse(Api.MemberModule.create.body, values)
}
