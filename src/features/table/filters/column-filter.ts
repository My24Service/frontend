import type { Column, RowData, VueTable } from '@tanstack/vue-table'
import type { AppFeatures, ColumnFilterSpec } from '../table'
import {
  describeDateFilter,
  describeNumberFilter,
  parseDateFilter,
  parseNumberFilter,
  splitArrayItems,
} from './filter-grammar'

/** One column the filter bar offers, read off the table once per render. */
export interface FilterableColumn {
  id: string
  /** The `columnFilters` entry and query parameter it filters under: the column id, unless the spec names another. */
  param: string
  label: string
  spec: ColumnFilterSpec
}

function labelOf<TData extends RowData>(column: Column<AppFeatures, TData, unknown>, spec: ColumnFilterSpec): string {
  if (spec.label) return spec.label
  const header = column.columnDef.header
  return typeof header === 'string' && header !== '' ? header : column.id
}

/** The columns the bar can filter, in table order. */
export function filterableColumns<TData extends RowData>(table: VueTable<AppFeatures, TData>): FilterableColumn[] {
  const columns: FilterableColumn[] = []
  for (const column of table.getAllLeafColumns()) {
    const spec = column.columnDef.meta?.filter
    if (!spec || !column.getCanFilter()) continue
    const param = spec.variant === 'select' && spec.param ? spec.param : column.id
    columns.push({id: column.id, param, label: labelOf(column, spec), spec})
  }
  return columns
}

/**
 * The chip's words for a wire value; the raw value when it does not parse.
 * `labels` are the select labels learned since the spec was built — from the
 * editor's list or `resolveLabels` — on top of the spec's own `options`.
 */
export function describeFilterValue(spec: ColumnFilterSpec, value: string, labels?: ReadonlyMap<string, string>): string {
  switch (spec.variant) {
    case 'number': {
      const parsed = parseNumberFilter(value)
      return parsed ? describeNumberFilter(parsed) : value
    }
    case 'date': {
      const parsed = parseDateFilter(value)
      return parsed ? describeDateFilter(parsed) : value
    }
    case 'select': {
      const known = new Map((spec.options ?? []).map((option) => [option.value, option.label]))
      return splitArrayItems(value).map((item) => labels?.get(item) ?? known.get(item) ?? item).join(', ')
    }
    default:
      return value
  }
}
