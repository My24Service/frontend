import * as v from 'valibot'

import { vMemberModuleCreateBody } from '@/api/valibot.gen'
import { fieldErrors, type FieldErrors, type FieldMessages } from '@/features/shared/form-validation'
import { $trans } from '@/utils'

/**
 * The generated request schema, used as generated: it already declares
 * `name` as a non-blank string of at most 255 characters, so there is
 * nothing for this form to strengthen. Copy lives in FIELD_MESSAGES.
 *
 * Parsed output is exactly what goes on the wire - `id`, `created`,
 * `modified` do not survive.
 */
export const moduleFormSchema = vMemberModuleCreateBody

export type ModuleFormValues = v.InferInput<typeof moduleFormSchema>

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
  return fieldErrors(moduleFormSchema, values, FIELD_MESSAGES)
}

export function parseModule(values: ModuleFormValues): v.InferOutput<typeof moduleFormSchema> {
  return v.parse(moduleFormSchema, values)
}
