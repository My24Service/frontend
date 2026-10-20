import {
  inventoryMaterialTotalSalesPerCustomerRetrieveOptions,
  inventoryMaterialTotalSalesPerMaterialCustomerRetrieveOptions,
  inventoryMaterialTotalSalesPerSupplierPerMaterialRetrieveOptions,
  inventoryMaterialTotalSalesPerSupplierRetrieveOptions,
  inventoryMaterialTotalSalesRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { QueryOptionsLike } from '@/features/forms'

/** The numbers a bar can show. */
export type GraphField = 'sum_amount' | 'sum_price_selling' | 'profit'

/** The row each mode's read answers with. */
interface SalesRows {
  'total-material-sales': Api.MaterialTotalSalesRow
  'total-sales-per-supplier': Api.SupplierTotalSalesRow
  'total-material-sales-per-customer': Api.CustomerTotalSalesRow
  'total-sales-per-material-customer': Api.CustomerMaterialTotalSalesRow
  'total-sales-per-material-supplier': Api.SupplierMaterialTotalSalesRow
}

export type SalesMode = keyof SalesRows

/** A row of any of the five total-sales answers. */
export type SalesRow = SalesRows[SalesMode]

/** What a total-sales row can be named by, one column each. */
type NameKey = 'material_name' | 'supplier_name' | 'customer_name'

/**
 * One way of breaking sales down. The generated `*Options` are used directly:
 * the five reads have no binding on a resource (they hang under
 * `InventoryMaterial.reads` only).
 */
interface ModeSpec<Row> {
  /** What the mode is called in the picker. */
  label: () => string
  /** What a row is named by, in the order the table and a bar show them. */
  names: readonly (NameKey & keyof Row)[]
  /** The chart's legend: what one bar is a total of. Holds the year as `%(year)s`. */
  legend: () => string
  /**
   * The mode's read for a year. Only its key is named: the five generated
   * reads differ in everything else, and `useQueryOf` switches between them.
   */
  options: (year: number) => Pick<QueryOptionsLike, 'queryKey'>
}

/**
 * The five ways the inventory stats screen breaks sales down. Everything the
 * screen knows about a mode is read off its row here.
 */
const SALES_MODES = {
  'total-material-sales': {
    label: () => $trans('Total material sales'),
    names: ['material_name'],
    legend: () => $trans('Total sales in %(year)s'),
    options: (year) => inventoryMaterialTotalSalesRetrieveOptions({query: {year}}),
  },
  'total-sales-per-supplier': {
    label: () => $trans('Total sales per supplier'),
    names: ['supplier_name'],
    legend: () => $trans('Total sales per supplier in %(year)s'),
    options: (year) => inventoryMaterialTotalSalesPerSupplierRetrieveOptions({query: {year}}),
  },
  'total-material-sales-per-customer': {
    label: () => $trans('Total material sales per customer'),
    names: ['customer_name'],
    legend: () => $trans('Total sales per customer in %(year)s'),
    options: (year) => inventoryMaterialTotalSalesPerCustomerRetrieveOptions({query: {year}}),
  },
  'total-sales-per-material-customer': {
    label: () => $trans('Total sales per material per customer'),
    names: ['customer_name', 'material_name'],
    legend: () => $trans('Total sales per customer per material in %(year)s'),
    options: (year) => inventoryMaterialTotalSalesPerMaterialCustomerRetrieveOptions({query: {year}}),
  },
  'total-sales-per-material-supplier': {
    label: () => $trans('Total sales per material per supplier'),
    names: ['supplier_name', 'material_name'],
    legend: () => $trans('Total sales per supplier per material in %(year)s'),
    options: (year) => inventoryMaterialTotalSalesPerSupplierPerMaterialRetrieveOptions({query: {year}}),
  },
} as const satisfies {[M in SalesMode]: ModeSpec<SalesRows[M]>}

/** A mode's read for a year, answering `{result: SalesRow[]}` whatever the mode. */
export function salesOptions(mode: SalesMode, year: number): Pick<QueryOptionsLike, 'queryKey'> {
  return SALES_MODES[mode].options(year)
}

/** The picker's options, in the table's order. The table's keys are exactly the modes. */
export function modeOptions(): {value: SalesMode, text: string}[] {
  return (Object.keys(SALES_MODES) as SalesMode[]).map((value) => ({value, text: SALES_MODES[value].label()}))
}

export function graphFieldOptions() {
  return [
    {item: 'sum_amount', name: $trans('Amount')},
    {item: 'sum_price_selling', name: $trans('Selling price')},
    {item: 'profit', name: $trans('Profit')},
  ]
}

export interface SalesColumn {
  key: string
  label: string
  sortable: boolean
}

const NAME_LABELS = {
  material_name: () => $trans('Material'),
  supplier_name: () => $trans('Supplier'),
  customer_name: () => $trans('Customer'),
} as const satisfies Record<NameKey, () => string>

const column = (key: string, label: string): SalesColumn => ({key, label, sortable: true})

/** A mode's table: its names, then the four numbers every mode ends with. */
export function columnsFor(mode: SalesMode): SalesColumn[] {
  return [
    ...SALES_MODES[mode].names.map((key) => column(key, NAME_LABELS[key]())),
    column('sum_amount', $trans('Total amount')),
    column('sum_price_selling', $trans('Total selling')),
    column('sum_price_purchase', $trans('Total purchase')),
    column('profit', $trans('Profit')),
  ]
}

/** The legend of the chart: what one bar is a total of, and for which year. */
export function datasetLabelFor(mode: SalesMode, year: number): string {
  return interpolate(SALES_MODES[mode].legend(), {year})
}

function shortened(text: string): string {
  return text.length > 15 ? `${text.slice(0, 14)}...` : text
}

/**
 * What a bar is called on the chart's axis: the row's names, each cut to fit.
 * A name may be empty: a sale may sit on a material or supplier with no name.
 */
export function barLabelFor(mode: SalesMode, row: SalesRow): string {
  const named: Partial<Record<NameKey, string | null>> = row
  return SALES_MODES[mode].names.map((key) => shortened(named[key] ?? '')).join(' / ')
}
