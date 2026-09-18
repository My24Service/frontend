import * as v from 'valibot'

import { vMemberModulePartCreateBody } from '@/api/valibot.gen'
import {
  fieldErrors,
  requiredOrMaxLength,
  type FieldErrors,
  type FieldMessages,
} from '@/features/forms/validation'
import { $trans } from '@/services/i18n'

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
  name: requiredOrMaxLength(MESSAGES.name_required, MESSAGES.name_max_length),
  module: MESSAGES.module_required,
} satisfies FieldMessages<keyof ModulePartFormValues & string>

export function validateModulePart(values: ModulePartFormValues): ModulePartFieldErrors {
  return fieldErrors(vMemberModulePartCreateBody, values, FIELD_MESSAGES)
}

export function parseModulePart(values: ModulePartFormValues): v.InferOutput<typeof vMemberModulePartCreateBody> {
  return v.parse(vMemberModulePartCreateBody, values)
}
