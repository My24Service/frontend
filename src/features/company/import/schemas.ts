import * as v from 'valibot'

import { vImportRequest, vImportedRow, vPatchedImportRequest } from '@/api/valibot.gen'
import type { Import, ImportRequest, PatchedImportRequest } from '@/api/types.gen'
import { fieldErrors, type FieldErrors, type FieldMessages } from '@/features/forms/validation'
import type { WriteContext } from '@/features/forms/use-resource-form'
import { $trans } from '@/services/i18n'

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
export function importFromRecord(record: Import): ImportFormValues {
  return { name: record.name ?? '', file: null }
}

const MESSAGES = {
  name_required: () => $trans('Please enter a name'),
  file_required: () => $trans('Please select a file'),
} as const

export const FIELD_MESSAGES = {
  name: MESSAGES.name_required,
  file: MESSAGES.file_required,
} satisfies FieldMessages<keyof ImportFormValues & string>

/**
 * A preview row: the declared core (id, name, whether the run would insert
 * it) plus the per-kind report fields the tables render. The endpoint builds
 * the rows by hand and the schema names only the core, so the rest rides an
 * open record rather than a redeclared entry.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PreviewRow = v.InferOutput<typeof vImportedRow> & Record<string, any>

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
 * The edit parses the patch component, where the name is optional but not
 * blank; this form always sends it, so a blank one is refused either way.
 */
export function validateImport(values: ImportFormValues, context: WriteContext): ImportFormErrors {
  return fieldErrors(context.isCreate ? vImportRequest : vPatchedImportRequest, shaped(values), FIELD_MESSAGES)
}

/**
 * The bodies to send, as the generated request components resolve them. Two
 * functions rather than one switching on edit state: the generated create
 * and update mutations type their bodies exactly, and a union of the two
 * satisfies neither.
 */
export function parseImportCreate(values: ImportFormValues): ImportRequest {
  return v.parse(vImportRequest, shaped(values))
}

export function parseImportUpdate(values: ImportFormValues): PatchedImportRequest {
  return v.parse(vPatchedImportRequest, shaped(values))
}
