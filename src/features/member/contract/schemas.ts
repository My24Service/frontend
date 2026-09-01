import * as v from 'valibot'

import { vMemberContractCreateBody } from '@/api/valibot.gen'
import { $trans } from '@/utils'

/**
 * The Contract form's validation, derived from the generated request schema
 * (ADR 0003, like every form in this Slice).
 *
 * The schema is `vMemberContractCreateBody`, and it is used for edits too.
 * Its `module_paths_pks` is required-with-at-least-one-entry on POST and
 * optional-but-min-1 on PUT/PATCH, so anything the create schema accepts is
 * accepted by both — and a user who unticks every part is refused here rather
 * than answered by a 400. The one strengthening carried over from Module Part
 * and Module: DRF rejects a blank required name, the generator does not yet
 * say so, so `minLength(1)` is added until required-ness reaches the
 * generator.
 *
 * What the form sends is the parse output: `{name, module_paths_pks}` and
 * nothing else. `modules_text` (read-only) and `max_users` (default 0; this
 * screen renders no input for it) are not in the form, so they are not sent —
 * a declared exception against the recorded goldens (#323), which carry them
 * because the old form posted its model's whole field bag.
 */

/**
 * A name of at most 255 characters that is not blank, plus the encoded parts
 * selection with at least one entry. Parsed output is exactly what goes on
 * the wire.
 */
export const contractFormSchema = v.object({
  ...vMemberContractCreateBody.entries,
  name: v.pipe(
    v.string(),
    v.minLength(1),
    v.maxLength(255),
  ),
})

/** What the form edits before it is valid: nothing named, nothing selected. */
export type ContractFormValues = {
  name: string
  module_paths_pks: string
}

export function emptyContract(): ContractFormValues {
  return { name: '', module_paths_pks: '' }
}

/** Field-level copy, keyed by field. A missing key means the field passed. */
export type ContractFieldErrors = Partial<Record<keyof ContractFormValues, string>>

const MESSAGES = {
  name_required: () => $trans('Please enter a name'),
  name_max_length: () => $trans('Please use at most 255 characters'),
  paths_required: () => $trans('Please select at least one module part'),
} as const

/**
 * The copy a field shows while it simply sits empty, before any submit —
 * the same words validate reports once that field fails. Templates use these
 * instead of restating the strings, so a wording change happens here.
 */
export const FIELD_MESSAGES = {
  name: MESSAGES.name_required,
  module_paths_pks: MESSAGES.paths_required,
} as const

/**
 * Validate form values against the request schema, returning one message per
 * broken field. Which fields broke, and why, comes from the schema's issues;
 * the message is this screen's copy for that failure kind.
 */
export function validateContract(values: ContractFormValues): ContractFieldErrors {
  const result = v.safeParse(contractFormSchema, values)
  if (result.success) return {}

  const errors: ContractFieldErrors = {}
  for (const issue of result.issues) {
    const field = issue.path?.[0]?.key as keyof ContractFormValues | undefined
    if (!field || errors[field]) continue

    if (field === 'name') {
      errors[field] =
        issue.type === 'max_length' ? MESSAGES.name_max_length() : MESSAGES.name_required()
    } else if (field === 'module_paths_pks') {
      errors[field] = MESSAGES.paths_required()
    }
  }
  return errors
}

/**
 * The request body for a save: the form values through the request schema —
 * typed, stripped of keys the schema does not declare, and only ever called
 * after {@link validateContract} passed.
 */
export function parseContract(values: ContractFormValues): v.InferOutput<typeof contractFormSchema> {
  return v.parse(contractFormSchema, values)
}
