import type { CostTypeEnum, OrderCost, OrderCostRowRequest } from '@/api/types.gen'
import {
  orderCostListOptions,
  orderCostOrderCreateMutation,
} from '@/api/@tanstack/vue-query.gen'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { $trans, errorToast, infoToast } from '@/services/i18n'
import { toDinero } from '@/services/money'
import {
  createInvoiceLines, hydrateInvoicePrices, invoiceLineType, sumInvoiceTotals,
} from './calculations'
import type { CalculatedPrices, CostAmount, InvoiceLineOption } from './calculations'
import type { CostPanelContext } from './cost-panel-context'

export type CostRow = Omit<Partial<OrderCost>, keyof CalculatedPrices | 'id' | 'amount_decimal' | 'amount_duration' | 'amount_duration_read' | 'amount_int' | 'vat_type' | 'price_currency'> & CalculatedPrices & {
  id?: number
  cost_type: CostTypeEnum
  amount_int: number
  amount_decimal: number | string
  amount_duration: string | number | null
  amount_duration_read: string
  vat_type: string | number
  price_currency: string
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
  price_purchase?: string | number
  price_purchase_currency?: string
  price_selling?: string | number
  price_selling_currency?: string
  selling_price?: string
}

/**
 * A draft row seeded with `price`: the panel's default rate for this kind of
 * cost, which the row's PriceInput then edits in place.
 */
export function makeCostRow(
  input: Partial<CostRow> & { cost_type: CostTypeEnum },
  price: { price: string | number | null | undefined; currency: string },
  vat: string | number,
): CostRow {
  const currency = price.currency
  return {
    ...hydrateInvoicePrices({ price: toDinero(price.price, currency).toFormat('0.00'), total: '0.00', vat: '0.00', price_currency: currency, total_currency: currency, vat_currency: currency }),
    amount_int: 0, amount_decimal: 0, amount_duration: null, amount_duration_read: '',
    vat_type: vat,
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
  description: (row: CostRow) => string
  title: () => string
  amount: () => number | string | null | undefined
}

/**
 * One kind of order costs (hours, distance, call-out costs, used materials)
 * as the cost panels edit it: the stored rows when the server has any for
 * this order and type, otherwise locally built drafts seeded with the panel's
 * default rate. Each row carries its own `price`, which the panel edits in
 * place; there is no rate to resolve at save time.
 *
 * The read is one cached query per order and cost type, like the document
 * collections, disabled until the form's bootstrap has answered with an
 * order. The write is one bulk replace-set: the panel's rows go in a single
 * request, the server prices them, and the panel adopts the returned rows,
 * so their stored ids and totals are what the server stored. Totals on
 * unsaved drafts stay zero until that save.
 */
export function useCostCollection(options: CollectionOptions) {
  const { context } = options
  const { create } = useToast()

  const listQuery = useQuery(() => ({
    ...orderCostListOptions({
      query: { order: context.orderPk.value ?? 0, cost_type: options.costType() },
    }),
    enabled: context.orderPk.value != null,
    refetchOnWindowFocus: false,
  }))
  const replaceMutation = useMutation(orderCostOrderCreateMutation())
  useQueryErrorToast(listQuery.error, $trans('Error loading costs'))

  const collection = ref<CostRow[]>([])
  // True while a save or empty is in flight; the query's own loading covers the reads.
  const saving = ref(false)
  const isLoading = computed(() => {
    return listQuery.isLoading.value || saving.value
  })
  // Stored rows exist when the server answered with any for this order and type.
  const hasStoredData = computed(() => {
    return (listQuery.data.value?.results?.length ?? 0) > 0
  })
  const totals = computed(() => sumInvoiceTotals(collection.value))
  const total_dinero = computed(() => totals.value.total_dinero)
  const totalVAT_dinero = computed(() => totals.value.vat_dinero)
  const useOnInvoiceOptions = [
    { text: $trans('Items'), value: 'user_totals' as const },
    { text: $trans('Total'), value: 'total' as const },
    { text: $trans('None'), value: 'none' as const },
  ]
  function checkParentHasInvoiceLines(lines: readonly { type?: string }[] | null | undefined) {
    return !!lines?.some(line => line.type === invoiceLineType(options.costType()))
  }
  const parentHasInvoiceLines = computed(() => checkParentHasInvoiceLines(context.invoiceLines.value))

  function reconcile(records: readonly OrderCost[]) {
    if (records.length > 0) {
      collection.value = records.map((row: OrderCost) => makeCostRow({ ...row, ...hydrateInvoicePrices(row), amount_int: row.amount_int ?? 0, amount_decimal: row.amount_decimal ?? 0, amount_duration_read: row.amount_duration_read ?? '' }, { price: row.price, currency: row.price_currency }, row.vat_type ?? '0'))
    } else {
      collection.value = options.buildRows()
    }
  }

  // The server rows are the source of truth once they exist; without them the
  // panel edits locally built drafts priced off the form's bootstrap data.
  watch(listQuery.data, (data) => {
    reconcile(data?.results ?? [])
  }, { immediate: true })

  function rowBody(row: CostRow): OrderCostRowRequest {
    // The order and cost type travel in the URL; totals are priced by the
    // server and never sent.
    return {
      ...(row.id == null ? {} : { id: row.id }),
      user: row.user ?? null,
      user_full_name: row.user_full_name ?? null,
      material: row.material ?? null,
      amount_int: row.amount_int == null ? null : Number(row.amount_int),
      amount_decimal: row.amount_decimal == null ? null : String(row.amount_decimal),
      amount_duration: row.amount_duration == null ? null : String(row.amount_duration),
      price: row.price,
      vat_type: String(row.vat_type),
    }
  }

  function replacePath() {
    const order = context.orderPk.value
    if (order == null) throw new Error('An order is required to save costs')
    return { order_id: String(order), cost_type: options.costType() }
  }

  /**
   * Reload the stored rows after a write, or rebuild the drafts when the
   * pricing inputs they were built from changed (see MaterialsPanel).
   *
   * `refetch` always hits the server, so the invalidate-then-fetchQuery the
   * hand-rolled `useCostApi` wrapper needed to bypass the cache is
   * unnecessary here - which is why that wrapper is gone.
   */
  async function loadData() {
    if (context.orderPk.value == null) {
      reconcile([])
      return
    }
    const result = await listQuery.refetch({ throwOnError: true })
    reconcile(result.data?.results ?? [])
  }

  async function saveCollection() {
    saving.value = true
    try {
      // Adopt the returned rows first, so a retry after a failed follow-up
      // updates them instead of creating duplicates; the reload then syncs
      // the list cache the stored/draft switch reads.
      reconcile(await replaceMutation.mutateAsync({
        path: replacePath(),
        body: collection.value.map(rowBody),
      }))
      await loadData()
      infoToast(create, $trans('Saved'), $trans('Costs saved'))
    } catch {
      errorToast(create, $trans('Error saving costs'))
    } finally {
      saving.value = false
    }
  }

  async function emptyCollection() {
    saving.value = true
    try {
      // An empty set deletes every stored row of this type; the reload then
      // rebuilds the drafts, like the old per-row deletes followed by a reload.
      await replaceMutation.mutateAsync({ path: replacePath(), body: [] })
      await loadData()
    } catch {
      errorToast(create, $trans('Error removing costs'))
    } finally {
      saving.value = false
    }
  }
  function emptyCollectionClicked() {
    void emptyCollection()
    context.emptyCollectionClicked(invoiceLineType(options.costType()))
  }
  function createInvoiceLinesClicked(selected: InvoiceLineOption | null) {
    if (selected === null) return
    const costs = collection.value.map(row => ({ ...row, ...amountFields(row) }))
    const lines = createInvoiceLines(costs, selected, {
      item: options.description, total: options.title(),
    }, { type: invoiceLineType(options.costType()), amount: options.amount() ?? 0 })
    if (selected !== 'none') context.invoiceLinesCreated(lines)
  }
  function changeVatType(row: CostRow, value: string | number) {
    row.vat_type = value
  }
  /** Put a new price on one row; its totals refresh when the set is saved. */
  function setPrice(row: CostRow, rate: { price: string | number | null | undefined; currency: string }) {
    const dinero = toDinero(rate.price, rate.currency)
    row.price = dinero.toFormat('0.00')
    row.price_currency = dinero.getCurrency()
  }
  function priceChanged(value: ReturnType<typeof toDinero>, row: CostRow) {
    setPrice(row, { price: value.toFormat('0.00'), currency: value.getCurrency() })
  }
  function getFullname(id: number | null | undefined) {
    return context.engineers.value.find(user => user.id === id)?.full_name ?? ''
  }

  return {
    collection, isLoading, hasStoredData, total_dinero, totalVAT_dinero,
    useOnInvoiceOptions, checkParentHasInvoiceLines, parentHasInvoiceLines,
    loadData, saveCollection, emptyCollection, emptyCollectionClicked,
    createInvoiceLinesClicked, changeVatType, priceChanged, setPrice, getFullname,
  }
}
