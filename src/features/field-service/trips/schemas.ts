import * as v from 'valibot'
import moment from 'moment'

import { vTripRequest } from '@/api/valibot.gen'
import type { Trip } from '@/api/types.gen'
import { toApiDate } from '@/features/forms'
import { completeTime } from '@/features/forms'
import {
  fieldErrors,
  requiredMessage,
  type FieldErrors,
  type FieldMessages,
} from '@/features/forms'
import type { FieldLabels } from '@/features/forms'
import { $trans } from '@/services/i18n'

/**
 * A staged order row: the one key the write body carries, plus the fields the
 * table above the picker shows. `vTripRequest` declares `order` alone, so the
 * parse strips the rest again.
 *
 * `order` is optional only while the row is the staging slot (`rowEdit` with
 * nothing picked yet): `addOrder` refuses to push such a row, so every row in
 * the staged set carries one.
 */
export interface TripOrderFormRow {
  order?: number
  name?: string | null
  address?: string | null
  city?: string | null
  date?: string | null
}

/** A fresh staging slot: nothing picked yet, and never pushed as-is (see `addOrder`). */
export function emptyTripOrderRow(): TripOrderFormRow {
  return {}
}

/** The record's rows as staged rows: the `order` the body keeps plus the display fields. */
export function tripOrderRowsFromRecord(record: Trip): TripOrderFormRow[] {
  return record.trip_orders.map((row) => ({
    order: row.order,
    name: row.name,
    address: row.address,
    city: row.city,
    date: row.date,
  }))
}

/**
 * What the form binds to.
 *
 * Everything but the differences named here is the generated request component:
 * the maxima, the two-character country codes and the iso formats stay in play
 * because the entries below are the generated ones. The differences are the
 * form's own state rather than the wire's - a picker holds a `Date`, a checkbox a
 * `boolean`, the headcount a text input's string, and a staged row carries the
 * fields the table shows beside the `order` the body keeps.
 */
export type TripFormValues = Omit<
  v.InferInput<typeof vTripRequest>,
  | 'start_date'
  | 'end_date'
  | 'required_users'
  | 'trip_orders'
  | 'start_location_from_first_order'
  | 'start_datetime_from_first_order'
  | 'end_location_from_last_order'
  | 'end_datetime_from_last_order'
> & {
  start_location_from_first_order: boolean
  start_datetime_from_first_order: boolean
  end_location_from_last_order: boolean
  end_datetime_from_last_order: boolean
  /** The date picker's own value; the parse formats it for the wire. */
  start_date: Date | null
  end_date: Date | null
  /** The text input's value; the parse writes the number the API asks for. */
  required_users: string
  trip_orders: TripOrderFormRow[]
}

export type TripFieldErrors = FieldErrors<keyof TripFormValues & string>

/**
 * Which of the four conditional blocks the form is asking for.
 *
 * A block is skipped when its "from the first/last job" box is ticked, and that
 * is the only thing that decides whether its fields are required - the legacy
 * Vuelidate rules asked for the start's date, time and location when the start
 * is not taken from the first job, and for the end's when it is not taken from
 * the last one. The country codes were asked for with the location they belong
 * to, and `required_users` always.
 */
export interface TripConditions {
  startLocationFromFirstOrder: boolean
  startDatetimeFromFirstOrder: boolean
  endLocationFromLastOrder: boolean
  endDatetimeFromLastOrder: boolean
}

export function conditionsOf(values: TripFormValues): TripConditions {
  return {
    startLocationFromFirstOrder: values.start_location_from_first_order,
    startDatetimeFromFirstOrder: values.start_datetime_from_first_order,
    endLocationFromLastOrder: values.end_location_from_last_order,
    endDatetimeFromLastOrder: values.end_datetime_from_last_order,
  }
}

/** A trip as the form is filled in from scratch: the legacy model's defaults. */
export function emptyTrip(): TripFormValues {
  return {
    description: '',
    required_users: '',
    start_location_from_first_order: false,
    start_datetime_from_first_order: false,
    start_name: '',
    start_address: '',
    start_postal: '',
    start_city: '',
    start_country_code: 'NL',
    end_location_from_last_order: true,
    end_datetime_from_last_order: true,
    end_name: '',
    end_address: '',
    end_postal: '',
    end_city: '',
    end_country_code: 'NL',
    start_date: null,
    start_time: null,
    end_date: null,
    end_time: null,
    trip_orders: [],
  }
}

/** The record's `isoDate` as the Date the picker holds - the legacy's own parse. */
function dateOf(iso: string | null | undefined): Date | null {
  return iso ? moment(iso, 'YYYY-MM-DD').toDate() : null
}

export function tripFromRecord(record: Trip): TripFormValues {
  return {
    ...emptyTrip(),
    description: record.description ?? '',
    required_users: record.required_users == null ? '' : String(record.required_users),
    start_location_from_first_order: record.start_location_from_first_order ?? false,
    start_datetime_from_first_order: record.start_datetime_from_first_order ?? false,
    start_name: record.start_name ?? '',
    start_address: record.start_address ?? '',
    start_postal: record.start_postal ?? '',
    start_city: record.start_city ?? '',
    start_country_code: record.start_country_code ?? 'NL',
    end_location_from_last_order: record.end_location_from_last_order ?? false,
    end_datetime_from_last_order: record.end_datetime_from_last_order ?? false,
    end_name: record.end_name ?? '',
    end_address: record.end_address ?? '',
    end_postal: record.end_postal ?? '',
    end_city: record.end_city ?? '',
    end_country_code: record.end_country_code ?? 'NL',
    start_date: dateOf(record.start_date),
    start_time: record.start_time ?? null,
    end_date: dateOf(record.end_date),
    end_time: record.end_time ?? null,
    trip_orders: tripOrderRowsFromRecord(record),
  }
}

export const FIELD_LABELS = {
  start_date: () => $trans('Start date'),
  start_time: () => $trans('Start time'),
  start_name: () => $trans('Location'),
  start_address: () => $trans('Address'),
  start_postal: () => $trans('Postal'),
  start_city: () => $trans('City'),
  start_country_code: () => $trans('Country'),
  end_date: () => $trans('End date'),
  end_time: () => $trans('End time'),
  end_name: () => $trans('Location'),
  end_address: () => $trans('Address'),
  end_postal: () => $trans('Postal'),
  end_city: () => $trans('City'),
  end_country_code: () => $trans('Country'),
  required_users: () => $trans('Required users'),
} satisfies FieldLabels<keyof TripFormValues & string>

/**
 * The copy a rule alone cannot say.
 *
 * A headcount: the legacy's "Please enter required users" for an empty one, and
 * a line of its own for text that is not a number at all.
 *
 * The two dates: an empty picker reaches the schema as `''`, so the rule cannot
 * tell "not picked" from "typed wrong" and every failure under them is the
 * field's required line - the legacy's own copy.
 */
export const FIELD_MESSAGES = {
  required_users: (issue) => (issue?.type === 'regex'
    ? $trans('Please enter a whole number')
    : requiredMessage(FIELD_LABELS.required_users())),
  start_date: () => requiredMessage(FIELD_LABELS.start_date()),
  end_date: () => requiredMessage(FIELD_LABELS.end_date()),
} satisfies FieldMessages<keyof TripFormValues & string>

/**
 * `vTripRequest`'s entry as it is, or with a value demanded.
 *
 * `v.unwrap` keeps everything codegen put underneath - the maxima, the two
 * character country code - and adds the one rule the entry cannot express: a
 * field the form asks for must hold something. The legacy rule was Vuelidate's
 * `required`, which refuses `''` as well as null.
 */
function asked<E extends v.NullishSchema<v.GenericSchema<string>, undefined>>(entry: E, required: boolean) {
  return required ? v.pipe(v.unwrap(entry), v.minLength(1)) : entry
}

/**
 * The picker's value as the `isoDate` the wire takes.
 *
 * The format comes from the Date's **local** getters (`toApiDate`): `toISOString()`
 * reports the previous day for an evening pick east of UTC, the trap the
 * equipment form's ledger records.
 */
function pickerDate(entry: typeof vTripRequest.entries.start_date, required: boolean) {
  // The two cases spell their own transform: a demanded date reaches the rule
  // as `''` so that it fails there, an optional one as `undefined` so that the
  // key is absent from the body - which is what the legacy's delete did.
  return required
    ? v.pipe(
        v.nullable(v.date()),
        v.transform((value) => (value === null ? '' : toApiDate(value))),
        v.unwrap(entry),
      )
    : v.pipe(
        v.nullable(v.date()),
        v.transform((value) => (value === null ? undefined : toApiDate(value))),
        v.optional(v.unwrap(entry)),
      )
}

/**
 * A time as the field takes it: `HH:mm`, or `HH:mm:ss` when it is already
 * complete. Blank is absent from the body, as the legacy deleted the key.
 */
function inputTime(entry: typeof vTripRequest.entries.start_time, required: boolean) {
  const complete = (value: string | null | undefined) => {
    if (value == null || value === '') return ''
    return completeTime(value)
  }

  return required
    ? v.pipe(
        v.optional(v.nullable(v.string())),
        v.transform(complete),
        v.unwrap(entry),
      )
    : v.pipe(
        v.optional(v.nullable(v.string())),
        v.transform((value) => complete(value) || undefined),
        v.optional(v.unwrap(entry)),
      )
}

/**
 * `required_users` as the form holds it: the text input's string, never blank.
 *
 * The generated entry is an int64 union, which is unusable for a text input
 * twice over: it accepts any string and then runs `BigInt('abc')` inside its
 * transform - and a thrown transform escapes `safeParse`, so a typo would crash
 * the submit instead of messaging the field - while the `bigint` it produces
 * cannot be JSON-encoded onto the wire at all. The text is therefore what the
 * form validates, and the parse writes the number the entry declares.
 */
const requiredUsers = v.pipe(
  v.string(),
  v.trim(),
  v.nonEmpty(),
  v.regex(/^\d+$/),
  v.transform(Number),
)

/**
 * The body for one write, built from the generated request entries.
 *
 * Every entry but the four named above is `vTripRequest`'s own, so the parse
 * output is the request the API declares and nothing else: the read-only
 * companions the record carries (`id`, `last_status`, `trip_date`, the counts)
 * die here rather than riding the wire, which is what the legacy sent them on.
 */
export function tripSchema({
  startLocationFromFirstOrder,
  startDatetimeFromFirstOrder,
  endLocationFromLastOrder,
  endDatetimeFromLastOrder,
}: TripConditions) {
  return v.object({
    ...vTripRequest.entries,
    required_users: requiredUsers,
    start_date: pickerDate(vTripRequest.entries.start_date, !startDatetimeFromFirstOrder),
    start_time: inputTime(vTripRequest.entries.start_time, !startDatetimeFromFirstOrder),
    start_name: asked(vTripRequest.entries.start_name, !startLocationFromFirstOrder),
    start_address: asked(vTripRequest.entries.start_address, !startLocationFromFirstOrder),
    start_postal: asked(vTripRequest.entries.start_postal, !startLocationFromFirstOrder),
    start_city: asked(vTripRequest.entries.start_city, !startLocationFromFirstOrder),
    start_country_code: asked(vTripRequest.entries.start_country_code, !startLocationFromFirstOrder),
    end_date: pickerDate(vTripRequest.entries.end_date, !endDatetimeFromLastOrder),
    end_time: inputTime(vTripRequest.entries.end_time, !endDatetimeFromLastOrder),
    end_name: asked(vTripRequest.entries.end_name, !endLocationFromLastOrder),
    end_address: asked(vTripRequest.entries.end_address, !endLocationFromLastOrder),
    end_postal: asked(vTripRequest.entries.end_postal, !endLocationFromLastOrder),
    end_city: asked(vTripRequest.entries.end_city, !endLocationFromLastOrder),
    end_country_code: asked(vTripRequest.entries.end_country_code, !endLocationFromLastOrder),
  })
}

/** What goes on the wire: the schema's own output. */
export type TripBody = v.InferOutput<ReturnType<typeof tripSchema>>

export function validateTripForm(values: TripFormValues, conditions: TripConditions): TripFieldErrors {
  return fieldErrors(tripSchema(conditions), values, FIELD_MESSAGES, FIELD_LABELS)
}

export function parseTripBody(values: TripFormValues, conditions: TripConditions): TripBody {
  return v.parse(tripSchema(conditions), values)
}
