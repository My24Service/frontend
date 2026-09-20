import * as v from 'valibot'

import { vAssignedOrderMaterialRequest } from '@/api/valibot.gen'
import type { FieldErrors, FieldMessages } from '@/features/forms/validation'
import type { FieldLabels } from '@/features/forms/validated-form-context'
import { $trans } from '@/services/i18n'

/**
 * The register-material form's state, copy and rules.
 *
 * The wire body is the generated request schema — `parseAssignedOrderMaterial`
 * is the parse whose output is sent, so the body carries exactly the keys
 * `AssignedOrderMaterialSerializer` declares. What the schema *cannot* say is
 * the rule this form is actually about: `material` and `location` are
 * nullable on the wire (an inline edit may leave one out), while a person
 * registering a movement must pick both. Those two rules are the form's, and
 * so is their copy — see the slice README's ledger.
 */
export interface AssignedOrderMaterialFormValues {
  assigned_order: number | null
  location: number | null
  material: number | null
  material_name: string | null
  amount: number | string | null
}

export type AssignedOrderMaterialFieldErrors = FieldErrors<keyof AssignedOrderMaterialFormValues & string>

export const FIELD_LABELS = {
  assigned_order: () => $trans('Assigned order'),
  location: () => $trans('Location'),
  material: () => $trans('Material'),
  amount: () => $trans('Amount'),
} satisfies FieldLabels<keyof AssignedOrderMaterialFormValues & string>

/**
 * The copy, written out rather than derived.
 *
 * The shared templates are `selectMessage`/`requiredMessage`, which always
 * spell the article "a" — "Please select a assigned order". These four lines
 * are the ones this screen has always shown, and they are also the ones that
 * read as English; the article defect in the shared templates is reported
 * rather than worked around here.
 */
export const FIELD_MESSAGES = {
  assigned_order: () => $trans('Please select an order'),
  location: () => $trans('Please select a location'),
  material: () => $trans('Please select a material'),
  amount: () => $trans('Please enter an amount'),
} satisfies FieldMessages<keyof AssignedOrderMaterialFormValues & string>

export function emptyAssignedOrderMaterial(): AssignedOrderMaterialFormValues {
  return {assigned_order: null, location: null, material: null, material_name: null, amount: null}
}

/**
 * The two rules the request schema cannot carry, plus the amount.
 *
 * A blank amount is not "no amount": `0` is a movement of nothing, which is
 * what the legacy screen refused with its own `greaterThanZero` validator.
 */
export function validateAssignedOrderMaterial(
  values: AssignedOrderMaterialFormValues,
): AssignedOrderMaterialFieldErrors {
  const errors: AssignedOrderMaterialFieldErrors = {}

  if (values.assigned_order === null) errors.assigned_order = FIELD_MESSAGES.assigned_order()
  if (values.location === null) errors.location = FIELD_MESSAGES.location()
  if (values.material === null) errors.material = FIELD_MESSAGES.material()

  const amount = Number(values.amount)
  if (values.amount === null || values.amount === '' || Number.isNaN(amount) || amount <= 0) {
    errors.amount = FIELD_MESSAGES.amount()
  }

  return errors
}

/** The body: the parse output of the generated request schema. */
export function parseAssignedOrderMaterial(
  values: AssignedOrderMaterialFormValues,
): v.InferOutput<typeof vAssignedOrderMaterialRequest> {
  return v.parse(vAssignedOrderMaterialRequest, {
    assigned_order: values.assigned_order,
    material: values.material,
    location: values.location,
    material_name: values.material_name,
    // The schema declares a decimal *string*; the input holds a number.
    amount: values.amount === null ? undefined : String(values.amount),
  })
}
