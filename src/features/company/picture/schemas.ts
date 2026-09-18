import * as v from 'valibot'

import { vPatchedPictureRequest, vPictureRequest } from '@/api/valibot.gen'
import type { Picture } from '@/api/types.gen'
import {
  fieldErrors,
  requiredOrMaxLength,
  type FieldErrors,
  type FieldMessages,
} from '@/features/forms/validation'
import type { WriteContext } from '@/features/forms/use-resource-form'
import { $trans } from '@/services/i18n'

/**
 * The form's own state. The generated request carries `picture` as an optional
 * base64 string and `name` as required; the form holds the staged upload as
 * `string | null` - null while no file was picked - so "no new file" is a
 * state rather than an absent key the parse has to guess at.
 */
export interface PictureFormValues {
  name: string
  /** A newly picked file as a data URL, or null when no file was chosen. */
  picture: string | null
}

export type PictureFieldErrors = FieldErrors<keyof PictureFormValues & string>

/** A picture as the form is filled in from scratch. */
export function emptyPicture(): PictureFormValues {
  return { name: '', picture: null }
}

/**
 * The fetched record as form values: the name this form owns. The record's
 * own `picture` is a URL the write endpoint cannot take back (see `shaped`),
 * so it never enters the values - the screen reads it off the query's record
 * to show the current image.
 */
export function pictureFromRecord(record: Picture): PictureFormValues {
  return { name: record.name, picture: null }
}

// The generated `name` entry already carries minLength(1) and maxLength(255);
// nothing here redeclares it. The copy is all this file adds, and it is a leaf
// function rather than a nested object: `fieldErrors` walks the message tree by
// the issue's own path, so a shape keyed by rule name would only ever match a
// field literally called `min_length`.
const MESSAGES = {
  name_required: () => $trans('Please enter a name'),
  name_max_length: () => $trans('Please use at most 255 characters'),
} as const

export const FIELD_MESSAGES = {
  name: requiredOrMaxLength(MESSAGES.name_required, MESSAGES.name_max_length),
} satisfies FieldMessages<keyof PictureFormValues & string>

/**
 * The wire-shaped body: the staged upload rides only when a file was picked.
 *
 * Two legacy defects die here. The old form listened for `@input` on a file
 * input that emits `change`, so picking a file never registered and a create
 * always posted `picture: null`. And an edit sent the whole record back, whose
 * `picture` is the response URL - which `Base64ImageField` rejects, so renaming
 * a picture without picking a new file answered 400. An absent PATCH key leaves
 * the stored file unchanged, which is what an untouched image always meant.
 */
function shaped(values: PictureFormValues) {
  return { name: values.name, ...(values.picture ? { picture: values.picture } : {}) }
}

/**
 * Both writes validate against the create body.
 *
 * The generated patch body leaves `name` optional because PATCH accepts a
 * partial body - correctly, and it stays that way. This form never submits a
 * partial body, it saves a whole picture, so it refuses what the endpoint
 * would accept. A cross-field rule about *this form's* write, not the
 * resource - the same family as the customer form's required patch fields.
 *
 * Slice-ledger case 2 (docs/schema-strengthenings.md) - the API must stay lax
 * about it, because partial PATCH is its contract.
 */
export function validatePicture(values: PictureFormValues): PictureFieldErrors {
  return fieldErrors(vPictureRequest, shaped(values), FIELD_MESSAGES)
}

/**
 * The body to send, as the generated request component resolves it: the
 * create parses the create body, the edit the patch body, both stripped to
 * the keys they declare.
 */
export function parsePicture(values: PictureFormValues, context: WriteContext) {
  const body = shaped(values)
  if (!context.isCreate) return v.parse(vPatchedPictureRequest, body)
  return v.parse(vPictureRequest, body)
}
