

import {
  type FieldErrors,
  type FieldLabels,
  writeContract,
} from '@/features/forms'
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
export function pictureFromRecord(record: Api.Picture): PictureFormValues {
  return { name: record.name, picture: null }
}

export const FIELD_LABELS = {
  name: () => $trans('Name'),
} satisfies FieldLabels<keyof PictureFormValues & string>

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
 * Both writes validate against the create body: the form saves a whole
 * picture, and that is the component that says what a whole picture needs.
 * The patch body it sends is a superset of what PATCH requires, so nothing is
 * added on top of the generated schema.
 */
export const pictureWrite = writeContract(Api.CompanyPicture, {
  validateWith: Api.CompanyPicture.create.body,
  shape: shaped,
  labels: FIELD_LABELS,
})
