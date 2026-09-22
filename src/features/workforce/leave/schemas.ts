import * as v from 'valibot'

import {
  vLeaveTypeRequest,
  vPatchedUserLeaveHoursPlanningRequest,
  vUserLeaveHoursNoPlanningRequest,
  vUserLeaveHoursPlanningRequest,
} from '@/api/valibot.gen'
import type { LeaveType, LeaveTypeRequest, UserLeaveHours } from '@/api/types.gen'
import {
  fieldErrors,
  requiredOrMaxLength,
  selectMessage,
  type FieldErrors,
  type FieldMessages,
  type FieldLabels,
  type WriteContext,
} from '@/features/forms'
/**
 * A leave as the form holds it.
 *
 * The wire body is `UserLeaveHoursPlanningRequest`; the fields that differ are
 * the three the form owns for itself:
 *
 *  - `user` and `leave_type` are `null` until a picker is used, where the
 *    request declares them nullish-but-present;
 *  - `start_time`/`end_time` are the "HH:mm" the inputs show, decomposed into
 *    `start_date_hours`/`start_date_minutes` (and the end pair) at the parse;
 *  - `total_time` is the totals probe's answer, display only - it never rides.
 *
 * Everything else the form needs comes from the request component, so a field
 * added to the serializer is a field this type already has.
 */
export type LeaveFormValues = Omit<
  v.InferInput<typeof vUserLeaveHoursPlanningRequest>,
  'user' | 'leave_type' | 'description' | 'start_date' | 'end_date'
  | 'start_date_hours' | 'start_date_minutes' | 'start_date_is_whole_day'
  | 'end_date_hours' | 'end_date_minutes' | 'end_date_is_whole_day'
> & {
  user: number | null
  leave_type: number | null
  description: string
  start_date: string
  end_date: string
  start_date_is_whole_day: boolean
  end_date_is_whole_day: boolean
  /** "HH:mm", the value the two time inputs show. */
  start_time: string
  end_time: string
  /** The probe's answer as the screen prints it. Never sent. */
  total_time: string
}

export type LeaveFieldErrors = FieldErrors<keyof LeaveFormValues & string>

/** The blank leave the create form starts on, seeded with today's date. */
export function emptyLeave(today: string, now: string): LeaveFormValues {
  return {
    user: null,
    leave_type: null,
    description: '',
    start_date: today,
    end_date: today,
    start_date_is_whole_day: true,
    end_date_is_whole_day: true,
    start_time: now,
    end_time: now,
    total_time: '',
  }
}

/**
 * The record as form values.
 *
 * The dates come from the response's ISO twins (`start_date_iso`,
 * `end_date_iso`): the plain `start_date` is display-formatted in the tenant's
 * own date format, and the legacy screen parsed it against a hard-coded
 * "DD/MM/YYYY" - which is only right for the tenants that happen to use that
 * format. The ledger records the change.
 */
export function leaveFromRecord(record: UserLeaveHours): LeaveFormValues {
  return {
    user: record.user ?? null,
    leave_type: record.leave_type ?? null,
    description: record.description ?? '',
    start_date: record.start_date_iso,
    end_date: record.end_date_iso,
    start_date_is_whole_day: record.start_date_is_whole_day ?? false,
    end_date_is_whole_day: record.end_date_is_whole_day ?? false,
    start_time: timeOf(record.start_date_hours, record.start_date_minutes),
    end_time: timeOf(record.end_date_hours, record.end_date_minutes),
    total_time: '',
  }
}

/** "9:0" as the record stores it reads "09:00" - the inputs and the rule want HH:mm. */
function timeOf(hours: number | null | undefined, minutes: number | null | undefined): string {
  const hh = String(hours ?? 0).padStart(2, '0')
  const mm = String(minutes ?? 0).padStart(2, '0')
  return `${hh}:${mm}`
}

export const FIELD_LABELS = {
  user: () => $trans('User'),
  leave_type: () => $trans('Leave type'),
  description: () => $trans('Description'),
  start_date: () => $trans('Start date'),
  end_date: () => $trans('End date'),
  start_time: () => $trans('Start time'),
  end_time: () => $trans('End time'),
} satisfies FieldLabels<keyof LeaveFormValues & string>

/**
 * The two lines a rule cannot read off the issue: a time that must read HH:mm
 * (the schema sees the decomposed hours and minutes, not the text), and the two
 * pickers whose `null` the shaping drops before the schema sees it.
 */
export const FIELD_MESSAGES = {
  user: () => selectMessage(FIELD_LABELS.user()),
  leave_type: () => selectMessage(FIELD_LABELS.leave_type()),
  start_time: () => $trans('Please enter a valid start time HH:mm'),
  end_time: () => $trans('Please enter a valid end time HH:mm'),
} satisfies FieldMessages<keyof LeaveFieldErrors & string>

/**
 * The create body, with the four fields the endpoint cannot do without made
 * required. `user`, `leave_type` and the two dates are optional or nullish in
 * the generated component; a leave without them is not a leave.
 */
const vLeaveBody = v.required(
  vUserLeaveHoursPlanningRequest,
  ['user', 'leave_type', 'start_date', 'end_date'],
)

/** The same for the probe, whose endpoint validates with the no-planning body. */
const vLeaveProbeBody = v.required(
  vUserLeaveHoursNoPlanningRequest,
  ['start_date', 'end_date'],
)

const HH_MM = /^(?:[01]\d|2[0-3]):[0-5]\d$/

export function isClockTime(value: string): boolean {
  return HH_MM.test(value)
}

/**
 * The window both bodies share: the dates, the whole-day flags, and the clock
 * decomposed into the hours and minutes the request declares. Blank halves ride
 * as absent keys rather than as nulls or as the "HH:mm" text the input holds.
 */
function windowBody(values: LeaveFormValues): Record<string, unknown> {
  const body: Record<string, unknown> = {
    start_date: values.start_date,
    end_date: values.end_date,
    start_date_is_whole_day: values.start_date_is_whole_day,
    end_date_is_whole_day: values.end_date_is_whole_day,
  }

  // A whole day has no clock on it: the legacy screen sent the time anyway and
  // let the backend decide, which is why an "all day" leave could store 09:00.
  for (const [time, hours, minutes, wholeDay] of [
    [values.start_time, 'start_date_hours', 'start_date_minutes', values.start_date_is_whole_day],
    [values.end_time, 'end_date_hours', 'end_date_minutes', values.end_date_is_whole_day],
  ] as const) {
    if (wholeDay || !isClockTime(time)) continue
    const [hh, mm] = time.split(':')
    body[hours] = Number(hh)
    body[minutes] = Number(mm)
  }

  return body
}

/**
 * The wire body: the times decompose into the hours and minutes the request
 * declares, and blank halves ride as absent keys rather than as nulls or as the
 * "HH:mm" text the input happens to hold.
 */
function shaped(values: LeaveFormValues): Record<string, unknown> {
  const body = windowBody(values)

  if (values.user !== null) body.user = values.user
  if (values.leave_type !== null) body.leave_type = values.leave_type
  if (values.description) body.description = values.description

  return body
}

/**
 * The schema's verdict, plus the one rule it cannot hold.
 *
 * A clock is validated by the form, not by the schema: the wire carries
 * `start_date_hours`/`start_date_minutes`, so the shape drops a time text it
 * cannot read and the parse never sees the mistake. A half-typed time on a day
 * that is not whole is refused here instead of silently riding as "no time".
 */
export function validateLeave(values: LeaveFormValues): LeaveFieldErrors {
  const errors = fieldErrors<keyof LeaveFormValues & string>(
    vLeaveBody, shaped(values), FIELD_MESSAGES, FIELD_LABELS,
  )

  if (!values.start_date_is_whole_day && !isClockTime(values.start_time)) {
    errors.start_time = FIELD_MESSAGES.start_time()
  }
  if (!values.end_date_is_whole_day && !isClockTime(values.end_time)) {
    errors.end_time = FIELD_MESSAGES.end_time()
  }

  return errors
}

/**
 * The body to send: the create parses the create component, the edit the patch
 * one, and both strip to the keys they declare. The form saves a whole leave,
 * so both writes validate against the create body - the patch body it sends is
 * a superset of what PATCH requires.
 */
export function parseLeave(values: LeaveFormValues, context: WriteContext) {
  const body = shaped(values)
  if (!context.isCreate) return v.parse(vPatchedUserLeaveHoursPlanningRequest, body)
  return v.parse(vUserLeaveHoursPlanningRequest, body)
}

/**
 * The body of the totals probe: the window alone.
 *
 * The endpoint validates with the no-planning body and overwrites `user` with
 * the requesting user, so the picker's value has no business on this request -
 * which is also why an unpicked leave type is left out rather than sent as the
 * empty string the legacy screen posted (a body its own schema rejects; the
 * ledger records it).
 */
export function leaveProbeBody(values: LeaveFormValues) {
  const body = windowBody(values)

  if (values.leave_type !== null) body.leave_type = values.leave_type
  if (values.description) body.description = values.description

  return v.parse(vLeaveProbeBody, body)
}

// ---------------------------------------------------------------------------
// Leave types

export type LeaveTypeFieldErrors = FieldErrors<keyof LeaveTypeRequest & string>

export function emptyLeaveType(): LeaveTypeRequest {
  return {name: '', counts_as_leave: true}
}

export function leaveTypeFromRecord(record: LeaveType): LeaveTypeRequest {
  return {name: record.name, counts_as_leave: record.counts_as_leave ?? false}
}

export const LEAVE_TYPE_LABELS = {
  name: () => $trans('Name'),
  counts_as_leave: () => $trans('Counts as leave'),
} satisfies FieldLabels<keyof LeaveTypeRequest & string>

/**
 * The modal's `Name` sits beside a "Counts as leave" switch, where the derived
 * "Please enter a name" reads as if it were about the switch - so this field
 * keeps the legacy line. The too-long half is the shared template, because the
 * rule can say that one.
 */
export const LEAVE_TYPE_MESSAGES = {
  name: requiredOrMaxLength(
    () => $trans('Please enter a leave type name'),
    () => $trans('Please use at most 150 characters'),
  ),
} satisfies FieldMessages<keyof LeaveTypeFieldErrors & string>

/** `name` already carries `minLength(1)` in the generated component. */
export function validateLeaveType(values: LeaveTypeRequest): LeaveTypeFieldErrors {
  return fieldErrors(vLeaveTypeRequest, values, LEAVE_TYPE_MESSAGES, LEAVE_TYPE_LABELS)
}

/**
 * The body both writes send: the two fields the modal shows and nothing else.
 *
 * Both parse the create component, which is the one that says what a whole
 * leave type needs; the patch body the edit sends is a superset of what PATCH
 * requires, and the two components declare the same keys. The legacy edit
 * handler spread the whole record into the form and PATCHed it back, which
 * carried `id`, `created` and `modified` - the parse drops what the endpoint
 * does not declare.
 */
export function parseLeaveType(values: LeaveTypeRequest): LeaveTypeRequest {
  return v.parse(vLeaveTypeRequest, values)
}

/** The totals probe's answer, as the screen prints it. */
export function humanizeDuration(hours: number | null | undefined, minutes: number | null | undefined): string {
  let readable = ''
  if (hours) {
    readable += `${hours} hour${hours > 1 ? 's' : ''}`
  }
  if (minutes) {
    if (readable) readable += ' '
    readable += `${minutes} minute${minutes > 1 ? 's' : ''}`
  }
  return readable
}
