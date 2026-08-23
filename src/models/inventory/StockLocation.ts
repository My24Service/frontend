import * as v from 'valibot'
import BaseModel from '../base'
import { vStockLocation, vStockLocationCreateUpdate } from '@/api/valibot.gen'
import { formDefaults, formSchema, lenient, writeSchema } from '../schema'

/**
 * Generated from `StockLocationSerializer` via the OpenAPI schema - the field
 * list, types and constraints all come from `src/api/valibot.gen.ts`, so they
 * cannot drift from the backend. Regenerate with `npm run codegen`.
 *
 * The schema is the generated shape, made lenient on read and nothing else -
 * form defaults live in `FORM_DEFAULTS` below rather than inside it, because a
 * serializer has no notion of a default and the schema should not pretend
 * otherwise. See `formDefaults` in ../schema.
 *
 * Two things the generated schema gets right that the previous hand-written
 * version had to describe in a comment: `inventory` is an integer (it is a
 * SerializerMethodField returning `obj.inventory.count()`), and `created` /
 * `modified` are plain strings rather than ISO datetimes, because
 * TransformDatesMixin rewrites them into the tenant's date format.
 */
export const StockLocationSchema = lenient(vStockLocation)

/**
 * `name` and `identifier` are nullable columns, but both are form text inputs
 * that existing callers expect to be strings, so they start `''` rather than
 * the `null` their type would imply. Everything else is inferred.
 */
const FORM_DEFAULTS = {
  name: '',
  identifier: '',
  // A blank form has no timestamps yet. `created`/`modified` are non-nullable
  // strings on the wire, so the type infers '' - but null is what a new form
  // holds and what it binds to. Stating it here rather than in the schema keeps
  // it a form value: the API never sends a null `created`.
  created: null,
  modified: null,
}

/**
 * `StockLocationCreateUpdateSerializer` is a real serializer in the backend, so
 * the write shape is generated too rather than being derived by omitting keys
 * from the read shape. Only the read-only pk is dropped - it is in the
 * serializer's `fields` but never sent.
 */
export const StockLocationWriteSchema = writeSchema(vStockLocationCreateUpdate, ['id'])

export const StockLocationFormSchema = formSchema(StockLocationSchema, [
  'name',
  'identifier',
  'created',
  'modified',
  'show_in_stats',
])

export type StockLocation = v.InferOutput<typeof StockLocationSchema>
export type StockLocationWrite = v.InferOutput<typeof StockLocationWriteSchema>

class StockLocationService extends BaseModel {
  fields = formDefaults(StockLocationFormSchema, FORM_DEFAULTS)

  url = '/inventory/stock-location/'
}

const stockLocationModel = new StockLocationService()

export default stockLocationModel
export { StockLocationService }
