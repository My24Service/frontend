import { describe, expect, test } from 'vitest'
import * as v from 'valibot'

import { formDefaults, lenient, widenNullable } from '@/models/schema'
import { vStockLocation } from '@/api/valibot.gen'
import { StockLocationSchema } from '@/models/inventory/StockLocation'

/**
 * `src/models/inventory/StockLocation.ts` is built from the generated schema
 * rather than hand-written. `inventory-schema-fields.spec.js` already proves
 * its form defaults and write shape are unchanged by that migration; this
 * suite covers the seam itself - `formDefaults` and its companions - and pins
 * the two schema facts that only became correct once the backend stopped lying
 * about them.
 *
 * The central property: form defaults are a plain object derived from the
 * schema, never stored in it. A serializer has no notion of a default, so
 * anything written here is a UI decision, and it must not be able to change
 * what the schema accepts.
 */
describe('formDefaults', () => {
  test('a generated schema carries no defaults of its own', () => {
    // The premise: the generator emits bare entries, so there is nothing for
    // v.getDefaults to find and BaseModel.fields would be empty without help.
    expect(v.getDefaults(vStockLocation).show_in_stats).toBeUndefined()
    expect(v.getDefaults(vStockLocation).name).toBeUndefined()
  })

  test('infers a default from the generated type', () => {
    // Every field gets a default inferred from its type - boolean -> false,
    // non-nullable string -> '' - so none is left undefined.
    const defaults = formDefaults(vStockLocation)

    expect(defaults.show_in_stats).toBe(false)
    expect(defaults.created).toBe('')
  })

  test('infers null for a nullable scalar', () => {
    // A nullable column's true "no value" is null. The form-text-input
    // exception (nullable but bound to '') is a UI decision and must be stated
    // explicitly, as StockLocation does for name/identifier.
    expect(formDefaults(vStockLocation).external_identifier).toBeNull()
  })

  test('an override wins over the inferred value', () => {
    const defaults = formDefaults(vStockLocation, { name: 'x', show_in_stats: true })

    expect(defaults.name).toBe('x')
    expect(defaults.show_in_stats).toBe(true)
  })

  test('covers every field of the schema and nothing else', () => {
    expect(Object.keys(formDefaults(vStockLocation)).sort()).toEqual(Object.keys(vStockLocation.entries).sort())
  })

  test('a null default does NOT make the field nullable', () => {
    // The point of the split. `created` is a non-nullable string on the wire; a
    // blank form holds null for it. Saying so used to widen the schema to
    // accept a null `created` from the API, which DRF never sends. Now the
    // default is just a value.
    expect(formDefaults(vStockLocation, { created: null }).created).toBeNull()
    expect(v.safeParse(StockLocationSchema, { created: null }).success).toBe(false)
  })

  test('an entry that already has a default keeps it', () => {
    // Form-only entries are declared with their own default (a datepicker's
    // nextWorkingDay(), ...); those win over inference.
    const schema = v.object({ when: v.optional(v.string(), 'today'), other: v.string() })

    expect(formDefaults(schema)).toEqual({ when: 'today', other: '' })
  })

  test('gives each caller its own array and object', () => {
    const schema = v.object({ tags: v.array(v.string()) })
    const first = formDefaults(schema)

    first.tags.push('mutated')

    expect(formDefaults(schema).tags).toEqual([])
  })

  test('rejects a field the schema does not have', () => {
    // Guards against a renamed or removed backend field silently defaulting
    // nothing - the exact drift this migration exists to prevent. This checks
    // hand-written source against the generated field list at import time; it
    // never sees an API response.
    expect(() => formDefaults(vStockLocation, { not_a_field: '' })).toThrow(/not a field/)
  })

  test('does not mutate the schema it reads', () => {
    formDefaults(vStockLocation, { show_in_stats: true })

    expect(v.getDefaults(vStockLocation).show_in_stats).toBeUndefined()
  })
})

describe('lenient', () => {
  test('lets a partial payload parse without inventing values', () => {
    const parsed = v.parse(StockLocationSchema, { name: 'Warehouse' })

    expect(parsed.name).toBe('Warehouse')
    expect(parsed.show_in_stats).toBeUndefined()
  })

  test('still rejects a value of the wrong type', () => {
    expect(() => v.parse(StockLocationSchema, { show_in_stats: 'yes' })).toThrow()
  })

  test('drops unknown keys rather than failing on them', () => {
    // An extra field from the API is not an error - the backend is allowed to
    // grow. v.object strips it; only v.strictObject would throw.
    expect(v.parse(StockLocationSchema, { name: 'W', brand_new_field: 1 })).toEqual({ name: 'W' })
  })
})

describe('widenNullable', () => {
  test('makes a named field accept null', () => {
    const schema = widenNullable(lenient(vStockLocation), ['created'])

    expect(v.safeParse(schema, { created: null }).success).toBe(true)
    expect(v.safeParse(StockLocationSchema, { created: null }).success).toBe(false)
  })

  test('rejects a field the schema does not have', () => {
    expect(() => widenNullable(vStockLocation, ['not_a_field'])).toThrow(/not a field/)
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
    expect(v.parse(StockLocationSchema, { created: '31-12-2025 14:03' }).created).toBe('31-12-2025 14:03')
  })
})
