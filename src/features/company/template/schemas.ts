import { companyTemplate } from '@/api/resources.gen'
import type { Template } from '@/api/types.gen'
import { selectMessage, type FieldErrors, type FieldMessages } from '@/features/forms'
import type { FieldLabels } from '@/features/forms'
import { writeContract } from '@/features/forms'
import { $trans } from '@/services/i18n'

/**
 * The template form's own state. The file rides a staged data URL while one
 * is picked and stays null otherwise - the record's own file never enters
 * the values. The type only ever changes on a create; an edit keeps the
 * record's.
 */
export interface TemplateFormValues {
  name: string
  description: string | null
  template_type: string
  /** A newly picked `.docx` as a data URL, or null when no file was chosen. */
  file: string | null
  is_active: boolean
}

export type TemplateFormErrors = FieldErrors<keyof TemplateFormValues & string>

/** A template as the form is filled in from scratch. */
export function emptyTemplate(): TemplateFormValues {
  return { name: '', description: null, template_type: '', file: null, is_active: false }
}

/** The fetched record as form values: the five fields this form owns. */
export function templateFromRecord(record: Template): TemplateFormValues {
  return {
    name: record.name,
    description: record.description ?? null,
    template_type: record.template_type,
    file: null,
    is_active: record.is_active ?? false,
  }
}

export const FIELD_LABELS = {
  name: () => $trans('Name'),
  template_type: () => $trans('Type'),
} satisfies FieldLabels<keyof TemplateFormValues & string>

/** The file is chosen, not typed, and the values drop it when none was picked. */
export const FIELD_MESSAGES = {
  file: () => selectMessage($trans('File')),
} satisfies FieldMessages<keyof TemplateFormValues & string>

/**
 * The wire-shaped body: blank text rides as absent keys, not nulls or empty
 * strings, and the staged file rides only when one was picked. The active
 * flag always rides - it is a real boolean, and dropping a false one (as the
 * legacy model's falsy-stripping did) made deactivating a template silently
 * do nothing.
 */
function shaped(values: TemplateFormValues) {
  return {
    name: values.name,
    ...(values.description ? { description: values.description } : {}),
    ...(values.file ? { file: values.file } : {}),
    template_type: values.template_type,
    is_active: values.is_active,
  }
}

/**
 * Each direction validates the body it sends, as-is, and neither needs a rule
 * of this file's own:
 *
 * - a create reads the generated create body, where name, file and type are
 *   required exactly as the legacy form required them;
 * - an edit reads the patch body, where the name is optional but not blank,
 *   and the shaped body always carries it, so a blank one is refused anyway.
 */
export const templateWrite = writeContract(companyTemplate, {
  shape: shaped,
  labels: FIELD_LABELS,
  messages: FIELD_MESSAGES,
})
