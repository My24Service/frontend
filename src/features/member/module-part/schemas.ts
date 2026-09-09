import * as v from 'valibot'

import { vMemberModulePartCreateBody } from '@/api/valibot.gen'
import { $trans } from '@/utils'

/**
 * Strengthenings for required fields — see ADR-0003 and member/README.md rules.
 */

/**
 * A name of at most 255 characters that is not blank, an integer module id,
 * and an optional flag. Parsed output is exactly what goes on the wire — keys
 * the schema does not declare (`id`, `module_name`, the audit timestamps) do
 * not survive the parse.
 */
export const modulePartFormSchema = v.object({
  ...vMemberModulePartCreateBody.entries,
  name: v.pipe(v.string(), v.minLength(1, $trans('Please enter a name')), v.maxLength(255, $trans('Please use at most 255 characters'))),
  module: v.pipe(v.number($trans('Please choose a module')), v.integer(), v.minValue(1, $trans('Please choose a module'))),
})

export type ModulePartFormValues = {
  name: string
  module: number | null
  is_always_selected: boolean
}

export function emptyModulePart(): ModulePartFormValues {
  return { name: '', module: null, is_always_selected: false }
}

export type ModulePartFieldErrors = Partial<Record<keyof ModulePartFormValues, string>>

const MESSAGES = {
  name_required: () => $trans('Please enter a name'),
  module_required: () => $trans('Please choose a module'),
} as const

export const FIELD_MESSAGES = {
  name: MESSAGES.name_required,
  module: MESSAGES.module_required,
} as const

export function validateModulePart(values: ModulePartFormValues): ModulePartFieldErrors {
  const result = v.safeParse(modulePartFormSchema, values)
  if (result.success) return {}

  const errors: ModulePartFieldErrors = {}
  for (const issue of result.issues) {
    const field = issue.path?.[0]?.key as keyof ModulePartFormValues | undefined
    if (!field || errors[field]) continue
    errors[field] = String(issue.message)
  }
  return errors
}

export function parseModulePart(values: ModulePartFormValues): v.InferOutput<typeof modulePartFormSchema> {
  return v.parse(modulePartFormSchema, values)
}
