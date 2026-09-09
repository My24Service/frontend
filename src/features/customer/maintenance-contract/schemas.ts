import * as v from 'valibot'
import type Dinero from 'dinero.js'

import type { MaintenanceContract, MaintenanceEquipment } from '@/api/types.gen'
import {
  vMaintenanceContractWritable,
  vMaintenanceEquipmentWritable,
} from '@/api/valibot.gen'
import { $trans } from '@/utils'



const contractStrengthenings = {
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(255)),
}


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


export type ContractFieldErrors = Partial<Record<'customer' | 'name' | 'remarks', string>>


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


export function parseContractBody(
  values: MaintenanceContractFormValues,
): MaintenanceContractBody {
  return v.parse(maintenanceContractSchema, values)
}



const equipmentStrengthenings = {
  equipment: v.pipe(v.number(), v.integer()),
  equipment_name: v.pipe(v.string(), v.minLength(1), v.maxLength(255)),
}


export const maintenanceEquipmentSchema = v.object({
  ...vMaintenanceEquipmentWritable.entries,
  ...equipmentStrengthenings,
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
