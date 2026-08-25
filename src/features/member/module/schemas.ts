import * as v from 'valibot'

import { vMemberModuleCreateBody } from '@/api/valibot.gen'
import { $trans } from '@/utils'

/**
 * The Module form's validation, derived from the generated request schema.
 *
 * The same arrangement as the Module Part form's (see ../module-part/schemas.ts
 * and ADR 0003): `vMemberModuleCreateBody` — one required `name`, at most 255
 * characters — is what POST and PATCH to `/api/member/module/` declare, so it
 * decides what this form may send, and the parse output is the body. Create
 * and update share the shape; the update path simply never sends back the
 * readonly fields the detail response added.
 *
 * One strengthening carries over from Module Part: DRF rejects a blank name
 * ("This field may not be blank") but the generator emits only `maxLength`,
 * so `minLength(1)` is added here until required-ness reaches the generator.
 */

/**
 * A name of at most 255 characters that is not blank. Parsed output is
 * exactly what goes on the wire — `id`, `created`, `modified` do not survive.
 */
export const moduleFormSchema = v.object({
  ...vMemberModuleCreateBody.entries,
  name: v.pipe(
    v.string(),
    v.minLength(1),
    v.maxLength(255),
  ),
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
  name_max_length: () => $trans('Please use at most 255 characters'),
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

    errors[field] =
      issue.type === 'max_length' ? MESSAGES.name_max_length() : MESSAGES.name_required()
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
