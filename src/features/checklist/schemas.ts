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

export const FIELD_LABELS = {
  name: () => $trans('Name'),
} as const satisfies FieldLabels<keyof Api.ChecklistChecklist.CreateInput>

/** The line under an untouched field: the same required line the validation shows. */
export const PLACEHOLDERS = requiredMessages(FIELD_LABELS)

/** What the form checks and sends: the whole checklist, on a create and an edit alike. */
export const checklistWrite = writeContract(Api.ChecklistChecklist, {
  validateWith: Api.ChecklistChecklist.create.body,
  labels: FIELD_LABELS,
})

/** A question as the form stages it: its text, and its id once it is stored. */
export interface QuestionRow {
  id?: number
  question: string
}

export function questionFromRecord(record: Api.ChecklistQuestion): QuestionRow {
  return {id: record.id, question: record.question}
}

const QUESTION_LABELS = {
  question: () => $trans('Question'),
} as const satisfies FieldLabels<'question'>

// The question's own entry on the request body. The `checklist` entry is left
// out: a staged question has no checklist id until the checklist is saved.
const questionText = v.pick(Api.ChecklistChecklistQuestion.create.body, ['question'])

/** Why a staged question cannot be sent, or nothing when it can. */
export function questionError(row: QuestionRow): string | undefined {
  return fieldErrors(questionText, {question: row.question}, {}, QUESTION_LABELS).question
}
