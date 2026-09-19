import * as v from 'valibot'

import { vMemberModuleCreateBody } from '@/api/valibot.gen'
import {
  fieldErrors,
  requiredOrMaxLength,
  type FieldErrors,
  type FieldMessages,
} from '@/features/forms/validation'
import { $trans } from '@/services/i18n'

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
  name: requiredOrMaxLength(MESSAGES.name_required, MESSAGES.name_max_length),
} satisfies FieldMessages<keyof ModuleFormValues & string>

export function validateModule(values: ModuleFormValues): ModuleFieldErrors {
  return fieldErrors(vMemberModuleCreateBody, values, FIELD_MESSAGES)
}

export function parseModule(values: ModuleFormValues): v.InferOutput<typeof vMemberModuleCreateBody> {
  return v.parse(vMemberModuleCreateBody, values)
}
