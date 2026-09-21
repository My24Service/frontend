import * as v from 'valibot'
import type Dinero from 'dinero.js'

import type { MaintenanceContract, MaintenanceContractWithEquipmentRequestRequest, MaintenanceEquipment, MaintenanceEquipmentRowRequest } from '@/api/types.gen'
import {
  vMaintenanceContractRequest,
  vMaintenanceContractWithEquipmentRequestRequest,
  vMaintenanceEquipmentRowRequest,
  vMaintenanceEquipmentRequest,
} from '@/api/valibot.gen'
import { fieldErrors, type FieldErrors } from '@/features/forms/validation'
import type { FieldLabels } from '@/features/forms/validated-form-context'
import { $trans } from '@/services/i18n'



/** The wire shape, except that the picker is empty until a customer is chosen. */
export type MaintenanceContractFormValues =
  Omit<v.InferInput<typeof vMaintenanceContractRequest>, 'customer'> & {customer: number | null}


export function emptyContract(): MaintenanceContractFormValues {
  return {
    customer: null,
    name: '',
  }
}


export function contractFromRecord(
  record: MaintenanceContract,
): MaintenanceContractFormValues {
  return {
    customer: record.customer,
    name: record.name ?? '',
    ...(record.remarks ? {remarks: record.remarks} : {}),
  }
}


export type ContractFieldErrors = FieldErrors<'customer' | 'name' | 'remarks' | 'equipment'>


const FIELD_LABELS = {
  customer: () => $trans('Customer'),
  name: () => $trans('Contract name'),
} satisfies FieldLabels<'customer' | 'name'>


export function validateContractForm(
  values: MaintenanceContractFormValues,
): ContractFieldErrors {
  return fieldErrors(vMaintenanceContractRequest, values, {}, FIELD_LABELS)
}


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


export function emptyEquipmentRow(defaultCurrency: string): EquipmentRowState {
  return {
    equipment: null,
    equipment_name: '',
    times_per_year: '',
    tariff: '0.00',
    tariff_currency: defaultCurrency,
  }
}


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


export type MaintenanceEquipmentRow = MaintenanceEquipment


/**
 * The row as the replace-set body takes it. Two things a row does not carry:
 * the contract, which the endpoint fills from the one in its URL, and the
 * currency, which is the contract's own. The frequency rides as a string in the
 * row state so an empty input can be told from a zero; it leaves the key absent,
 * which the schema's `optional` accepts and the API defaults to one.
 */
function shapeEquipmentRow(row: EquipmentRowState) {
  return {
    ...(row.id === undefined ? {} : {id: row.id}),
    equipment: row.equipment,
    equipment_name: row.equipment_name,
    ...(row.times_per_year !== '' && row.times_per_year !== undefined
      ? {times_per_year: Number(row.times_per_year)}
      : {}),
    ...(row.remarks ? {remarks: row.remarks} : {}),
    tariff: row.tariff,
    // The tariff's currency, when the row carries one: the server reads the
    // companion off the raw row and otherwise keeps the column's default, so
    // dropping it would relabel a USD or GBP tenant's tariffs as EUR. A staged
    // row always has one - it comes from the record or the tenant's default.
    ...(row.tariff_currency ? {tariff_currency: row.tariff_currency} : {}),
  }
}


/**
 * The staged set as the `equipment` list of a save. The whole protocol is
 * `id`: a row carrying one updates that stored row, a row without one is
 * created, and a stored row absent from the list is deleted — which is why
 * every staged row goes in, a deleted one simply gone.
 */
export function parseEquipmentSetBody(
  rows: readonly EquipmentRowState[],
): MaintenanceEquipmentRowRequest[] {
  return rows.map((row) => v.parse(vMaintenanceEquipmentRowRequest, shapeEquipmentRow(row)))
}


/**
 * The body of a save: the contract's own fields joined to the staged set,
 * already shaped by `parseEquipmentSetBody`, and parsed as the request
 * component of the pair the form submits to — `POST
 * maintenance-contract/with-equipment/` and `POST
 * maintenance-contract/{id}/with-equipment/`, which declare one body between
 * them. It is one body because the backend writes both halves in one
 * transaction, so a failed save leaves no rows behind and no `sum_tariffs`
 * derived from rows it does not have.
 */
export function parseContractWithEquipmentBody(
  values: MaintenanceContractFormValues,
  equipment: MaintenanceEquipmentRowRequest[],
): MaintenanceContractWithEquipmentRequestRequest {
  return v.parse(vMaintenanceContractWithEquipmentRequestRequest, {...values, equipment})
}


const EQUIPMENT_ROW_LABELS = {
  equipment: () => $trans('Equipment'),
  times_per_year: () => $trans('Times / year'),
} satisfies FieldLabels<'equipment' | 'times_per_year'>


/**
 * A staged row is checked while it is still a draft, before any save names it.
 * Only the two fields the user fills are reported: the name is copied from the
 * picked equipment and the tariff comes from a price input, so neither can be
 * wrong on its own.
 */
export function equipmentRowErrors(row: EquipmentRowState): FieldErrors<'equipment' | 'times_per_year'> {
  const {equipment, times_per_year} = fieldErrors<'equipment' | 'times_per_year'>(
    vMaintenanceEquipmentRequest, shapeEquipmentRow(row), {}, EQUIPMENT_ROW_LABELS)
  return {
    ...(equipment ? {equipment} : {}),
    ...(times_per_year ? {times_per_year} : {}),
  }
}
