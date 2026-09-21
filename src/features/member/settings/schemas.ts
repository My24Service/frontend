import * as v from 'valibot'

import type { MemberSettings, PatchedMemberSettingsRequest } from '@/api/types.gen'
import { vPatchedMemberSettingsRequest } from '@/api/valibot.gen'
import type { FieldLabels } from '@/features/forms/validated-form-context'
import { fieldErrors, humanizeKey, requiredMessage, type FieldErrors, type FieldMessages } from '@/features/forms/validation'
import { $trans } from '@/services/i18n'

/**
 * The typed tenant settings, as the settings screen edits them: every key
 * of the generated `MemberSettings`, grouped. The two lists ride the form
 * as comma-separated text; the integers as the text a number input holds.
 */
export type SettingKey = keyof MemberSettings & string

export const LIST_KEYS = ['countries', 'order_types'] as const satisfies readonly SettingKey[]
export const TEXT_KEYS = ['date_format', 'default_currency'] as const satisfies readonly SettingKey[]
export const INTEGER_KEYS = [
  'invoice_default_vat', 'invoice_default_term_of_payment_days', 'quotation_default_expire_days',
  'quotation_default_vat', 'customer_id_start', 'order_id', 'quotation_id', 'workorder_id',
  'purchase_order_id', 'invoice_id', 'break_calculation_after_minutes',
  'break_calculation_duration_minutes', 'app_session_token_expiry_days',
] as const satisfies readonly SettingKey[]
export const DECIMAL_KEYS = [
  'invoice_default_hourly_rate', 'invoice_default_call_out_costs',
  'invoice_default_price_per_km', 'quotation_default_call_out_costs', 'quotation_default_hourly_rate',
  'quotation_default_price_per_km',
] as const satisfies readonly SettingKey[]
export const BOOLEAN_KEYS = [
  'customer_id_autoincrement', 'order_uses_equipment', 'sick_leave_user_allowed_create',
  'sick_leave_user_allowed_end', 'equipment_planning_quick_create', 'equipment_quick_create',
  'equipment_location_planning_quick_create', 'equipment_location_quick_create',
  'order_list_include_reference', 'workorder_show_related_orders', 'break_calculation',
] as const satisfies readonly SettingKey[]

type TextKey = (typeof LIST_KEYS | typeof TEXT_KEYS | typeof INTEGER_KEYS | typeof DECIMAL_KEYS)[number]
type BooleanKey = (typeof BOOLEAN_KEYS)[number]

export type SettingsFormValues = Record<TextKey, string> & Record<BooleanKey, boolean>

/** The screen's groups, in display order; a key appears in exactly one. */
export const SETTING_GROUPS: {title: () => string; keys: readonly SettingKey[]}[] = [
  {title: () => $trans('Locale'), keys: ['countries', 'date_format', 'default_currency']},
  {title: () => $trans('Invoice'), keys: [
    'invoice_id', 'invoice_default_vat', 'invoice_default_hourly_rate',
    'invoice_default_call_out_costs', 'invoice_default_price_per_km', 'invoice_default_term_of_payment_days',
  ]},
  {title: () => $trans('Quotation'), keys: [
    'quotation_id', 'quotation_default_vat', 'quotation_default_hourly_rate', 'quotation_default_call_out_costs',
    'quotation_default_price_per_km', 'quotation_default_expire_days',
  ]},
  {title: () => $trans('Order'), keys: [
    'order_id', 'workorder_id', 'purchase_order_id', 'customer_id_start', 'customer_id_autoincrement',
    'order_types', 'order_uses_equipment', 'order_list_include_reference', 'workorder_show_related_orders',
    'sick_leave_user_allowed_create', 'sick_leave_user_allowed_end', 'app_session_token_expiry_days',
  ]},
  {title: () => $trans('Equipment'), keys: [
    'equipment_planning_quick_create', 'equipment_quick_create',
    'equipment_location_planning_quick_create', 'equipment_location_quick_create',
  ]},
  {title: () => $trans('Break calculation'), keys: [
    'break_calculation', 'break_calculation_after_minutes', 'break_calculation_duration_minutes',
  ]},
]

export function isBooleanKey(key: SettingKey): key is BooleanKey {
  return (BOOLEAN_KEYS as readonly string[]).includes(key)
}

export function emptySettings(): SettingsFormValues {
  const values: Record<string, string | boolean> = {}
  for (const key of [...LIST_KEYS, ...TEXT_KEYS, ...INTEGER_KEYS, ...DECIMAL_KEYS]) values[key] = ''
  for (const key of BOOLEAN_KEYS) values[key] = false
  return values as SettingsFormValues
}

export function settingsFromRecord(record: MemberSettings): SettingsFormValues {
  const values = emptySettings()
  for (const key of LIST_KEYS) values[key] = (record[key] ?? []).join(', ')
  for (const key of TEXT_KEYS) values[key] = record[key] ?? ''
  for (const key of INTEGER_KEYS) values[key] = record[key] === undefined ? '' : String(record[key])
  for (const key of DECIMAL_KEYS) values[key] = record[key] ?? ''
  for (const key of BOOLEAN_KEYS) values[key] = record[key] ?? false
  return values
}

export type SettingsFieldErrors = FieldErrors<SettingKey>

const decimalMessage = () => $trans('Please enter an amount, like 12.50')

/**
 * The decimals say what shape they want, which the regex alone would not;
 * the lists are typed as comma-separated text, so an empty one is entered
 * rather than selected. The integers and texts read the rule's own line.
 */
export const FIELD_MESSAGES = {
  ...Object.fromEntries(DECIMAL_KEYS.map((key) => [key, decimalMessage])),
  ...Object.fromEntries(LIST_KEYS.map((key) => [key, () => requiredMessage(settingLabel(key))])),
} as FieldMessages<SettingKey>

/** A readable label from the key: `invoice_default_vat` becomes "Invoice default vat". */
export function settingLabel(key: SettingKey): string {
  return humanizeKey(key)
}

export const FIELD_LABELS = Object.fromEntries(
  SETTING_GROUPS.flatMap((group) => group.keys).map((key) => [key, () => settingLabel(key)]),
) as FieldLabels<SettingKey>

function splitList(text: string): string[] {
  return text.split(',').map((part) => part.trim()).filter(Boolean)
}

/**
 * The typed text as a number: `2.5` fails the integer rule and reads as
 * "whole number", `abc` becomes NaN and reads as "a number", and a blank
 * stays blank so the required entry refuses it as missing.
 */
function toInteger(text: string): number | string {
  const trimmed = text.trim()
  return trimmed === '' ? trimmed : Number(trimmed)
}

function toWire(values: SettingsFormValues): Record<string, unknown> {
  const wire: Record<string, unknown> = {}
  for (const key of LIST_KEYS) wire[key] = splitList(values[key])
  for (const key of TEXT_KEYS) wire[key] = values[key].trim()
  for (const key of INTEGER_KEYS) wire[key] = toInteger(values[key])
  for (const key of DECIMAL_KEYS) wire[key] = values[key].trim().replace(',', '.')
  for (const key of BOOLEAN_KEYS) wire[key] = values[key]
  return wire
}

/** The generated request schema, with the lists and texts required non-empty on top. */
const settingsFormSchema = v.object({
  ...vPatchedMemberSettingsRequest.entries,
  countries: v.pipe(v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(2))), v.minLength(1)),
  order_types: v.pipe(v.array(v.pipe(v.string(), v.minLength(1))), v.minLength(1)),
  date_format: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
  default_currency: v.pipe(v.string(), v.minLength(1), v.maxLength(3)),
  ...Object.fromEntries(DECIMAL_KEYS.map((key) => [key, v.pipe(v.string(), v.regex(/^-?\d{1,8}(?:\.\d{1,2})?$/))])),
})

export function validateSettings(values: SettingsFormValues): SettingsFieldErrors {
  return fieldErrors(settingsFormSchema, toWire(values), FIELD_MESSAGES, FIELD_LABELS)
}

export function parseSettings(values: SettingsFormValues): PatchedMemberSettingsRequest {
  return v.parse(vPatchedMemberSettingsRequest, toWire(values))
}
