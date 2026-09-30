/**
 * The five ways the inventory stats screen breaks sales down, and what each
 * one needs to be read: which columns its table shows and what a bar of its
 * chart is called. What each one *reads* is the screen's business, because
 * the five reads are five differently typed generated queries.
 */
export const SALES_MODES = [
  'total-material-sales',
  'total-sales-per-supplier',
  'total-material-sales-per-customer',
  'total-sales-per-material-customer',
  'total-sales-per-material-supplier',
] as const

export type SalesMode = (typeof SALES_MODES)[number]

/** A row of any of the five total-sales answers. */
export type SalesRow =
  | Api.MaterialTotalSalesRow
  | Api.SupplierTotalSalesRow
  | Api.CustomerTotalSalesRow
  | Api.SupplierMaterialTotalSalesRow
  | Api.CustomerMaterialTotalSalesRow

/** The numbers a bar can show. */
export type GraphField = 'sum_amount' | 'sum_price_selling' | 'profit'

export interface SalesColumn {
  key: string
  label: string
  sortable: boolean
}

export function modeOptions() {
  return [
    {value: 'total-material-sales', text: $trans('Total material sales')},
    {value: 'total-sales-per-supplier', text: $trans('Total sales per supplier')},
    {value: 'total-material-sales-per-customer', text: $trans('Total material sales per customer')},
    {value: 'total-sales-per-material-customer', text: $trans('Total sales per material per customer')},
    {value: 'total-sales-per-material-supplier', text: $trans('Total sales per material per supplier')},
  ]
}

export function graphFieldOptions() {
  return [
    {item: 'sum_amount', name: $trans('Amount')},
    {item: 'sum_price_selling', name: $trans('Selling price')},
    {item: 'profit', name: $trans('Profit')},
  ]
}

const column = (key: string, label: string): SalesColumn => ({key, label, sortable: true})

/** The four numbers every mode ends its table with. */
function figureColumns(): SalesColumn[] {
  return [
    column('sum_amount', $trans('Total amount')),
    column('sum_price_selling', $trans('Total selling')),
    column('sum_price_purchase', $trans('Total purchase')),
    column('profit', $trans('Profit')),
  ]
}

export function columnsFor(mode: SalesMode): SalesColumn[] {
  switch (mode) {
    case 'total-material-sales':
      return [column('material_name', $trans('Material')), ...figureColumns()]
    case 'total-sales-per-supplier':
      return [column('supplier_name', $trans('Supplier')), ...figureColumns()]
    case 'total-material-sales-per-customer':
      return [column('customer_name', $trans('Customer')), ...figureColumns()]
    case 'total-sales-per-material-supplier':
      return [
        column('supplier_name', $trans('Supplier')),
        column('material_name', $trans('Material')),
        ...figureColumns(),
      ]
    case 'total-sales-per-material-customer':
      return [
        column('customer_name', $trans('Customer')),
        column('material_name', $trans('Material')),
        ...figureColumns(),
      ]
  }
}

/** The legend of the chart: what one bar is a total of, and for which year. */
export function datasetLabelFor(mode: SalesMode, year: number): string {
  switch (mode) {
    case 'total-material-sales':
      return `Total sales in : ${year}`
    case 'total-sales-per-supplier':
      return `Total sales per supplier in : ${year}`
    case 'total-material-sales-per-customer':
      return `Total sales per customer in : ${year}`
    case 'total-sales-per-material-supplier':
      return `Total sales per supplier per material in : ${year}`
    case 'total-sales-per-material-customer':
      return `Total sales per customer per material in : ${year}`
  }
}

type NameKey = 'material_name' | 'supplier_name' | 'customer_name'

/** A row's name, empty when the row has none: a sale may sit on a material or supplier with no name. */
function nameOf(row: SalesRow, key: NameKey): string {
  const value: unknown = Reflect.get(row, key)
  return typeof value === 'string' ? value : ''
}

function shortened(text: string): string {
  return text.length > 15 ? `${text.slice(0, 14)}...` : text
}

/** What a bar is called on the chart's axis: the row's names, cut to fit. */
export function barLabelFor(mode: SalesMode, row: SalesRow): string {
  switch (mode) {
    case 'total-material-sales':
      return shortened(nameOf(row, 'material_name'))
    case 'total-sales-per-supplier':
      return shortened(nameOf(row, 'supplier_name'))
    case 'total-material-sales-per-customer':
      return shortened(nameOf(row, 'customer_name'))
    case 'total-sales-per-material-supplier':
      return `${shortened(nameOf(row, 'supplier_name'))} / ${shortened(nameOf(row, 'material_name'))}`
    case 'total-sales-per-material-customer':
      return `${shortened(nameOf(row, 'customer_name'))} / ${shortened(nameOf(row, 'material_name'))}`
  }
}
