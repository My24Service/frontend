import * as v from 'valibot'

import { vPatchedTemplateRequest, vTemplateRequest } from '@/api/valibot.gen'
import type { PatchedTemplateRequest, Template, TemplateRequest } from '@/api/types.gen'
import { fieldErrors, type FieldErrors, type FieldMessages } from '@/features/forms/validation'
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

const MESSAGES = {
  name_required: () => $trans('Please enter a template name'),
  file_required: () => $trans('Please select a file'),
  template_type_required: () => $trans('Please select a template type'),
} as const

export const FIELD_MESSAGES = {
  name: MESSAGES.name_required,
  file: MESSAGES.file_required,
  template_type: MESSAGES.template_type_required,
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
 * A create validates the generated create body as-is: name, file and type
 * are required there, exactly as the legacy form required them. No rule of
 * this file's own.
 */
export function validateTemplateCreate(values: TemplateFormValues): TemplateFormErrors {
  return fieldErrors(vTemplateRequest, shaped(values), FIELD_MESSAGES)
}

/**
 * An edit validates the patch body with the name lifted to required. PATCH
 * accepts a partial body, so the generated optionality is correct and stays;
 * this form never submits a partial body, so it refuses what the endpoint
 * would accept. A cross-field rule about *this form's* write, not the
 * resource - the same family as the branch and picture forms' required patch
 * fields.
 *
 * Slice-ledger case 2 (docs/schema-strengthenings.md) - the API must stay
 * lax about it, because partial PATCH is its contract.
 */
const templateEditSchema = v.required(vPatchedTemplateRequest, ['name'])

export function validateTemplateEdit(values: TemplateFormValues): TemplateFormErrors {
  return fieldErrors(templateEditSchema, shaped(values), FIELD_MESSAGES)
}

/**
 * The bodies to send, as the generated request components resolve them. Two
 * functions rather than one switching on edit state: the generated create
 * and update mutations type their bodies exactly, and a union of the two
 * satisfies neither.
 */
export function parseTemplateCreate(values: TemplateFormValues): TemplateRequest {
  return v.parse(vTemplateRequest, shaped(values))
}

export function parseTemplateUpdate(values: TemplateFormValues): PatchedTemplateRequest {
  return v.parse(vPatchedTemplateRequest, shaped(values))
}
