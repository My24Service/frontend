import * as v from 'valibot'
import BaseModel from '../base'
import { vStockMutationSimple, vMutationTypeEnum } from '@/api/valibot.gen'
import { formDefaults, formSchema, lenient, str, writeSchema } from '../schema'

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
export const MutationSchema = lenient(vStockMutationSimple)

/**
 * `amount` is a decimal, so it renders as a string and would infer `''`; the
 * form has always started it at 0. `mutation_type` is a required enum with no
 * neutral member, so the form picks one. The rest infer.
 */
const FORM_DEFAULTS = {
  amount: 0,
  mutation_type: 'correction-in',
  // Read-only display strings the form shows blank rather than as null.
  summary: '',
}

export const MutationWriteSchema = writeSchema(vStockMutationSimple, [
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
  fields = formDefaults(MutationFormSchema, FORM_DEFAULTS)

  url = '/inventory/stockmutationsimple-list/'
}

const mutationModel = new MutationService()

export default mutationModel
export { MutationService }
