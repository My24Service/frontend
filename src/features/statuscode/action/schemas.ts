import * as v from 'valibot'

import {
  fieldsFromRecord,
  type FieldLabels,
  fieldErrors,
  type FieldErrors,
} from '@/features/forms'
import type { CodeType } from '../code-types'

type WireValues = v.InferInput<typeof schemas.vActionRequest>

export type ActionCondition = NonNullable<WireValues['json_conditions']>[number]

/**
 * An action's date trigger: `num_days`, compared with `num_days_operator`,
 * from the date in `num_days_model_field`. An action with one does not run
 * when its statuscode is set; the backend's daily task runs it once for every
 * record that has the statuscode anywhere in its history and whose date is in
 * the window ("`start_date` `<=` 14": a reminder two weeks before the job).
 * The date fields the backend accepts, per code type; other types have none.
 */
export const DATE_TRIGGER_FIELDS: Partial<Record<CodeType, readonly string[]>> = {
  order: ['start_date', 'end_date'],
  invoice: ['definitive_date'],
}

export function dateTriggerFieldsFor(codeType: CodeType): readonly string[] {
  return DATE_TRIGGER_FIELDS[codeType] ?? []
}

/**
 * The form's state. `statuscode` is on it only after an edit's record
 * arrives; a create takes it from the route and stamps it at parse time.
 * `json_conditions` is never null on the form — the condition table needs a
 * list to push onto. `num_days` is held as the string a number input
 * produces, until parse turns it into the integer the wire wants.
 */
export type ActionFormValues = Omit<WireValues, 'statuscode' | 'json_conditions' | 'num_days'> & {
  statuscode?: number
  json_conditions: ActionCondition[]
  num_days?: number | string | null
}

export function emptyAction(): ActionFormValues {
  return {
    name: '',
    type: 'email',
    description: '',
    address: '',
    subject: '',
    template: '',
    company_partner: null,
    json_conditions: [],
    querymode: 'or',
    override_status: false,
    num_days: null,
    num_days_operator: '<=',
    num_days_model_field: null,
  }
}

export function actionFromRecord(record: Api.Action): ActionFormValues {
  const fields = fieldsFromRecord(schemas.vActionRequest, record)
  return {
    ...emptyAction(),
    ...fields,
    // Clone the conditions off the cached record: the query data is readonly,
    // so pushing/splicing the record's own array warns and does nothing.
    json_conditions: (record.json_conditions ?? []).map((condition) => ({...condition})),
  }
}

const actionFormSchema = v.omit(schemas.vActionRequest, ['statuscode'])

export type ActionFieldErrors = FieldErrors<keyof ActionFormValues>

export const FIELD_LABELS = {
  name: () => $trans('Name'),
  num_days: () => $trans('Number of days'),
} satisfies FieldLabels<keyof ActionFormValues>

function blankToNull(value: string | null | undefined): string | null {
  return value ? value : null
}

/** What a number input typed, as the integer the wire wants — or as typed, so the schema can refuse it. */
function daysToNumber(value: number | string | null | undefined): number | string | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return value
  return Number(value.trim())
}

/** Without a date field there is no trigger, so the days go out empty too. */
function toWire(values: ActionFormValues): Record<string, unknown> {
  const field = blankToNull(values.num_days_model_field)
  return {
    ...values,
    address: blankToNull(values.address),
    subject: blankToNull(values.subject),
    template: blankToNull(values.template),
    description: blankToNull(values.description),
    num_days: field ? daysToNumber(values.num_days) : null,
    num_days_model_field: field,
  }
}

export function validateAction(values: ActionFormValues): ActionFieldErrors {
  const errors = fieldErrors(actionFormSchema, toWire(values), {}, FIELD_LABELS)
  // a trigger needs its number of days; the wire alone would take null
  if (values.num_days_model_field && !errors.num_days && daysToNumber(values.num_days) === null) {
    return {...errors, num_days: $trans('Please enter a whole number')}
  }
  return errors
}

/** Where the action's statuscode comes from: the route on a create, the record on an edit. */
export interface ActionWrite {
  isCreate: boolean
  statuscodePk: string | number | null
}

export function parseAction(values: ActionFormValues, write: ActionWrite): Api.ActionRequest {
  const statuscode = write.isCreate ? Number(write.statuscodePk) : values.statuscode
  return v.parse(schemas.vActionRequest, {...toWire(values), statuscode})
}

export interface ActionTypeOption {
  value: Api.ActionTypeEnum
  text: string
}

/**
 * The action types a code type may trigger. An order has the full set —
 * "send to Gripp" only for tenants with the connector; every other type
 * notifies and nothing else.
 */
export function actionTypesFor(codeType: CodeType, access: {hasGripp: boolean}): ActionTypeOption[] {
  const notify: ActionTypeOption[] = [
    {value: 'email', text: $trans('send email')},
    {value: 'send_sms', text: $trans('send sms')},
    {value: 'send_fcm', text: $trans('send FCM')},
  ]
  if (codeType !== 'order') return notify

  return [
    {value: 'email', text: $trans('send email')},
    {value: 'email_assigned', text: $trans('email assigned engineers')},
    {value: 'copy', text: $trans('copy order to partner')},
    {value: 'status', text: $trans('status change original order')},
    {value: 'email_workorders', text: $trans('email workorders')},
    {value: 'send_sms', text: $trans('send sms')},
    {value: 'send_fcm', text: $trans('send FCM')},
    ...(access.hasGripp ? [{value: 'send_to_gripp' as const, text: $trans('send to Gripp')}] : []),
  ]
}
