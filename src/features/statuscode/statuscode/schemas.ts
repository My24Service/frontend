import * as v from 'valibot'

import type { Statuscode } from '@/api/types.gen'
import { vStatuscodeRequest } from '@/api/valibot.gen'
import { fieldsFromRecord } from '@/features/forms/record-fields'
import type { FieldLabels } from '@/features/forms/validated-form-context'
import { fieldErrors, type FieldErrors, type FieldMessages } from '@/features/forms/validation'
import { $trans } from '@/services/i18n'

import type { CodeType } from '../code-types'
import { labelTextColor } from './palette'

type WireValues = v.InferInput<typeof vStatuscodeRequest>

/**
 * The three fields of a date trigger: `num_days`, compared with
 * `num_days_operator`, from the date in `num_days_model_field`. For an order
 * the backend sets the statuscode on the orders in that window (a reminder
 * mail "14 days before `start_date`"); for a quotation it says when the
 * quotation expires.
 */
const DATE_TRIGGER_FIELDS = ['num_days', 'num_days_operator', 'num_days_model_field'] as const

/** The code types whose statuscodes carry a date trigger. */
export const DATE_TRIGGER_TYPES: readonly CodeType[] = ['order', 'quotation']

export function hasDateTrigger(codeType: CodeType): boolean {
  return DATE_TRIGGER_TYPES.includes(codeType)
}

/** The order date fields a trigger can count from; the backend accepts no others. */
export const ORDER_DATE_TRIGGER_FIELDS = ['start_date', 'end_date'] as const

/**
 * The form's state. `code_type` is not on it: the screen is mounted per type
 * and stamps it on the body at parse time. `text_color` is not on it either:
 * it is derived from `color` at parse time (see `./palette`), so a label can
 * never be unreadable. `num_days` is held as the string a number input
 * produces, until parse turns it into the integer the wire wants.
 */
export type StatuscodeFormValues = Omit<
  WireValues,
  'code_type' | 'text_color' | 'num_days' | 'start_order' | 'end_order' | 'after_end_order'
  | 'color_for_assignedorders' | 'can_be_reassigned_after_end' | 'as_filter' | 'settings_key'
> & {
  num_days?: number | string | null
  roles: string[]
}

export function emptyStatuscode(): StatuscodeFormValues {
  return {
    statuscode: '',
    color: '',
    description: '',
    new_status_template: '',
    num_days: null,
    num_days_operator: '<',
    num_days_model_field: null,
    roles: [],
  }
}

export function statuscodeFromRecord(record: Statuscode): StatuscodeFormValues {
  const fields = fieldsFromRecord(vStatuscodeRequest, record)
  return {
    ...emptyStatuscode(),
    statuscode: fields.statuscode ?? '',
    color: fields.color ?? '',
    description: fields.description,
    new_status_template: fields.new_status_template,
    num_days: fields.num_days,
    num_days_operator: fields.num_days_operator ?? '<',
    num_days_model_field: fields.num_days_model_field,
    roles: [...(record.roles ?? [])],
  }
}

/** The form's validator: the generated request schema with the code type left to the screen. */
const statuscodeFormSchema = v.omit(vStatuscodeRequest, ['code_type'])

export type StatuscodeFieldErrors = FieldErrors<keyof StatuscodeFormValues & string>

const MESSAGES = {
  statuscode_required: () => $trans('Please enter a statuscode'),
  color_required: () => $trans('Please choose a color'),
  num_days_integer: () => $trans('Please enter a valid integer'),
} as const

export const FIELD_MESSAGES = {
  statuscode: MESSAGES.statuscode_required,
  color: MESSAGES.color_required,
  num_days: MESSAGES.num_days_integer,
} satisfies FieldMessages<keyof StatuscodeFormValues & string>

export const FIELD_LABELS = {
  statuscode: () => $trans('Statuscode'),
} satisfies FieldLabels<keyof StatuscodeFormValues & string>

/** A blank text field goes out as null, so an edit can clear it. */
function blankToNull(value: string | null | undefined): string | null {
  return value ? value : null
}

/** What a number input typed, as the integer the wire wants — or as typed, so the schema can refuse it. */
function daysToNumber(value: number | string | null | undefined): number | string | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return value
  const trimmed = value.trim()
  return /^-?\d+$/.test(trimmed) ? Number(trimmed) : trimmed
}

function toWire(values: StatuscodeFormValues): Record<string, unknown> {
  return {
    statuscode: values.statuscode,
    color: values.color ?? '',
    text_color: labelTextColor(values.color),
    description: blankToNull(values.description),
    new_status_template: blankToNull(values.new_status_template),
    num_days: daysToNumber(values.num_days),
    num_days_operator: values.num_days_operator,
    num_days_model_field: blankToNull(values.num_days_model_field),
    roles: values.roles,
  }
}

export function validateStatuscode(values: StatuscodeFormValues): StatuscodeFieldErrors {
  return fieldErrors(statuscodeFormSchema, toWire(values), FIELD_MESSAGES)
}

export type StatuscodeBody = v.InferOutput<typeof vStatuscodeRequest>

/**
 * The body for `codeType`. Only the types in `DATE_TRIGGER_TYPES` carry the
 * date trigger; every other type leaves those three fields off the wire.
 */
export function parseStatuscode(values: StatuscodeFormValues, codeType: CodeType): StatuscodeBody {
  const wire: Record<string, unknown> = {...toWire(values), code_type: codeType}
  if (!hasDateTrigger(codeType)) {
    for (const field of DATE_TRIGGER_FIELDS) delete wire[field]
  }
  return v.parse(vStatuscodeRequest, wire)
}
