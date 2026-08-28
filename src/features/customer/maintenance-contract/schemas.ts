import * as v from 'valibot'
import type Dinero from 'dinero.js'

import type { MaintenanceContract, MaintenanceEquipment } from '@/api/types.gen'
import {
  vMaintenanceContractWritable,
  vMaintenanceEquipmentWritable,
} from '@/api/valibot.gen'
import { $trans } from '@/utils'

/**
 * The maintenance-contract screens' validation, derived from the generated
 * request schemas.
 *
 * The contract writes through `customer/maintenance-contract/` (create and
 * PATCH share one writable shape); the contract's equipment rows write
 * through `customer/maintenance-equipment/`. Both generated schemas are
 * spread here with the same named strengthenings on top, each with a reason:
 *
 *   - DRF's `required=True` means "present and not blank" on the backend
 *     (`allow_blank` defaults to False), but reaches the generated schema
 *     only as a plain `string` — an empty string would parse and then be
 *     rejected with "This field may not be blank". `minLength(1)` until the
 *     generator emits required-ness (the request-schema correctness ticket).
 *   - the legacy form's Vuelidate rules (`required` on name/customer,
 *     `required`+`greaterThanZero` on the row's times_per_year) were display
 *     feedback; the strengthenings carry the same rules to where the body is
 *     built.
 *
 * The parse output is the request body — which is why saved bodies carry
 * exactly the fields the API declares. The readonly response fields the old
 * model round-tripped (`id`, the counts, the `*_currency` strings, the
 * dinero objects, `priceFields`, the whole `customer_view`) die at the parse
 * instead of riding the wire.
 */

const contractStrengthenings = {
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(255)),
}

/** What a contract create and edit both send. */
export const maintenanceContractSchema = v.object({
  ...vMaintenanceContractWritable.entries,
  ...contractStrengthenings,
})

export type MaintenanceContractBody = v.InferOutput<typeof maintenanceContractSchema>

export type MaintenanceContractFormValues = {
  customer: number | null
  name: string
  remarks?: string
}

/** A new contract as the legacy screen opened one: blank, no customer. */
export function emptyContract(): MaintenanceContractFormValues {
  return {
    customer: null,
    name: '',
  }
}

/** The writable slice of a loaded record, for the form state. */
export function contractFromRecord(
  record: MaintenanceContract,
): MaintenanceContractFormValues {
  return {
    customer: record.customer,
    name: record.name ?? '',
    ...(record.remarks ? {remarks: record.remarks} : {}),
  }
}

/** Field-level copy, keyed by field. A missing key means the field passed. */
export type ContractFieldErrors = Partial<Record<'customer' | 'name' | 'remarks', string>>

/**
 * Validate the contract form against the write schema — one message per
 * broken field, the legacy Vuelidate copy. The legacy screen validated
 * customer and name (`required`), no more; so does this.
 */
export function validateContractForm(
  values: MaintenanceContractFormValues,
): ContractFieldErrors {
  const result = v.safeParse(maintenanceContractSchema, values)

  const errors: ContractFieldErrors = {}
  if (!result.success) {
    for (const issue of result.issues) {
      const field = issue.path?.[0]?.key as keyof ContractFieldErrors | undefined
      if (!field || errors[field]) continue

      errors[field] =
        field === 'customer'
          ? $trans('Please select a customer')
          : field === 'name'
            ? $trans('Please enter a contract name')
            : String(issue.message)
    }
  }

  return errors
}

/**
 * The contract request body: the form values through the endpoint's own
 * request schema, so what goes on the wire is exactly what the API declares.
 * Only called after {@link validateContractForm} passed.
 */
export function parseContractBody(
  values: MaintenanceContractFormValues,
): MaintenanceContractBody {
  return v.parse(maintenanceContractSchema, values)
}

// equipment rows -------------------------------------------------------------

const equipmentStrengthenings = {
  equipment: v.pipe(v.number(), v.integer()),
  equipment_name: v.pipe(v.string(), v.minLength(1), v.maxLength(255)),
}

/** What a staged row may send, as `customer/maintenance-equipment/` takes it. */
export const maintenanceEquipmentSchema = v.object({
  ...vMaintenanceEquipmentWritable.entries,
  ...equipmentStrengthenings,
})

export type MaintenanceEquipmentBody = v.InferOutput<typeof maintenanceEquipmentSchema>

/**
 * One staged equipment row, as the form edits it. The inputs hold strings
 * (the text input's own binding), the id appears once the backend has the
 * row, and the dinero/currency pair is display-only — the running total and
 * the PriceInput's currency — and dies at the parse.
 */
export type EquipmentRowState = {
  id?: number
  equipment: number | null
  equipment_name: string
  times_per_year: string
  remarks?: string
  tariff: string
  tariff_currency: string
  tariff_dinero?: Dinero.Dinero
}

/** A blank row, as the legacy `modelDefaults` seeded one. */
export function emptyEquipmentRow(defaultCurrency: string): EquipmentRowState {
  return {
    equipment: null,
    equipment_name: '',
    times_per_year: '',
    tariff: '0.00',
    tariff_currency: defaultCurrency,
  }
}

/**
 * A loaded row as the form stages it for further editing: the writable
 * fields the inputs edit, plus the display-only pair and the id.
 */
export function equipmentRowFromRecord(
  record: MaintenanceEquipmentRow,
  defaultCurrency: string,
): EquipmentRowState {
  return {
    id: record.id,
    equipment: record.equipment ?? null,
    equipment_name: record.equipment_name,
    times_per_year: record.times_per_year === undefined ? '' : String(record.times_per_year),
    ...(record.remarks ? {remarks: record.remarks} : {}),
    tariff: record.tariff,
    tariff_currency: record.tariff_currency || defaultCurrency,
  }
}

/** The read shape of a contract-equipment row (PaginatedMaintenanceEquipmentList item). */
export type MaintenanceEquipmentRow = MaintenanceEquipment

/**
 * The row's request body. `contract` is the number the schema declares —
 * the legacy wire sent the route's string pk here and the response's numeric
 * id on create; the backend (DRF) coerces both, so the number is the same
 * request, truthfully typed. `times_per_year` is the number the schema
 * declares for the same reason — the legacy wire carried the text input's
 * digit string. An untouched frequency stays absent, exactly as the legacy
 * model's undefined keys dropped out of its JSON.
 */
export function parseEquipmentBody(
  row: EquipmentRowState,
  contractId: number,
): MaintenanceEquipmentBody {
  return v.parse(maintenanceEquipmentSchema, {
    contract: contractId,
    equipment: row.equipment,
    equipment_name: row.equipment_name,
    ...(row.times_per_year !== '' && row.times_per_year !== undefined
      ? {times_per_year: Number(row.times_per_year)}
      : {}),
    ...(row.remarks ? {remarks: row.remarks} : {}),
    tariff: row.tariff,
  })
}

/**
 * The row's validation copy, the legacy Vuelidate messages. The Add button
 * blocked on nothing else — the frequency rules were display feedback — so
 * this reports; it does not gate.
 */
export function equipmentRowErrors(row: EquipmentRowState): Partial<Record<'equipment' | 'times_per_year', string>> {
  const errors: Partial<Record<'equipment' | 'times_per_year', string>> = {}
  if (row.equipment === null) errors.equipment = $trans('Please select an equipment')
  if (row.times_per_year !== '' && !(parseInt(row.times_per_year) > 0)) {
    errors.times_per_year = $trans('Please enter a number')
  }
  return errors
}
