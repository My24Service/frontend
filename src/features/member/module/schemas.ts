import * as v from 'valibot'

import { vMemberModuleCreateBody } from '@/api/valibot.gen'
import { $trans } from '@/utils'

/**
 * Strengthenings for required fields — see ADR-0003 and member/README.md rules.
 */

/**
 * A name of at most 255 characters that is not blank. Parsed output is
 * exactly what goes on the wire — `id`, `created`, `modified` do not survive.
 */
export const moduleFormSchema = v.object({
  ...vMemberModuleCreateBody.entries,
  name: v.pipe(v.string(), v.minLength(1, $trans('Please enter a name')), v.maxLength(255, $trans('Please use at most 255 characters'))),
})

export type ModuleFormValues = {
  name: string
}

export function emptyModule(): ModuleFormValues {
  return { name: '' }
}

export type ModuleFieldErrors = Partial<Record<keyof ModuleFormValues, string>>

const MESSAGES = {
  name_required: () => $trans('Please enter a name'),
} as const

export const FIELD_MESSAGES = {
  name: MESSAGES.name_required,
} as const

export function validateModule(values: ModuleFormValues): ModuleFieldErrors {
  const result = v.safeParse(moduleFormSchema, values)
  if (result.success) return {}

  const errors: ModuleFieldErrors = {}
  for (const issue of result.issues) {
    const field = issue.path?.[0]?.key as keyof ModuleFormValues | undefined
    if (!field || errors[field]) continue
    errors[field] = String(issue.message)
  }
  return errors
}

export function parseModule(values: ModuleFormValues): v.InferOutput<typeof moduleFormSchema> {
  return v.parse(moduleFormSchema, values)
}
