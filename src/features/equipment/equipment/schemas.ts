import * as v from 'valibot'
import { format, parseISO } from 'date-fns'
import { EQUIPMENT_TYPES } from '@/constants'
import type { FieldErrors } from '@/features/forms'
import type { FieldLabels } from '@/features/forms'
import { $trans } from '@/services/i18n'
import {
  vEquipmentBranchCreateRequest,
  vEquipmentCustomerCreateRequest,
  vPatchedEquipmentRequest,
} from '@/api/valibot.gen'
import type { Equipment } from '@/api/types.gen'
import { ownedRecordSchemas } from '@/features/equipment/owner'

type EquipmentCreateValues = v.InferInput<typeof vEquipmentBranchCreateRequest>

/**
 * What the equipment form binds to.
 *
 * The create body is a union - `{branch, …}` or `{customer, …}` - but the form
 * holds both owner slots, because which one applies is a property of the tenant
 * rather than of the field; the parse below resolves the union and drops the
 * slot that does not apply. `branch` is nullable here where the request
 * component requires it: on a create nothing is picked yet.
 *
 * `price_currency` is the read-only companion `PriceInput` needs to render the
 * amount. The request direction does not declare it, so the parse drops it again.
 */
export type EquipmentFormValues =
  Omit<EquipmentCreateValues, 'branch'> & {
    branch: number | null
    customer: number | null
    price_currency: string
  }

export type EquipmentFieldErrors = FieldErrors<keyof EquipmentFormValues & string>

/** An equipment as the form is filled in from scratch. */
export function emptyEquipment(currency: string): EquipmentFormValues {
  return {
    name: '',
    type: EQUIPMENT_TYPES.TECHNICAL,
    branch: null,
    customer: null,
    location: null,
    brand: null,
    identifier: null,
    description: null,
    serialnumber: null,
    standard_hours: null,
    installation_date: null,
    production_date: null,
    price: '0.00',
    price_currency: currency,
  }
}

/**
 * The fetched record as form values.
 *
 * `default_replace_months` stays absent rather than null when the record has
 * none: the generated entry is `v.optional(v.number())`, which refuses a null.
 */
export function equipmentFromRecord(record: Equipment): EquipmentFormValues {
  return {
    name: record.name,
    type: record.type,
    branch: record.branch ?? null,
    customer: record.customer ?? null,
    location: record.location ?? null,
    brand: record.brand ?? null,
    identifier: record.identifier ?? null,
    description: record.description ?? null,
    serialnumber: record.serialnumber ?? null,
    standard_hours: record.standard_hours ?? null,
    installation_date: record.installation_date ?? null,
    production_date: record.production_date ?? null,
    default_replace_months: record.default_replace_months,
    price: record.price ?? '0.00',
    price_currency: record.price_currency,
  }
}

/** The record's `YYYY-MM-DD` as the datepicker's model, or nothing. */
export function pickerDate(iso: string | null | undefined): Date | null {
  return iso ? parseISO(iso) : null
}

/**
 * The wire's value for a picked date.
 *
 * Formatted from the Date's local getters rather than `toISOString()`, which
 * reports the previous day for any evening pick east of UTC. Anything that is
 * not a Date - the picker's own null when the field is cleared - clears the
 * field, which the generated `isoDate` entry then accepts as nullish.
 */
export function wireDate(value: Date | null | undefined): string | null {
  return value ? format(value, 'yyyy-MM-dd') : null
}

export const FIELD_LABELS = {
  name: () => $trans('Name'),
} satisfies FieldLabels<keyof EquipmentFormValues & string>

/**
 * Validation and the wire body, shared with the other owned records: the
 * generated entries under the copy above, the owner rule, and the parse
 * against this tenant's create variant or the patch body - see
 * `ownedRecordSchemas`.
 */
export const {validate: validateEquipment, parse: parseEquipment} = ownedRecordSchemas<EquipmentFormValues>({
  branch: vEquipmentBranchCreateRequest,
  customer: vEquipmentCustomerCreateRequest,
  patch: vPatchedEquipmentRequest,
  labels: FIELD_LABELS,
})
