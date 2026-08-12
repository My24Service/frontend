import * as v from 'valibot'
import BaseModel from '../base'
import { decimal, fk, formFields, formSchema, nullableStr, str, timestamp, writeSchema } from '../schema'

/** `StockMutationSimple.TYPES` (apps/inventory/models.py). */
export const MUTATION_TYPES = [
  'sales',
  'purchase',
  'move-out',
  'move-in',
  'correction-out',
  'correction-in',
] as const

export type MutationType = (typeof MUTATION_TYPES)[number]

/**
 * Mirrors `StockMutationSimpleSerializer` (apps/inventory/serializers.py).
 *
 * `summary` and `material_name` are `SerializerMethodField`s - read-only, and
 * `summary` returns a string containing HTML (`'<b>Purchase to</b> ...'`), so
 * any view rendering it is doing so deliberately.
 *
 * `amount` is a `DecimalField`. `COERCE_DECIMAL_TO_STRING` is left at the DRF
 * default, so it arrives as a string ("5.00") even though the form seeds it
 * with the number 0 - the schema accepts both rather than picking one and
 * being wrong half the time.
 */
export const MutationSchema = v.object({
  id: fk(),
  material: fk(),
  location: fk(),
  amount: decimal(0),
  mutation_type: v.optional(v.picklist(MUTATION_TYPES), 'correction-in'),
  modified: timestamp(),
  summary: str(),
  material_name: nullableStr(''),
  remarks: nullableStr(''),
})

export const MutationWriteSchema = writeSchema(MutationSchema, [
  'id',
  'modified',
  'summary',
  'material_name',
])

/**
 * `location_name` is client-only: MutationForm.vue binds it to the location
 * autocomplete's label, and the value comes from a different endpoint's
 * payload. The serializer exposes `location` (the pk) only.
 */
export const MutationFormSchema = formSchema(
  MutationSchema,
  ['material', 'material_name', 'summary', 'location', 'mutation_type', 'amount'],
  { location_name: str() },
)

export type Mutation = v.InferOutput<typeof MutationSchema>
export type MutationWrite = v.InferOutput<typeof MutationWriteSchema>

class MutationService extends BaseModel {
  fields = formFields(MutationFormSchema)

  url = '/inventory/stockmutationsimple-list/'
}

const mutationModel = new MutationService()

export default mutationModel
export { MutationService }
