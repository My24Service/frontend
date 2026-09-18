import { computed, onMounted, ref } from 'vue'
import { useToast } from 'bootstrap-vue-next'
import type { CostTypeEnum, OrderCost, OrderCostRequest } from '@/api/types.gen'
import { $trans, errorToast, infoToast } from '@/services/i18n'
import { toDinero } from '@/services/money'
import {
  calculateCost, createInvoiceLines, hydrateInvoicePrices, invoiceLineType, sumInvoiceTotals,
} from './calculations'
import type { CalculatedPrices, CostAmount, InvoiceLineOption } from './calculations'
import { useCostApi } from './cost-api'
import type { CostPanelContext } from './cost-panel-context'

export type CostRow = Omit<Partial<OrderCost>, keyof CalculatedPrices | 'id' | 'amount_decimal' | 'amount_duration' | 'amount_duration_read' | 'amount_int' | 'vat_type'> & CalculatedPrices & {
  id?: number
  cost_type: CostTypeEnum
  use_price: OrderCost['use_price']
  amount_int: number
  amount_decimal: number | string
  amount_duration: string | number | null
  amount_duration_read: string
  vat_type: string | number
  price_other: string | number
  price_other_currency: string
  is_partner?: boolean
  full_name?: string | null
  partner_companycode?: string | null
  user_id?: number | string | null
  material_id?: number | null
  name?: string | null
  identifier?: string | null
  amount?: number | string
  distance_to_total?: number | null
  distance_back_total?: number | null
  distance_total?: number | null
  margin_perc?: number | string
  price_purchase?: string | number
  price_purchase_currency?: string
  price_selling?: string | number
  price_selling_currency?: string
  selling_price?: string
}

export function makeCostRow(input: Partial<CostRow> & { cost_type: CostTypeEnum }, currency: string, vat: string | number): CostRow {
  return {
    ...hydrateInvoicePrices({ price: '0.00', total: '0.00', vat: '0.00', price_currency: currency, total_currency: currency, vat_currency: currency }),
    amount_int: 0, amount_decimal: 0, amount_duration: null, amount_duration_read: '',
    use_price: 'settings', vat_type: vat, price_other: '0.00', price_other_currency: currency,
    ...input,
  }
}

function amountFields(row: CostRow): CostAmount {
  switch (row.cost_type) {
    case 'used_materials': return { cost_type: row.cost_type, amount_decimal: row.amount_decimal }
    case 'work_hours':
    case 'travel_hours':
    case 'extra_work':
    case 'actual_work': return { cost_type: row.cost_type, amount_duration_read: row.amount_duration_read, amount_duration_secs: row.amount_duration_secs }
    case 'distance':
    case 'call_out_costs': return { cost_type: row.cost_type, amount_int: row.amount_int }
    default: {
      const neverType: never = row.cost_type
      throw new Error('Unknown cost type: ' + String(neverType))
    }
  }
}

interface CollectionOptions {
  /** The form's shared reads and callbacks; see `CostPanelContext`. */
  context: Pick<CostPanelContext, 'orderPk' | 'engineers' | 'invoiceLines' | 'invoiceLinesCreated' | 'emptyCollectionClicked'>
  costType: () => CostTypeEnum
  buildRows: () => CostRow[]
  rate: (row: CostRow) => { price: string | number | null | undefined; currency: string }
  description: (row: CostRow) => string
  title: () => string
  amount: () => number | string | null | undefined
}

export function useCostCollection(options: CollectionOptions) {
  const api = useCostApi()
  const { context } = options
  const { create } = useToast()
  const collection = ref<CostRow[]>([])
  const isLoading = ref(true)
  const hasStoredData = ref(false)
  const totals = computed(() => sumInvoiceTotals(collection.value))
  const total_dinero = computed(() => totals.value.total_dinero)
  const totalVAT_dinero = computed(() => totals.value.vat_dinero)
  const useOnInvoiceOptions = [
    { text: $trans('Items'), value: 'user_totals' as const },
    { text: $trans('Total'), value: 'total' as const },
    { text: $trans('None'), value: 'none' as const },
  ]
  const checkParentHasInvoiceLines = (lines: readonly { type?: string }[] | null | undefined) =>
    !!lines?.some(line => line.type === invoiceLineType(options.costType()))
  const parentHasInvoiceLines = computed(() => checkParentHasInvoiceLines(context.invoiceLines.value))

  function updateTotals() {
    for (const row of collection.value) {
      const rate = options.rate(row)
      Object.assign(row, calculateCost({ ...amountFields(row), price: rate.price, price_currency: rate.currency, vat_type: row.vat_type }))
    }
  }

  async function loadData() {
    const orderId = context.orderPk.value
    const records = orderId == null ? [] : (await api.listCosts(orderId, options.costType())).results ?? []
    hasStoredData.value = records.length > 0
    collection.value = hasStoredData.value
      ? records.map((row: OrderCost) => makeCostRow({ ...row, ...hydrateInvoicePrices(row), amount_int: row.amount_int ?? 0, amount_decimal: row.amount_decimal ?? 0, amount_duration_read: row.amount_duration_read ?? '' }, row.price_currency, row.vat_type ?? '0'))
      : options.buildRows()
    if (!hasStoredData.value) updateTotals()
  }

  function requestBody(row: CostRow): OrderCostRequest {
    const order = context.orderPk.value
    if (order == null) throw new Error('An order is required to save costs')
    return {
      order, cost_type: row.cost_type, use_price: row.use_price,
      user: row.user, user_full_name: row.user_full_name, material: row.material,
      amount_int: Number(row.amount_int), amount_decimal: String(row.amount_decimal),
      amount_duration: row.amount_duration == null ? null : String(row.amount_duration),
      price: row.price, vat_type: String(row.vat_type), vat: row.vat, total: row.total,
    }
  }

  async function saveCollection() {
    isLoading.value = true
    try {
      for (const row of collection.value) {
        const body = requestBody(row)
        const saved = row.id == null ? await api.createCost(body) : await api.updateCost(row.id, body)
        row.id = saved.id
      }
      await loadData()
      infoToast(create, $trans('Saved'), $trans('Costs saved'))
    } catch {
      errorToast(create, $trans('Error saving costs'))
    } finally {
      isLoading.value = false
    }
  }

  async function emptyCollection() {
    isLoading.value = true
    try {
      for (const row of collection.value) if (row.id != null) await api.deleteCost(row.id)
      await loadData()
    } catch {
      errorToast(create, $trans('Error removing costs'))
    } finally {
      isLoading.value = false
    }
  }
  function emptyCollectionClicked() {
    void emptyCollection()
    context.emptyCollectionClicked(invoiceLineType(options.costType()))
  }
  function createInvoiceLinesClicked(selected: InvoiceLineOption | null) {
    if (selected === null) throw new Error('Unknown invoice calculation option: null')
    const costs = collection.value.map(row => ({ ...row, ...amountFields(row) }))
    const lines = createInvoiceLines(costs, selected, {
      item: options.description, total: options.title(),
    }, { type: invoiceLineType(options.costType()), amount: options.amount() ?? 0 })
    if (selected !== 'none') context.invoiceLinesCreated(lines)
  }
  function changeVatType(row: CostRow, value: string | number) {
    row.vat_type = value
    updateTotals()
  }
  function marginChanged(row: CostRow, value: string | number) {
    row.margin_perc = value
    updateTotals()
  }
  function otherPriceChanged(value: ReturnType<typeof toDinero>, row: CostRow) {
    row.price_other = value.toFormat('0.00')
    row.price_other_currency = value.getCurrency()
    updateTotals()
  }
  const getFullname = (id: number | null | undefined) => context.engineers.value.find(user => user.id === id)?.full_name ?? ''

  onMounted(async () => {
    try { await loadData() }
    catch { errorToast(create, $trans('Error loading costs')) }
    finally { isLoading.value = false }
  })

  return {
    collection, isLoading, hasStoredData, total_dinero, totalVAT_dinero,
    useOnInvoiceOptions, checkParentHasInvoiceLines, parentHasInvoiceLines,
    loadData, updateTotals, saveCollection, emptyCollection, emptyCollectionClicked,
    createInvoiceLinesClicked, changeVatType, marginChanged, otherPriceChanged, getFullname,
  }
}
