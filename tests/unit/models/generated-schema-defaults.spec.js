import { describe, expect, test } from 'vitest'
import * as v from 'valibot'

import { withDefaults, formFields } from '@/models/schema'
import { vStockLocation } from '@/api/valibot.gen'
import { StockLocationSchema } from '@/models/inventory/StockLocation'

/**
 * `src/models/inventory/StockLocation.ts` is built from the generated schema
 * rather than hand-written. `inventory-schema-fields.spec.js` already proves
 * its form defaults and write shape are unchanged by that migration; this
 * suite covers the seam itself - the `withDefaults` helper - and pins the two
 * schema facts that only became correct once the backend stopped lying about
 * them.
 */
describe('withDefaults', () => {
  test('a generated schema has no form defaults of its own', () => {
    // The premise of the helper: the generator emits bare v.optional(), so
    // getDefaults() yields undefined and BaseModel.fields would be empty.
    expect(v.getDefaults(vStockLocation).show_in_stats).toBeUndefined()
    expect(v.getDefaults(vStockLocation).name).toBeUndefined()
  })

  test('applies defaults without touching the generated field list', () => {
    const schema = withDefaults(vStockLocation, { show_in_stats: true })

    expect(v.getDefaults(schema).show_in_stats).toBe(true)
    expect(Object.keys(schema.entries).sort()).toEqual(Object.keys(vStockLocation.entries).sort())
  })

  test('leaves fields it was not given alone', () => {
    const schema = withDefaults(vStockLocation, { name: 'x' })

    expect(v.getDefaults(schema).show_in_stats).toBeUndefined()
  })

  test('a null default also makes the field nullable', () => {
    // DRF sends null for a blank nullable column, so a null default is only
    // meaningful if null actually parses.
    // Asserted against StockLocationSchema rather than a bare withDefaults()
    // call: read-only fields like `id` and `inventory` are *required* on the
    // generated schema, so a partial payload only parses once defaults have
    // been attached to all of them - which is what the model file does.
    expect(v.parse(StockLocationSchema, { external_identifier: null }).external_identifier).toBeNull()
    expect(v.getDefaults(StockLocationSchema).external_identifier).toBeNull()
  })

  test('rejects a field the generated schema does not have', () => {
    // Guards against a renamed or removed backend field silently defaulting
    // nothing - the exact drift this migration exists to prevent.
    expect(() => withDefaults(vStockLocation, { not_a_field: '' })).toThrow(/not a field/)
  })

  test('does not mutate the generated schema', () => {
    withDefaults(vStockLocation, { show_in_stats: true })

    expect(v.getDefaults(vStockLocation).show_in_stats).toBeUndefined()
  })
})

describe('facts the generated schema now gets right', () => {
  test('inventory is an integer, not a string', () => {
    // A SerializerMethodField with no return type hint defaults to `string` in
    // drf-spectacular. get_inventory returns obj.inventory.count().
    expect(v.parse(StockLocationSchema, { inventory: 12 }).inventory).toBe(12)
    expect(() => v.parse(StockLocationSchema, { inventory: '12' })).toThrow()
  })

  test('created is a tenant-formatted display string, not an ISO datetime', () => {
    // TransformDatesMixin rewrites created/modified in to_representation. If
    // the schema still claimed format: date-time, the generated isoTimestamp()
    // check would reject every real response.
    const parsed = v.parse(StockLocationSchema, { created: '31-12-2025 14:03' })

    expect(parsed.created).toBe('31-12-2025 14:03')
  })
})

describe('form defaults still come from one place', () => {
  test('formFields reads through to the generated entries', () => {
    const schema = withDefaults(vStockLocation, { name: '', show_in_stats: false })

    expect(formFields(v.object({ name: schema.entries.name }))).toEqual({ name: '' })
  })
})
