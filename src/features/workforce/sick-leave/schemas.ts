import * as v from 'valibot'
import moment from 'moment'

import { vPatchedUserSickLeaveRequest, vUserSickLeaveRequest } from '@/api/valibot.gen'
import type { UserSickLeave } from '@/api/types.gen'
import { fieldErrors, selectMessage, type FieldErrors, type FieldMessages } from '@/features/forms/validation'
import type { FieldLabels } from '@/features/forms/validated-form-context'
import type { WriteContext } from '@/features/forms/use-resource-form'
import { $trans } from '@/services/i18n'

/**
 * A sick leave as the form holds it: the person it is about and the day it
 * starts.
 *
 * The endpoint's request also declares `end_date`, but no screen here sets it -
 * a sick leave is closed by the `end_sick` action, not by this form - so the
 * form does not carry the field and the parse never sends it.
 */
export type SickLeaveFormValues = {
  user: number | null
  start_date: string
}

export type SickLeaveFieldErrors = FieldErrors<keyof SickLeaveFormValues & string>

/** The `user_full_name` is a display-only companion the record carries in. */
export type SickLeaveCompanion = {user_name: string}

export function emptySickLeave(today: string): SickLeaveFormValues {
  return {user: null, start_date: today}
}

/**
 * The record as form values.
 *
 * The sick-leave response has no ISO twin of `start_date`: the serializer
 * rewrites it into the tenant's own `date_format` setting, so the only
 * machine-readable date is the display string. The legacy screen parsed it
 * against a hard-coded "DD/MM/YYYY", which is wrong for every tenant whose
 * setting is not that (the same bug the leave form's `start_date_iso` avoids).
 * The candidates below are the formats the setting is known to hold; a
 * `start_date_iso` twin on the serializer is what would retire this, and the
 * slice README records the ask.
 */
const DISPLAY_DATE_FORMATS = ['YYYY-MM-DD', 'DD-MM-YYYY', 'DD/MM/YYYY', 'MM/DD/YYYY', 'DD.MM.YYYY']

export function parseDisplayDate(value: string | null | undefined): string {
  if (!value) return ''
  const parsed = moment(value, DISPLAY_DATE_FORMATS, true)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : ''
}

export function sickLeaveFromRecord(record: UserSickLeave): SickLeaveFormValues {
  return {
    user: record.user,
    start_date: parseDisplayDate(record.start_date),
  }
}

export const FIELD_LABELS = {
  user: () => $trans('User'),
  start_date: () => $trans('Start date'),
} satisfies FieldLabels<keyof SickLeaveFormValues & string>

/** `start_date` is the only field the rule cannot read off the issue. */
export const FIELD_MESSAGES = {
  user: () => selectMessage(FIELD_LABELS.user()),
} satisfies FieldMessages<keyof SickLeaveFieldErrors & string>

/** `user` is already declared required; the date is optional on the wire. */
const vSickLeaveBody = v.required(vUserSickLeaveRequest, ['start_date'])

export function validateSickLeave(values: SickLeaveFormValues): SickLeaveFieldErrors {
  return fieldErrors(vSickLeaveBody, values, FIELD_MESSAGES, FIELD_LABELS)
}

/**
 * The body to send: the create parses the create component, the edit the patch
 * one. Both carry only what the endpoint declares - the legacy edit handler
 * PATCHed the whole loaded record back, `user_full_name`, `created_by` and the
 * status fields included.
 */
export function parseSickLeave(values: SickLeaveFormValues, context: WriteContext) {
  if (!context.isCreate) return v.parse(vPatchedUserSickLeaveRequest, values)
  return v.parse(vUserSickLeaveRequest, values)
}
