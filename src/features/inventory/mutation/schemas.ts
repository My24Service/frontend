import * as v from 'valibot'

import { vInventoryMaterialMoveCreatePath } from '@/api/valibot.gen'
import {
  type FieldErrors,
  type FieldLabels,
  type FieldMessages,
  fieldErrors,
  requiredMessage,
  writeContract,
} from '@/features/forms'

/**
 * The two corrections the mutation form offers. The API knows more types
 * (purchase, sales, the moves); those are written by their own flows.
 */
export type CorrectionType = Extract<Api.MutationTypeEnum, 'correction-in' | 'correction-out'>

/**
 * An amount the user typed is more than nothing, read as the decimal it is:
 * the serializer's `min_value`, which does not reach the generated schema.
 * `0.5` is an amount; `0` and `0.00` are not.
 */
const isPositive = (value: string) => Number(value) > 0

// ---------------------------------------------------------------------------
// the mutation form

const mutationBody = Api.InventoryStockmutationsimpleList.create.body

/** The form's own state: the create body, with what the form holds differently named. */
export type MutationFormValues =
  Omit<v.InferInput<typeof mutationBody>, 'material' | 'location' | 'mutation_type'> & {
    // Pickers: empty rather than absent until chosen.
    material: number | null
    location: number | null
    // The form offers the corrections only, and always sends one.
    mutation_type: CorrectionType
    // Client-only: the two pickers' labels, from other endpoints' payloads -
    // the serializer exposes the two pks only.
    material_name: string
    location_name: string
  }

export type MutationFieldErrors = FieldErrors<keyof MutationFormValues>

export function emptyMutation(): MutationFormValues {
  return {
    material: null,
    material_name: '',
    location: null,
    location_name: '',
    mutation_type: 'correction-in',
    // The form has always started the amount at 0.
    amount: '0',
  }
}

export const FIELD_LABELS = {
  material: () => $trans('Material'),
  location: () => $trans('Location'),
  amount: () => $trans('Amount'),
} as const satisfies FieldLabels<keyof MutationFormValues>

export const FIELD_MESSAGES = {
  // The schema's own rules on an amount (a decimal of at most two places, more
  // than nothing) all mean the same thing to the person typing it.
  amount: () => requiredMessage(FIELD_LABELS.amount()),
} as const satisfies FieldMessages<keyof MutationFormValues>

/**
 * What the form checks: the create body, which requires a material and a
 * location, with a positive amount on top. The API refuses a zero or negative
 * amount too (`min_value` on the serializer), but a decimal's minimum does not
 * reach the generated schema, so the form says it itself.
 */
const vMutationForm = v.object({
  ...mutationBody.entries,
  amount: v.pipe(mutationBody.entries.amount, v.check(isPositive)),
})

/** The wire body: the four fields the serializer writes; the two labels stay on the client. */
function shapedMutation(values: MutationFormValues) {
  return {
    material: values.material,
    location: values.location,
    amount: values.amount,
    mutation_type: values.mutation_type,
  }
}

export const mutationWrite = writeContract(Api.InventoryStockmutationsimpleList, {
  validateWith: vMutationForm,
  shape: shapedMutation,
  labels: FIELD_LABELS,
  messages: FIELD_MESSAGES,
})

// ---------------------------------------------------------------------------
// the move form

/**
 * What the move checks and sends, read off the form's picks: the material
 * whose path the move posts to, the two locations and the amount, each null
 * until picked. The keys the body carries keep the body's names.
 */
export interface MoveFormValues {
  material: number | null
  from_location_id: number | null
  to_location_id: number | null
  amount: string
}

export type MoveFieldErrors = FieldErrors<keyof MoveFormValues>

export const MOVE_FIELD_LABELS = {
  material: () => $trans('Material'),
  amount: () => $trans('Amount'),
} as const satisfies FieldLabels<keyof MoveFormValues>

export const MOVE_FIELD_MESSAGES = {
  // A location is picked from a panel headed "Move from"/"Move to", and the
  // screen has always said so in these words.
  from_location_id: () => $trans('Please select from location'),
  to_location_id: () => $trans('Please select to location'),
  amount: () => requiredMessage(MOVE_FIELD_LABELS.amount()),
} as const satisfies FieldMessages<keyof MoveFormValues>

const moveBody = Api.InventoryMaterial.extras.moveCreate.body

/**
 * The move body with a positive amount on top: the API refuses anything else
 * (`min_value` on `MoveSerializer`), but a decimal's minimum does not reach the
 * generated schema.
 */
const vMoveForm = v.object({
  material: vInventoryMaterialMoveCreatePath.entries.id,
  from_location_id: moveBody.entries.from_location_id,
  to_location_id: moveBody.entries.to_location_id,
  amount: v.pipe(moveBody.entries.amount, v.check(isPositive)),
})

export function validateMove(values: MoveFormValues): MoveFieldErrors {
  return fieldErrors(vMoveForm, values, MOVE_FIELD_MESSAGES, MOVE_FIELD_LABELS)
}

/** What the move mutation takes: the material rides the path, the rest is the body. */
export function parseMove(values: MoveFormValues) {
  return {
    path: v.parse(vInventoryMaterialMoveCreatePath, {id: values.material}),
    body: v.parse(moveBody, {
      from_location_id: values.from_location_id,
      to_location_id: values.to_location_id,
      amount: values.amount,
    }),
  }
}
