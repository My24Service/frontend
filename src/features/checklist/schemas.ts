import * as v from 'valibot'

import {
  fieldErrors,
  requiredMessages,
  writeContract,
  type FieldErrors,
  type FieldLabels,
} from '@/features/forms'
import { formDefaults } from '@/models/schema'

export function emptyChecklist(): Api.ChecklistChecklist.CreateInput {
  return formDefaults(Api.ChecklistChecklist.create.body)
}

/**
 * The checklist's own fields, plus `questions`: the staged questions are not
 * part of the checklist body, but one that cannot be sent stops the save.
 */
export type ChecklistFieldErrors =
  FieldErrors<keyof Api.ChecklistChecklist.CreateInput | 'questions'>

/** The stored checklist as form values: every field the form edits. */
export function checklistFromRecord(record: Api.Checklist): Api.ChecklistChecklist.CreateInput {
  return {
    name: record.name,
    norm: record.norm,
    validity_months: record.validity_months,
    archived: record.archived,
  }
}

export const FIELD_LABELS = {
  name: () => $trans('Name'),
  norm: () => $trans('Norm'),
  validity_months: () => $trans('Validity (months)'),
  archived: () => $trans('Archived'),
} as const satisfies FieldLabels<keyof Api.ChecklistChecklist.CreateInput>

/** The line under an untouched field: the same required line the validation shows. */
export const PLACEHOLDERS = requiredMessages(FIELD_LABELS)

/** What the form checks and sends: the whole checklist, on a create and an edit alike. */
export const checklistWrite = writeContract(Api.ChecklistChecklist, {
  validateWith: Api.ChecklistChecklist.create.body,
  labels: FIELD_LABELS,
})

/**
 * A question as the form stages it: its text, its heading, whether it asks
 * for a result (good / rejected / not applicable), the part it checks, and its
 * id once it is stored. A blank group or part means "none".
 */
export interface QuestionRow {
  id?: number
  question: string
  group_name: string
  answer_type: Api.AnswerTypeEnum
  part_name: string
}

/** A new question: the API's own defaults. */
export function emptyQuestion(): QuestionRow {
  return {question: '', group_name: '', answer_type: 'text', part_name: ''}
}

export function questionFromRecord(record: Api.ChecklistQuestion): QuestionRow {
  return {
    id: record.id,
    question: record.question,
    group_name: record.group_name ?? '',
    answer_type: record.answer_type ?? 'text',
    part_name: record.part_name ?? '',
  }
}

/**
 * The body of a new question: the checklist and the text, plus each other
 * field that differs from the API's default. A default is left out, so a
 * plain text question is sent as it was before groups and parts existed.
 */
export function questionCreateBody(row: QuestionRow, checklist: number): Api.ChecklistChecklistQuestion.CreateInput {
  const body: Api.ChecklistChecklistQuestion.CreateInput = {checklist, question: row.question}
  if (row.group_name !== '') body.group_name = row.group_name
  if (row.answer_type !== 'text') body.answer_type = row.answer_type
  if (row.part_name !== '') body.part_name = row.part_name
  return body
}

/**
 * The fields of a stored question that changed, or null when none did. Without
 * a stored copy every field is sent.
 */
export function questionUpdateBody(
  row: QuestionRow,
  stored: QuestionRow | undefined,
): Api.ChecklistChecklistQuestion.UpdateInput | null {
  const body: Api.ChecklistChecklistQuestion.UpdateInput = {}
  if (row.question !== stored?.question) body.question = row.question
  if (row.group_name !== stored?.group_name) body.group_name = row.group_name
  if (row.answer_type !== stored?.answer_type) body.answer_type = row.answer_type
  if (row.part_name !== stored?.part_name) body.part_name = row.part_name
  return Object.keys(body).length > 0 ? body : null
}

const QUESTION_LABELS = {
  question: () => $trans('Question'),
  group_name: () => $trans('Group'),
  part_name: () => $trans('Part'),
} as const satisfies FieldLabels<'question' | 'group_name' | 'part_name'>

// The question's own entries on the request body. The `checklist` entry is
// left out: a staged question has no checklist id until the checklist is
// saved. `answer_type` is left out too: the select offers only valid values.
const questionFields = v.pick(Api.ChecklistChecklistQuestion.create.body, ['question', 'group_name', 'part_name'])

/** Why a staged question cannot be sent, or nothing when it can. */
export function questionError(row: QuestionRow): string | undefined {
  const errors = fieldErrors(
    questionFields,
    {question: row.question, group_name: row.group_name, part_name: row.part_name},
    {},
    QUESTION_LABELS,
  )
  return errors.question ?? errors.group_name ?? errors.part_name
}
