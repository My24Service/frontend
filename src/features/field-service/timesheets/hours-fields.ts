import moment from 'moment/min/moment-with-locales'

import { $trans } from '@/services/i18n'

/**
 * The vocabulary the two Timesheet screens share.
 *
 * `UserHoursData` and `UserHoursDataDetail` each carried a byte-identical
 * `translateHoursField` map and a byte-identical `displayDurationFromSeconds`.
 * A day field's label and a number of seconds read as a duration are one idea
 * each - the two screens are two views of one payload - so they live here
 * rather than twice beside the screens that render them.
 */

/**
 * The label a day field is rendered under, for the fields the API names.
 *
 * A field the API adds later falls back to its own name, so the pivot still
 * renders that row rather than one with its label missing.
 */
const HOURS_FIELD_LABELS: Record<string, () => string> = {
  work_total: () => $trans('Work total'),
  break_total: () => $trans('Breaks total'),
  travel_total: () => $trans('Travel total'),
  distance_total: () => $trans('Distance total'),
  extra_work: () => $trans('Total extra work'),
  actual_work: () => $trans('Total actual work'),
  unforeseen_work: () => $trans('Total unforeseen work'),
  distance_fixed_rate_amount: () => $trans('Total trips'),
}

export function translateHoursField(field: string): string {
  // Lazy per label, not a map built at module scope: `$trans` reads the
  // page's Django catalogue (`window.django`), which `src/main.ts` loads
  // after the module graph has been evaluated - a map of translated strings
  // built at import time would bake in the untranslated English for the life
  // of the page. Every label is written out as its own `$trans('...')`
  // literal because the catalogue is built by scanning this source for them;
  // a label derived from the key never enters it.
  return HOURS_FIELD_LABELS[field]?.() ?? field
}

/**
 * A number of seconds as `H:mm`, or `H:mm:ss` when the seconds matter.
 *
 * The hours are whole hours and the minutes come from the same instant read as
 * a UTC time, so 3661 seconds is `1:01` with `excludeSeconds` - the seconds
 * are dropped, not rounded up.
 */
export function displayDurationFromSeconds(seconds: number, excludeSeconds: boolean): string {
  const totalMilliseconds = seconds * 1000
  const hours = parseInt(String(moment.duration(totalMilliseconds).asHours()))
  const format = excludeSeconds ? 'mm' : 'mm:ss'
  return `${hours}:${moment.utc(totalMilliseconds).format(format)}`
}
