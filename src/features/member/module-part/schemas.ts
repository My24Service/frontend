import * as v from 'valibot'

import { vMemberModulePartCreateBody } from '@/api/valibot.gen'
import { fieldErrors, type FieldErrors, type FieldMessages } from '@/features/forms/validation'
import { $trans } from '@/utils'

/**
 * This form adds nothing to `vMemberModulePartCreateBody`: it already declares
 * a non-blank `name` of at most 255 characters and a required integer
 * `module`. Copy lives in FIELD_MESSAGES, and keys the schema does not declare
 * (`id`, `module_name`, the audit timestamps) do not survive the parse.
 *
 * The one difference from the wire shape: the select is empty rather than
 * absent until a module is picked, and `null` fails the schema, which is what
 * the form wants.
 */
export type ModulePartFormValues =
  Omit<v.InferInput<typeof vMemberModulePartCreateBody>, 'module'> & {module: number | null}

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
  return fieldErrors(vMemberModulePartCreateBody, values, FIELD_MESSAGES)
}

export function parseModulePart(values: ModulePartFormValues): v.InferOutput<typeof vMemberModulePartCreateBody> {
  return v.parse(vMemberModulePartCreateBody, values)
}
