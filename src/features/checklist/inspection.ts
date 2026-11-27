import { format, isValid, parseISO } from 'date-fns'

/**
 * How a finished checklist and an equipment's inspection read on screen: the
 * labels and badge classes of the result of a question and of the inspection
 * status, the date format, and the group headings of a filled-in checklist.
 *
 * Pure functions, shared by the order panel and the equipment screens, so the
 * two never name the same state differently.
 */

/** An ISO date (`2026-11-27`) as the app shows dates (`27-11-2026`), or nothing for a missing or invalid one. */
export function displayIsoDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = parseISO(iso)
  return isValid(date) ? format(date, 'dd-MM-yyyy') : ''
}

/**
 * The status of an inspection as a label. `none` has two meanings: an
 * equipment that was never inspected (no date), and an inspection without a
 * validity date.
 */
export function inspectionStatusLabel(
  inspection: {status: Api.EquipmentInspectionStatusEnum, date?: string | null},
): string {
  switch (inspection.status) {
    case 'valid': return $trans('Valid')
    case 'expiring': return $trans('Expiring')
    case 'expired': return $trans('Expired')
    case 'rejected': return $trans('Not approved')
    case 'none': return inspection.date ? $trans('No validity date') : $trans('Not inspected')
  }
}

export function inspectionStatusClass(status: Api.EquipmentInspectionStatusEnum): string {
  switch (status) {
    case 'valid': return 'badge text-bg-success'
    case 'expiring': return 'badge text-bg-warning'
    case 'expired': return 'badge text-bg-danger'
    case 'rejected': return 'badge text-bg-danger'
    case 'none': return 'badge text-bg-secondary'
  }
}

/** The result of a question, or nothing for a text question and for an answer from an old app. */
export function resultLabel(result: Api.ResultEnum | null | undefined): string {
  switch (result) {
    case 'ok': return $trans('Good')
    case 'nok': return $trans('Not approved')
    case 'na': return $trans('Not applicable')
    default: return ''
  }
}

export function resultClass(result: Api.ResultEnum | null | undefined): string {
  switch (result) {
    case 'ok': return 'badge text-bg-success'
    case 'nok': return 'badge text-bg-danger'
    case 'na': return 'badge text-bg-secondary'
    default: return ''
  }
}

export interface QuestionGroup {
  /** The heading, or '' for questions without a group. */
  name: string
  questions: Api.ChecklistDataQuestion[]
}

/**
 * The questions under their headings. Consecutive questions with the same
 * group name form one group; the same name further down starts a new one.
 */
export function groupQuestions(questions: Api.ChecklistDataQuestion[]): QuestionGroup[] {
  const groups: QuestionGroup[] = []
  for (const question of questions) {
    const name = question.group_name ?? ''
    const last = groups.at(-1)
    if (last && last.name === name) last.questions.push(question)
    else groups.push({name, questions: [question]})
  }
  return groups
}
