import { describe, expect, test } from 'vitest'
import * as v from 'valibot'
import { parseModel, safeParseModel } from '@/models/schema'

import stockLocationModel, { StockLocationSchema, StockLocationWriteSchema } from '@/models/inventory/StockLocation'
import supplierModel, { SupplierSchema, SupplierWriteSchema } from '@/models/inventory/Supplier'
import purchaseOrderStatusModel from '@/models/inventory/PurchaseOrderStatus'
import mutationModel, { MutationSchema, MutationWriteSchema } from '@/models/inventory/Mutation'
import purchaseOrderMaterialModel, { PurchaseOrderMaterialWriteSchema } from '@/models/inventory/PurchaseOrderMaterial'
import supplierReservationMaterialModel from '@/models/inventory/SupplierReservationMaterial'

/**
 * These models now generate `fields` from their valibot schema instead of
 * declaring it by hand. The dicts below are copied verbatim from the .js files
 * as they were before the migration: this suite exists to prove the generated
 * defaults are byte-for-byte what the 71 `getFields()` call sites used to get.
 *
 * If a schema change is meant to change a form default, update the expectation
 * here deliberately - do not relax the assertion.
 */
describe('generated fields match the pre-migration hand-written dicts', () => {
  test('StockLocation', () => {
    expect(stockLocationModel.getFields()).toEqual({
      name: '',
      identifier: '',
      created: null,
      modified: null,
      show_in_stats: false,
    })
  })

  test('Supplier', () => {
    expect(supplierModel.getFields()).toEqual({
      name: '',
      address: '',
      postal: '',
      city: '',
      country_code: 'NL',
      tel: '',
      email: '',
      contact: '',
      mobile: '',
      remarks: '',
      identifier: '',
    })
  })

  test('PurchaseOrderStatus', () => {
    expect(purchaseOrderStatusModel.getFields()).toEqual({
      purchase_order: 0,
      status: '',
      new_status: '',
    })
  })

  test('Mutation', () => {
    expect(mutationModel.getFields()).toEqual({
      material: null,
      material_name: '',
      summary: '',
      location: null,
      location_name: '',
      mutation_type: 'correction-in',
      amount: 0,
    })
  })

  test('PurchaseOrderMaterial', () => {
    expect(purchaseOrderMaterialModel.getFields()).toEqual({
      id: null,
      purchase_order: null,
      material_view: {},
      material: null,
      material_name: null,
      amount: 0,
      remarks: '',
    })
  })

  test('SupplierReservationMaterial', () => {
    expect(supplierReservationMaterialModel.getFields()).toEqual({
      id: null,
      reservation: null,
      material_view: {},
      material: null,
      material_name: null,
      amount: 0,
      remarks: '',
    })
  })
})

describe('getFields returns a fresh deep copy', () => {
  // BaseModel.getFields() deep-clones via JSON round-trip, so nested defaults
  // like material_view must not be shared between two forms.
  test('nested material_view is not shared', () => {
    const a = purchaseOrderMaterialModel.getFields()
    const b = purchaseOrderMaterialModel.getFields()
    a.material_view.name = 'mutated'
    expect(b.material_view).toEqual({})
  })
})

describe('urls are unchanged', () => {
  test.each([
    [stockLocationModel, '/inventory/stock-location/'],
    [supplierModel, '/inventory/supplier/'],
    [purchaseOrderStatusModel, '/inventory/purchaseorder-status/'],
    [mutationModel, '/inventory/stockmutationsimple-list/'],
    [purchaseOrderMaterialModel, '/inventory/purchaseorder-material/'],
    [supplierReservationMaterialModel, '/inventory/supplier-reservationmaterial/'],
  ])('%#', (model, url) => {
    expect(model.url).toBe(url)
  })
})

describe('write schemas drop the read-only fields', () => {
  test('StockLocation write shape mirrors StockLocationCreateUpdateSerializer', () => {
    expect(Object.keys(StockLocationWriteSchema.entries).sort()).toEqual(
      ['external_identifier', 'identifier', 'name', 'show_in_stats'].sort(),
    )
  })

  test('Supplier write shape drops timestamps and pk', () => {
    const keys = Object.keys(SupplierWriteSchema.entries)
    expect(keys).not.toContain('created')
    expect(keys).not.toContain('modified')
    expect(keys).not.toContain('id')
    expect(keys).toContain('country_code')
  })

  test('Mutation write shape drops the SerializerMethodFields', () => {
    const keys = Object.keys(MutationWriteSchema.entries)
    expect(keys).not.toContain('summary')
    expect(keys).not.toContain('material_name')
  })

  test('PurchaseOrderMaterial write shape drops the nested views and counts', () => {
    const keys = Object.keys(PurchaseOrderMaterialWriteSchema.entries)
    expect(keys).not.toContain('material_view')
    expect(keys).not.toContain('purchase_order_view')
    expect(keys).not.toContain('num_entries')
    expect(keys).not.toContain('total_entries')
  })
})

describe('schemas parse realistic API payloads', () => {
  test('StockLocation list row', () => {
    const parsed = v.parse(StockLocationSchema, {
      id: 3,
      identifier: 'WH-01',
      name: 'Warehouse',
      inventory: 12,
      show_in_stats: true,
      external_identifier: null,
      created: '31-12-2025 14:03',
      modified: '31-12-2025 14:03',
    })
    expect(parsed.inventory).toBe(12)
    expect(parsed.name).toBe('Warehouse')
  })

  test('nullable CharFields survive a null from the API', () => {
    const parsed = v.parse(SupplierSchema, { id: 1, name: null, remarks: null })
    expect(parsed.name).toBeNull()
    // country_code is absent from the payload and stays absent. It used to come
    // back 'NL' because the form default lived in the schema - i.e. parsing a
    // supplier the API gave no country for asserted it was Dutch. 'NL' is a
    // blank-form starting point, pinned in the getFields() expectation above.
    expect(parsed.country_code).toBeUndefined()
  })

  test('a decimal amount arrives as a string and is accepted', () => {
    // COERCE_DECIMAL_TO_STRING is left at the DRF default, so StockMutationSimple
    // .amount renders as "5.00" rather than 5.
    const parsed = v.parse(MutationSchema, { id: 1, amount: '5.00', mutation_type: 'move-in' })
    expect(parsed.amount).toBe('5.00')
  })

  test('an unknown mutation_type is rejected', () => {
    expect(() => v.parse(MutationSchema, { mutation_type: 'teleport' })).toThrow()
  })
})

describe('schema helpers', () => {
  test('parseModel throws on an invalid payload', () => {
    expect(() => parseModel(StockLocationSchema, { show_in_stats: 'yes' })).toThrow()
  })

  test('safeParseModel reports failure instead of throwing', () => {
    const result = safeParseModel(StockLocationSchema, { show_in_stats: 'yes' })
    expect(result.success).toBe(false)
    expect(result.issues.length).toBeGreaterThan(0)
  })

  test('safeParseModel returns the parsed output on success', () => {
    const result = safeParseModel(StockLocationSchema, { name: 'Warehouse' })
    expect(result.success).toBe(true)
    expect(result.output.name).toBe('Warehouse')
  })

  test('parsing does not invent values for absent fields', () => {
    // Form defaults used to live inside the schema, so parsing a partial
    // payload filled them in - `show_in_stats` came back `false` whether or not
    // the API had said so. That is a read schema fabricating data. Defaults now
    // live in `formDefaults`, so an absent field parses to `undefined` and a
    // caller can tell "the API said false" from "the API did not say".
    expect(safeParseModel(StockLocationSchema, { name: 'Warehouse' }).output.show_in_stats).toBeUndefined()
    expect(safeParseModel(StockLocationSchema, { show_in_stats: false }).output.show_in_stats).toBe(false)
  })
})
