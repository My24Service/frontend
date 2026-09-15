import { h } from 'vue'

import { $trans } from '@/services/i18n'

export interface HeadcountRow {
  assigned_count: number
  required_assigned: string
  required_users?: number
}

/**
 * The list's people column on a temps tenant: a headcount against what
 * the order needs ("Assigned to 3 / 5 people"), not the assignees' names
 * — a temps order is filled by whoever is available, and the names are
 * the dispatch screen's business.
 */
export function tempsAssigneesCell(row: HeadcountRow) {
  if (!row.assigned_count) return h('span', {title: $trans('Not assigned to anyone')}, '–')

  const required = row.required_users ? ` / ${row.required_users}` : ''
  const people = row.assigned_count > 1 ? `${required} ${$trans('people')}` : ` ${$trans('person')}`
  return h(
    'span',
    {title: `assignees: ${row.required_assigned}`},
    `${$trans('Assigned to')} ${row.assigned_count}${people}`,
  )
}
