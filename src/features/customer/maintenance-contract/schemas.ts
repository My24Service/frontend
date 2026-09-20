import * as v from 'valibot'
import type Dinero from 'dinero.js'

import type { MaintenanceContract, MaintenanceEquipment } from '@/api/types.gen'
import {
  vMaintenanceContractRequest,
  vMaintenanceEquipmentRequest,
} from '@/api/valibot.gen'
import { fieldErrors, type FieldErrors } from '@/features/forms/validation'
import type { FieldLabels } from '@/features/forms/validated-form-context'
import { $trans } from '@/services/i18n'



export type MaintenanceContractBody = v.InferOutput<typeof vMaintenanceContractRequest>

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


export function parseContractBody(
  values: MaintenanceContractFormValues,
): MaintenanceContractBody {
  return v.parse(vMaintenanceContractRequest, values)
}



export type MaintenanceEquipmentBody = v.InferOutput<typeof vMaintenanceEquipmentRequest>


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
 * The row as the wire takes it. The frequency rides as a string in the row
 * state so an empty input can be told from a zero; it leaves the key absent,
 * which the schema's `optional` accepts and the API defaults to one.
 */
function shapeEquipmentRow(row: EquipmentRowState, contractId: number | null) {
  return {
    ...(contractId === null ? {} : {contract: contractId}),
    equipment: row.equipment,
    equipment_name: row.equipment_name,
    ...(row.times_per_year !== '' && row.times_per_year !== undefined
      ? {times_per_year: Number(row.times_per_year)}
      : {}),
    ...(row.remarks ? {remarks: row.remarks} : {}),
    tariff: row.tariff,
  }
}


export function parseEquipmentBody(
  row: EquipmentRowState,
  contractId: number,
): MaintenanceEquipmentBody {
  return v.parse(vMaintenanceEquipmentRequest, shapeEquipmentRow(row, contractId))
}


const EQUIPMENT_ROW_LABELS = {
  equipment: () => $trans('Equipment'),
  times_per_year: () => $trans('Times / year'),
} satisfies FieldLabels<'equipment' | 'times_per_year'>


/**
 * A staged row is checked before it has a contract to belong to; the schema
 * takes the contract as nullish, so leaving it out raises no issue. Only the
 * two fields the user fills are reported: the name is copied from the picked
 * equipment and the tariff comes from a price input, so neither can be wrong
 * on its own.
 */
export function equipmentRowErrors(row: EquipmentRowState): FieldErrors<'equipment' | 'times_per_year'> {
  const {equipment, times_per_year} = fieldErrors<'equipment' | 'times_per_year'>(
    vMaintenanceEquipmentRequest, shapeEquipmentRow(row, null), {}, EQUIPMENT_ROW_LABELS)
  return {
    ...(equipment ? {equipment} : {}),
    ...(times_per_year ? {times_per_year} : {}),
  }
}
