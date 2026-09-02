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

/** What the form edits before it is valid: no module chosen yet. */
export type ModulePartFormValues = {
  name: string
  module: number | null
  is_always_selected: boolean
}

export function emptyModulePart(): ModulePartFormValues {
  return { name: '', module: null, is_always_selected: false }
}

/** Field-level copy, keyed by field. A missing key means the field passed. */
export type ModulePartFieldErrors = Partial<Record<keyof ModulePartFormValues, string>>

const MESSAGES = {
  name_required: () => $trans('Please enter a name'),
  module_required: () => $trans('Please choose a module'),
} as const

/**
 * The copy a field shows while it simply sits empty, before any submit —
 * the same words validate reports once that field fails. Templates use these
 * instead of restating the strings, so a wording change happens here.
 */
export const FIELD_MESSAGES = {
  name: MESSAGES.name_required,
  module: MESSAGES.module_required,
} as const

/**
 * Validate form values against the request schema, returning one message per
 * broken field.
 *
 * Which fields broke, and why, comes from the schema's issues; the message is
 * this screen's copy for that failure kind.
 */
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

/**
 * The request body for a save: the form values through the request schema, so
 * what goes on the wire is exactly what the API declares — typed, stripped of
 * keys the schema does not know, and only ever called after
 * {@link validateModulePart} passed.
 */
export function parseModulePart(values: ModulePartFormValues): v.InferOutput<typeof modulePartFormSchema> {
  return v.parse(modulePartFormSchema, values)
}
