import * as v from 'valibot'

import type { Action, ActionTypeEnum } from '@/api/types.gen'
import { vActionRequest } from '@/api/valibot.gen'
import { fieldsFromRecord } from '@/features/forms/record-fields'
import { fieldErrors, type FieldErrors, type FieldMessages } from '@/features/forms/validation'
import { $trans } from '@/services/i18n'

import type { CodeType } from '../code-types'

type WireValues = v.InferInput<typeof vActionRequest>

export type ActionCondition = NonNullable<WireValues['json_conditions']>[number]

/**
 * The form's state. `statuscode` is on it only after an edit's record
 * arrives; a create takes it from the route and stamps it at parse time.
 * `json_conditions` is never null on the form — the condition table needs a
 * list to push onto.
 */
export type ActionFormValues = Omit<WireValues, 'statuscode' | 'json_conditions'> & {
  statuscode?: number
  json_conditions: ActionCondition[]
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
  }
}

export function actionFromRecord(record: Action): ActionFormValues {
  const fields = fieldsFromRecord(vActionRequest, record)
  return {
    ...emptyAction(),
    ...fields,
    json_conditions: record.json_conditions ?? [],
  }
}

const actionFormSchema = v.omit(vActionRequest, ['statuscode'])

export type ActionFieldErrors = FieldErrors<keyof ActionFormValues & string>

const MESSAGES = {
  name_required: () => $trans('Please enter a name'),
  name_max_length: () => $trans('Please use at most 120 characters'),
} as const

export const FIELD_MESSAGES = {
  name: (issue?: v.BaseIssue<unknown>) =>
    issue?.type === 'max_length' ? MESSAGES.name_max_length() : MESSAGES.name_required(),
} satisfies FieldMessages<keyof ActionFormValues & string>

function blankToNull(value: string | null | undefined): string | null {
  return value ? value : null
}

function toWire(values: ActionFormValues): Record<string, unknown> {
  return {
    ...values,
    address: blankToNull(values.address),
    subject: blankToNull(values.subject),
    template: blankToNull(values.template),
    description: blankToNull(values.description),
  }
}

export function validateAction(values: ActionFormValues): ActionFieldErrors {
  return fieldErrors(actionFormSchema, toWire(values), FIELD_MESSAGES)
}

export type ActionBody = v.InferOutput<typeof vActionRequest>

/** Where the action's statuscode comes from: the route on a create, the record on an edit. */
export interface ActionWrite {
  isCreate: boolean
  statuscodePk: string | number | null
}

export function parseAction(values: ActionFormValues, write: ActionWrite): ActionBody {
  const statuscode = write.isCreate ? Number(write.statuscodePk) : values.statuscode
  return v.parse(vActionRequest, {...toWire(values), statuscode})
}

export interface ActionTypeOption {
  value: ActionTypeEnum
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
