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

/** What the form edits before it is valid. */
export type ModuleFormValues = {
  name: string
}

export function emptyModule(): ModuleFormValues {
  return { name: '' }
}

/** Field-level copy, keyed by field. A missing key means the field passed. */
export type ModuleFieldErrors = Partial<Record<keyof ModuleFormValues, string>>

const MESSAGES = {
  name_required: () => $trans('Please enter a name'),
} as const

/**
 * The copy a field shows while it simply sits empty, before any submit —
 * the same words validate reports once that field fails. Templates use these
 * instead of restating the strings, so a wording change happens here.
 */
export const FIELD_MESSAGES = {
  name: MESSAGES.name_required,
} as const

/**
 * Validate form values against the request schema, returning one message per
 * broken field. Which fields broke, and why, comes from the schema's issues;
 * the message is this screen's copy for that failure kind.
 */
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

/**
 * The request body for a save: the form values through the request schema —
 * typed, stripped of keys the schema does not declare, and only ever called
 * after {@link validateModule} passed.
 */
export function parseModule(values: ModuleFormValues): v.InferOutput<typeof moduleFormSchema> {
  return v.parse(moduleFormSchema, values)
}
