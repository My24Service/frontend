import * as v from 'valibot'

import { vMemberModuleCreateBody } from '@/api/valibot.gen'
import { fieldErrors, type FieldErrors, type FieldMessages } from '@/features/forms/validation'
import { $trans } from '@/services/i18n'

/**
 * This form adds nothing to `vMemberModuleCreateBody`: it already declares
 * `name` as a non-blank string of at most 255 characters. Copy lives in
 * FIELD_MESSAGES, and the parse output is exactly what goes on the wire -
 * `id`, `created` and `modified` do not survive it.
 */
export type ModuleFormValues = v.InferInput<typeof vMemberModuleCreateBody>

export function emptyModule(): ModuleFormValues {
  return { name: '' }
}

export type ModuleFieldErrors = FieldErrors<keyof ModuleFormValues & string>

const MESSAGES = {
  name_required: () => $trans('Please enter a name'),
  name_max_length: () => $trans('Please use at most 255 characters'),
} as const

export const FIELD_MESSAGES = {
  name: (issue?: v.BaseIssue<unknown>) => issue?.type === 'max_length' ? MESSAGES.name_max_length() : MESSAGES.name_required(),
} satisfies FieldMessages<keyof ModuleFormValues & string>

export function validateModule(values: ModuleFormValues): ModuleFieldErrors {
  return fieldErrors(vMemberModuleCreateBody, values, FIELD_MESSAGES)
}

export function parseModule(values: ModuleFormValues): v.InferOutput<typeof vMemberModuleCreateBody> {
  return v.parse(vMemberModuleCreateBody, values)
}
