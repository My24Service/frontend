import { describe, expect, test } from 'vitest'

import {
  displayIsoDate,
  groupQuestions,
  inspectionStatusClass,
  inspectionStatusLabel,
  resultClass,
  resultLabel,
} from '@/features/checklist'

describe('displayIsoDate', () => {
  test('shows an ISO date as day-month-year', () => {
    expect(displayIsoDate('2026-11-27')).toBe('27-11-2026')
  })

  test('shows nothing for a missing date', () => {
    expect(displayIsoDate(null)).toBe('')
    expect(displayIsoDate(undefined)).toBe('')
  })

  test('shows nothing for a string that is not a date', () => {
    expect(displayIsoDate('not a date')).toBe('')
    expect(displayIsoDate('2026-13-45')).toBe('')
  })
})

describe('inspection status', () => {
  test('has a label and a badge for each of the five statuses', () => {
    const statuses = ['valid', 'expiring', 'expired', 'rejected', 'none']

    expect(statuses.map(inspectionStatusLabel)).toEqual(['Valid', 'Expiring', 'Expired', 'Not approved', 'No validity date'])
    expect(statuses.map(inspectionStatusClass)).toEqual([
      'badge text-bg-success',
      'badge text-bg-warning',
      'badge text-bg-danger',
      'badge text-bg-danger',
      'badge text-bg-secondary',
    ])
  })
})

describe('question result', () => {
  test('has a label and a badge for good, not approved and not applicable', () => {
    expect(['ok', 'nok', 'na'].map(resultLabel)).toEqual(['Good', 'Not approved', 'Not applicable'])
    expect(['ok', 'nok', 'na'].map(resultClass)).toEqual([
      'badge text-bg-success',
      'badge text-bg-danger',
      'badge text-bg-secondary',
    ])
  })

  // A text question, and a result question answered by an app that sends text only.
  test('has neither for an answer without a result', () => {
    expect(resultLabel(null)).toBe('')
    expect(resultLabel(undefined)).toBe('')
    expect(resultClass(null)).toBe('')
  })
})

describe('groupQuestions', () => {
  const q = (question, group_name) => ({question, answer: '', group_name})

  test('puts consecutive questions with the same group name under one heading', () => {
    const groups = groupQuestions([q('A', 'Door'), q('B', 'Door'), q('C', 'Lock'), q('D', 'Door')])

    expect(groups.map((group) => [group.name, group.questions.map((question) => question.question)])).toEqual([
      ['Door', ['A', 'B']],
      ['Lock', ['C']],
      ['Door', ['D']],
    ])
  })

  // Rows saved before groups existed carry only `question` and `answer`.
  test('puts questions without a group name in a group without a heading', () => {
    const groups = groupQuestions([{question: 'Old', answer: 'Yes'}, q('New', '')])

    expect(groups).toHaveLength(1)
    expect(groups[0].name).toBe('')
    expect(groups[0].questions).toHaveLength(2)
  })

  test('gives no groups for no questions', () => {
    expect(groupQuestions([])).toEqual([])
  })
})
