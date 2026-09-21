import * as v from 'valibot'

import { vPatchedUserSickLeaveRequest, vUserSickLeaveRequest } from '@/api/valibot.gen'
import type { UserSickLeave } from '@/api/types.gen'
import { fieldErrors, selectMessage, type FieldErrors, type FieldMessages } from '@/features/forms/validation'
import type { FieldLabels } from '@/features/forms/validated-form-context'
import type { WriteContext } from '@/features/forms/use-resource-form'
import { $trans } from '@/services/i18n'

/**
 * A sick leave as the form holds it: the person it is about and the day it
 * starts, taken from the create component.
 *
 * The endpoint's request also declares `end_date`, but no screen here sets it -
 * a sick leave is closed by the `end_sick` action, not by this form - so the
 * form does not carry the field and the parse never sends it.
 */
export type SickLeaveFormValues =
  Pick<v.InferInput<typeof vUserSickLeaveRequest>, 'start_date'>
  & {
    // a picker that is empty rather than absent until chosen
    user: number | null
  }

export type SickLeaveFieldErrors = FieldErrors<keyof SickLeaveFormValues & string>

export function emptySickLeave(today: string): SickLeaveFormValues {
  return {user: null, start_date: today}
}

/**
 * The record as form values.
 *
 * The day comes from the response's ISO twin (`start_date_iso`). The plain
 * `start_date` is a display string the serializer rewrites into the tenant's
 * own `date_format` setting, so reading it back would mean guessing which
 * format the tenant configured - the same reading the leave form does, and the
 * ledger records the change.
 */
export function sickLeaveFromRecord(record: UserSickLeave): SickLeaveFormValues {
  return {
    user: record.user,
    start_date: record.start_date_iso,
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
