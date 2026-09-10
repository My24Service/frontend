import * as v from 'valibot'

import { vMemberModulePartCreateBody } from '@/api/valibot.gen'
import { fieldErrors, type FieldErrors, type FieldMessages } from '@/features/shared/form-validation'
import { $trans } from '@/utils'

/**
 * The generated request schema, used as generated: it already declares a
 * non-blank `name` of at most 255 characters and a required integer
 * `module`. Copy lives in FIELD_MESSAGES.
 *
 * Parsed output is exactly what goes on the wire - keys the schema does not
 * declare (`id`, `module_name`, the audit timestamps) do not survive.
 */
export const modulePartFormSchema = vMemberModulePartCreateBody

/**
 * The wire shape, except that the select is empty rather than absent until a
 * module is picked - `null` fails the schema, which is what the form wants.
 */
export type ModulePartFormValues =
  Omit<v.InferInput<typeof modulePartFormSchema>, 'module'> & {module: number | null}

export function emptyModulePart(): ModulePartFormValues {
  return { name: '', module: null, is_always_selected: false }
}

export type ModulePartFieldErrors = FieldErrors<keyof ModulePartFormValues & string>

const MESSAGES = {
  name_required: () => $trans('Please enter a name'),
  name_max_length: () => $trans('Please use at most 255 characters'),
  module_required: () => $trans('Please choose a module'),
} as const

export const FIELD_MESSAGES = {
  name: (issue?: v.BaseIssue<unknown>) => issue?.type === 'max_length' ? MESSAGES.name_max_length() : MESSAGES.name_required(),
  module: MESSAGES.module_required,
} satisfies FieldMessages<keyof ModulePartFormValues & string>

export function validateModulePart(values: ModulePartFormValues): ModulePartFieldErrors {
  return fieldErrors(modulePartFormSchema, values, FIELD_MESSAGES)
}

export function parseModulePart(values: ModulePartFormValues): v.InferOutput<typeof modulePartFormSchema> {
  return v.parse(modulePartFormSchema, values)
}
