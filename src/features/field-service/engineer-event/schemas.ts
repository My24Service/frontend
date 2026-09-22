import * as v from 'valibot'

import type { EngineerEventType, EngineerEventTypeRequest } from '@/api/types.gen'
import { vEngineerEventTypeRequest } from '@/api/valibot.gen'
import {
  type FieldLabels,
  fieldErrors,
  type FieldErrors,
  type FieldMessages,
} from '@/features/forms'
/**
 * The event-type form's own state: the request component's three fields, with
 * the two the form holds differently spelled out. The generated entries widen
 * both optional fields to `nullish`, while the form holds the text an input
 * produces (`''` for an empty "Measure last event type", never `null`) and
 * the `id | null` a select's empty option carries. A fourth field on the
 * serializer is one this form does not offer yet.
 */
export type EngineerEventTypeFormValues =
  Omit<v.InferInput<typeof vEngineerEventTypeRequest>, 'measure_last_event_type' | 'statuscode'>
  & {
    measure_last_event_type: string
    statuscode: number | null
  }

export type EngineerEventTypeFieldErrors = FieldErrors<keyof EngineerEventTypeFormValues & string>

export function emptyEngineerEventType(): EngineerEventTypeFormValues {
  return {event_type: '', measure_last_event_type: '', statuscode: null}
}

/**
 * The record as form values. Only the three fields the form shows are read:
 * the record also carries `created`, `modified`, `statuscode_view` and the
 * three counts, which the legacy screen carried back onto the wire and the
 * parse now drops.
 */
export function engineerEventTypeFromRecord(record: EngineerEventType): EngineerEventTypeFormValues {
  return {
    event_type: record.event_type,
    measure_last_event_type: record.measure_last_event_type ?? '',
    statuscode: record.statuscode ?? null,
  }
}

export const FIELD_LABELS = {
  event_type: () => $trans('Event type'),
} satisfies FieldLabels<keyof EngineerEventTypeFormValues & string>

/**
 * The legacy screen's own line for the one required field. The derived
 * "Please enter an event type" would do, but the legacy copy is what a
 * translator has already seen and what its spec pins.
 */
export const FIELD_MESSAGES = {
  event_type: () => $trans('Please enter a type'),
} satisfies FieldMessages<keyof EngineerEventTypeFormValues & string>

/**
 * The wire body.
 *
 * A blank "Measure last event type" rides as `null` rather than as an absent
 * key: the generated entry is `nullish`, so null both clears the field on an
 * edit and leaves the create with nothing stored — where the legacy screen
 * deleted the key, which meant an edit could never clear it.
 */
function shaped(values: EngineerEventTypeFormValues): Record<string, unknown> {
  return {
    event_type: values.event_type,
    measure_last_event_type: values.measure_last_event_type || null,
    statuscode: values.statuscode,
  }
}

export function validateEngineerEventType(values: EngineerEventTypeFormValues): EngineerEventTypeFieldErrors {
  return fieldErrors(vEngineerEventTypeRequest, shaped(values), FIELD_MESSAGES, FIELD_LABELS)
}

/**
 * The body both writes send.
 *
 * Both parse the create component — the one that says what a whole event type
 * needs, and the one whose `event_type` is required. The PATCH body is a
 * superset of what PATCH requires: the two generated components declare the
 * same three keys, and the create is the stricter of the pair about the one
 * the form cannot save without.
 */
export function parseEngineerEventType(values: EngineerEventTypeFormValues): EngineerEventTypeRequest {
  return v.parse(vEngineerEventTypeRequest, shaped(values))
}
