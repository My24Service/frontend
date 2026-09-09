import * as v from 'valibot'

import { vMemberContractCreateBody } from '@/api/valibot.gen'
import { $trans } from '@/utils'

/**
 * Strengthenings for required fields — see ADR-0003 and member/README.md rules.
 */

/**
 * A name of at most 255 characters that is not blank, plus the encoded parts
 * selection with at least one entry. Parsed output is exactly what goes on
 * the wire.
 */
export const contractFormSchema = v.object({
  ...vMemberContractCreateBody.entries,
  name: v.pipe(v.string(), v.minLength(1, $trans('Please enter a name')), v.maxLength(255, $trans('Please use at most 255 characters'))),
  module_paths_pks: v.pipe(v.string(), v.minLength(1, $trans('Please select at least one module part'))),
})

export type ContractFormValues = {
  name: string
  module_paths_pks: string
}

export function emptyContract(): ContractFormValues {
  return { name: '', module_paths_pks: '' }
}

export type ContractFieldErrors = Partial<Record<keyof ContractFormValues, string>>

const MESSAGES = {
  name_required: () => $trans('Please enter a name'),
  paths_required: () => $trans('Please select at least one module part'),
} as const

export const FIELD_MESSAGES = {
  name: MESSAGES.name_required,
  module_paths_pks: MESSAGES.paths_required,
} as const

export function validateContract(values: ContractFormValues): ContractFieldErrors {
  const result = v.safeParse(contractFormSchema, values)
  if (result.success) return {}

  const errors: ContractFieldErrors = {}
  for (const issue of result.issues) {
    const field = issue.path?.[0]?.key as keyof ContractFormValues | undefined
    if (!field || errors[field]) continue
    errors[field] = String(issue.message)
  }
  return errors
}

export function parseContract(values: ContractFormValues): v.InferOutput<typeof contractFormSchema> {
  return v.parse(contractFormSchema, values)
}
