import * as v from 'valibot'
import type Dinero from 'dinero.js'

import type { MaintenanceContract, MaintenanceEquipment } from '@/api/types.gen'
import {
  vMaintenanceContractRequest,
  vMaintenanceEquipmentRequest,
} from '@/api/valibot.gen'
import { fieldErrors, type FieldErrors, type FieldMessages } from '@/features/shared/form-validation'
import { $trans } from '@/utils'



/**
 * The generated *request* schema - not the `Writable` projection of the read
 * component, which is what this form used to parse against. The two are not
 * the same artifact: `Writable` is the response shape with its read-only keys
 * dropped, and it carries none of the request-direction required-ness that
 * COMPONENT_SPLIT_REQUEST puts on the real request component.
 *
 * One strengthening survives the switch: `name` is nullable and blankable on
 * the wire (the column is `blank=True, null=True`) and required here. Piped
 * onto the generated entry rather than redeclared, so its maxLength(255)
 * stays where codegen puts it. See docs/schema-strengthenings.md for the
 * backend fix that would retire it.
 */
export const maintenanceContractSchema = v.object({
  ...vMaintenanceContractRequest.entries,
  name: v.pipe(v.unwrap(vMaintenanceContractRequest.entries.name), v.minLength(1)),
})

export type MaintenanceContractBody = v.InferOutput<typeof maintenanceContractSchema>

/** The wire shape, except that the picker is empty until a customer is chosen. */
export type MaintenanceContractFormValues =
  Omit<v.InferInput<typeof maintenanceContractSchema>, 'customer'> & {customer: number | null}


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


export type ContractFieldErrors = FieldErrors<'customer' | 'name' | 'remarks'>


const FIELD_MESSAGES = {
  customer: () => $trans('Please select a customer'),
  name: () => $trans('Please enter a contract name'),
} satisfies FieldMessages<'customer' | 'name'>


export function validateContractForm(
  values: MaintenanceContractFormValues,
): ContractFieldErrors {
  return fieldErrors(maintenanceContractSchema, values, FIELD_MESSAGES)
}


export function parseContractBody(
  values: MaintenanceContractFormValues,
): MaintenanceContractBody {
  return v.parse(maintenanceContractSchema, values)
}



/**
 * Same again for the equipment rows. The request component already declares a
 * non-blank `equipment_name`; only `equipment` needs lifting, because the FK
 * is nullable on the wire (`null=True, blank=True`) and this form will not
 * save a row without one.
 */
export const maintenanceEquipmentSchema = v.object({
  ...vMaintenanceEquipmentRequest.entries,
  equipment: v.unwrap(vMaintenanceEquipmentRequest.entries.equipment),
})

export type MaintenanceEquipmentBody = v.InferOutput<typeof maintenanceEquipmentSchema>


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


export function equipmentRowErrors(row: EquipmentRowState): Partial<Record<'equipment' | 'times_per_year', string>> {
  const errors: Partial<Record<'equipment' | 'times_per_year', string>> = {}
  if (row.equipment === null) errors.equipment = $trans('Please select an equipment')
  if (row.times_per_year !== '' && !(parseInt(row.times_per_year) > 0)) {
    errors.times_per_year = $trans('Please enter a number')
  }
  return errors
}
