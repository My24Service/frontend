import * as v from 'valibot'
import BaseModel from '../base'
import { vStockLocation, vStockLocationCreateUpdate } from '@/api/valibot.gen'
import { formFields, formSchema, withDefaults, writeSchema } from '../schema'

/**
 * Generated from `StockLocationSerializer` via the OpenAPI schema - the field
 * list, types and constraints all come from `src/api/valibot.gen.ts`, so they
 * cannot drift from the backend. Regenerate with `npm run codegen`.
 *
 * Only the form defaults are hand-written, because a serializer has no notion
 * of one. See `withDefaults` in ../schema.
 *
 * Two things the generated schema gets right that the previous hand-written
 * version had to describe in a comment: `inventory` is an integer (it is a
 * SerializerMethodField returning `obj.inventory.count()`), and `created` /
 * `modified` are plain strings rather than ISO datetimes, because
 * TransformDatesMixin rewrites them into the tenant's date format.
 */
export const StockLocationSchema = withDefaults(vStockLocation, {
  name: '',
  identifier: '',
  created: null,
  modified: null,
})

/**
 * `StockLocationCreateUpdateSerializer` is a real serializer in the backend, so
 * the write shape is generated too rather than being derived by omitting keys
 * from the read shape. Only the read-only pk is dropped - it is in the
 * serializer's `fields` but never sent.
 */
export const StockLocationWriteSchema = writeSchema(
  withDefaults(vStockLocationCreateUpdate, {
    identifier: '',
    name: '',
    show_in_stats: false,
    external_identifier: null,
  }),
  ['id'],
)

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
  fields = formFields(StockLocationFormSchema)

  url = '/inventory/stock-location/'
}

const stockLocationModel = new StockLocationService()

export default stockLocationModel
export { StockLocationService }
