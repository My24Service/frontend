import * as v from 'valibot'

import { vPatchedTimeCorrectionRequest } from '@/api/valibot.gen'
import type { TimeRegistrationWorkhourRow } from '@/api/types.gen'
/**
 * The work-hours correction: what the planner types, and what rides.
 *
 * The endpoint declares a whole `PatchedTimeCorrectionRequest`, so the parse is
 * that component and the body is its output. The screen's own job is the one
 * field the schema cannot judge: the text is "minutes or hh:mm", signed, and the
 * wire wants a duration string.
 */

export interface Correction {
  /** What rides as `work_correction`: "2:30", or "-2:30" for a subtraction. */
  value: string
  /** What the screen prints under the input: "Add 2:30", "Subtract 2:30". */
  text: string
}

/**
 * Read "minutes or hh:mm" into a duration string, or `null` when there is
 * nothing to read.
 *
 * Minutes normalise into hours and minutes in both forms, where the legacy
 * parser only did it for the single-number form: "0:90" reached the endpoint as
 * "0:90", which Django's duration parser refuses. A bare "-" and an empty input
 * are how a planner clears the field, and both read as nothing.
 */
export function parseCorrection(input: string): Correction | null {
  const trimmed = input.trim()
  if (trimmed === '' || trimmed === '-') return null

  const negative = trimmed.startsWith('-')
  const parts = (negative ? trimmed.slice(1) : trimmed).split(':')
  if (parts.length > 2) return null

  let minutes: number
  if (parts.length === 1) {
    minutes = Number.parseInt(parts[0], 10)
  } else {
    const hours = Number.parseInt(parts[0] || '0', 10)
    const rest = Number.parseInt(parts[1] || '0', 10)
    minutes = Number.isNaN(hours) || Number.isNaN(rest) ? Number.NaN : hours * 60 + rest
  }
  if (Number.isNaN(minutes)) return null
  if (negative) minutes = -minutes

  const display = `${Math.floor(Math.abs(minutes) / 60)}:${String(Math.abs(minutes) % 60).padStart(2, '0')}`
  const verb = minutes < 0 ? $trans('Subtract') : $trans('Add')

  return {value: minutes < 0 ? `-${display}` : display, text: `${verb} ${display}`}
}

/**
 * The same reading, applied to a value the endpoint already stored, so two
 * spellings of one correction compare equal. Without it "00:00" and the "0:00"
 * the parser makes of it look like a change, and confirming an untouched modal
 * writes a correction.
 */
export function normaliseCorrection(stored: string | undefined | null): string {
  if (!stored) return ''
  return parseCorrection(stored)?.value ?? stored
}

/**
 * The body the correction PATCH sends. `work_correction_by_user` is omitted on a
 * list mount, where there is no user window to attribute the change to; the
 * request declares it optional, and a null would be rejected.
 */
export function correctionBody(
  entry: TimeRegistrationWorkhourRow,
  correction: Correction,
  userId: string | number | null | undefined,
) {
  const body: Record<string, unknown> = {
    source: entry.source,
    work_correction: correction.value,
    notify_engineer: false,
  }
  if (userId !== null && userId !== undefined && userId !== '') {
    body.work_correction_by_user = Number(userId)
  }
  return v.parse(vPatchedTimeCorrectionRequest, body)
}
