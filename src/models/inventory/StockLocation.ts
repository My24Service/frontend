import * as v from 'valibot'
import BaseModel from '../base'
import { bool, fk, formFields, formSchema, nullableStr, int, timestamp, writeSchema } from '../schema'

/**
 * Mirrors `StockLocationSerializer` (apps/inventory/serializers.py).
 *
 * `inventory` is a `SerializerMethodField` returning `obj.inventory.count()`,
 * so it is a read-only integer with no model field behind it.
 */
export const StockLocationSchema = v.object({
  id: fk(),
  identifier: nullableStr(''),
  name: nullableStr(''),
  inventory: int(),
  show_in_stats: bool(),
  external_identifier: nullableStr(),
  created: timestamp(),
  modified: timestamp(),
})

/**
 * Mirrors `StockLocationCreateUpdateSerializer`, which is one of only two
 * dedicated create/update serializers in the backend. It happens to be exactly
 * the read shape minus pk, the method field and the timestamps.
 */
export const StockLocationWriteSchema = writeSchema(StockLocationSchema, [
  'id',
  'inventory',
  'created',
  'modified',
])

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
