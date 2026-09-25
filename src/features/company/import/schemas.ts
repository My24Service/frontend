import * as v from 'valibot'

import {
  selectMessage,
  type FieldErrors,
  type FieldMessages,
  type FieldLabels,
  writeContract,
} from '@/features/forms'
/**
 * The import form's own state. The file rides a staged data URL while one is
 * picked and stays null otherwise - the record's own file (a URL the write
 * endpoint rejects) never enters the values. The mapping, filter and result
 * columns are the wizard's state, not this form's: the parse leaves them out
 * and absent keys leave the stored values unchanged.
 */
export interface ImportFormValues {
  name: string
  /** A newly picked file as a data URL, or null when no file was chosen. */
  file: string | null
}

export type ImportFormErrors = FieldErrors<keyof ImportFormValues & string>

/** An import as the form is filled in from scratch. */
export function emptyImport(): ImportFormValues {
  return { name: '', file: null }
}

/** The fetched record as form values: the name this form owns. */
export function importFromRecord(record: Api.Import): ImportFormValues {
  return { name: record.name ?? '', file: null }
}

export const FIELD_LABELS = {
  name: () => $trans('Name'),
} satisfies FieldLabels<keyof ImportFormValues & string>

/** The file is chosen, not typed, and the values drop it when none was picked. */
export const FIELD_MESSAGES = {
  file: () => selectMessage($trans('File')),
} satisfies FieldMessages<keyof ImportFormValues & string>

/**
 * A preview row: the declared core (id, name, whether the run would insert
 * it) plus the per-kind report fields the tables render. The endpoint builds
 * the rows by hand and the schema names only the core, so the rest rides an
 * open record rather than a redeclared entry.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PreviewRow = v.InferOutput<typeof schemas.vImportedRow> & Record<string, any>

/**
 * The wire-shaped body: the name trimmed as the API trims it before its
 * blank check, and the staged file only when one was picked. The legacy
 * edit dropped a file that read back as a URL; an absent PATCH key is what
 * leaves the stored file unchanged.
 */
function shaped(values: ImportFormValues) {
  return { name: values.name.trim(), ...(values.file ? { file: values.file } : {}) }
}

/**
 * Validation follows the context: the edit reads the patch component, where
 * the name is optional but not blank, and this form always sends it, so a
 * blank one is refused either way.
 */
export const importWrite = writeContract(Api.CompanyImport, {
  shape: shaped,
  labels: FIELD_LABELS,
  messages: FIELD_MESSAGES,
})
