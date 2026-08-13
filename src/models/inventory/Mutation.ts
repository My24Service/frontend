import * as v from 'valibot'
import BaseModel from '../base'
import { vStockMutationSimple, vMutationTypeEnum } from '@/api/valibot.gen'
import { formFields, formSchema, str, withDefaults, writeSchema } from '../schema'

/** `StockMutationSimple.TYPES` (apps/inventory/models.py), via `vMutationTypeEnum`. */
export const MUTATION_TYPES = vMutationTypeEnum.options

export type MutationType = (typeof MUTATION_TYPES)[number]

/**
 * Generated from `StockMutationSimpleSerializer` via the OpenAPI schema - the
 * field list, types and constraints come from `src/api/valibot.gen.ts`.
 * Regenerate with `npm run codegen`.
 *
 * `summary` and `material_name` are `SerializerMethodField`s, so the
 * generated schema marks them read-only (required on read, absent from
 * `vStockMutationSimple`'s write counterpart). `summary` returns a string
 * containing HTML (`'<b>Purchase to</b> ...'`), so any view rendering it is
 * doing so deliberately.
 *
 * `amount` is a `DecimalField`. `COERCE_DECIMAL_TO_STRING` is left at the DRF
 * default, so the generator correctly types it as a plain string
 * (`"5.00"`) rather than the string|number union the hand-written version
 * used to hedge with.
 */
export const MutationSchema = withDefaults(vStockMutationSimple, {
  id: null,
  material: null,
  location: null,
  amount: 0,
  mutation_type: 'correction-in',
  modified: null,
  summary: '',
  material_name: '',
  remarks: '',
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
