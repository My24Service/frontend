import { useQueryErrorToast } from '@/features/forms'
import { formatMoneyPlain, toDinero } from '@/services/money'
import {
  createInvoiceLines,
  hydrateInvoicePrices,
  invoiceLineType,
  sumInvoiceTotals,
  type CalculatedPrices,
  type CostAmount,
  type InvoiceLineOption,
} from './calculations'
import type { CostPanelContext } from './cost-panel-context'

/**
 * One row of a cost collection: the fields the panels edit plus the stored
 * fields the server may answer with.
 *
 * Deliberately loose where the two consumers disagree (`Api.OrderCost.Record`
 * is the invoice's record, `Api.QuotationCost.Record` the quotation's), because
 * the panels only ever read the fields named here and each consumer's
 * `rowBody` is what narrows a row to its own endpoint's request schema before
 * it goes on the wire.
 */
export type CostRow = Omit<Partial<Api.OrderCost.Record>, keyof CalculatedPrices | 'id' | 'amount_decimal' | 'amount_duration' | 'amount_duration_read' | 'amount_int' | 'vat_type' | 'price_currency'> & CalculatedPrices & {
  id?: number
  cost_type: Api.CostTypeEnum
  amount_int: number
  amount_decimal: number | string
  amount_duration: string | number | null
  amount_duration_read: string
  vat_type: string | number
  price_currency: string
  /** The chapter a quotation cost belongs to; order costs carry none. */
  chapter?: number | null
  /** The currencies the stored vat and total are in; sent when the row has one. */
  vat_currency?: string
  total_currency?: string
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
 * What only a consumer of the cost machinery knows: where the rows are read
 * from, where the replace-set is written, and how a row is narrowed to that
 * endpoint's request body.
 *
 * The invoice panel fills this with `Api.OrderCost` scoped to an order; the
 * quotation panel with `Api.QuotationCost` scoped to a quotation and chapter.
 * Everything else - the draft rows, the totals, the shell - is the same and
 * lives here.
 */
export interface CostCollectionSource {
  /**
   * The cached list query for this collection, or `null` while the consumer
   * has nothing to read yet (the invoice form's bootstrap has not answered an
   * order). Returning `null` keeps the query disabled rather than reading a
   * placeholder id.
   */
  listOptions: () => Record<string, unknown> | null
  /**
   * Write the panel's rows as one replace-set and answer with the stored rows.
   *
   * A plain function rather than the generated mutation options: those
   * re-expose their response and variables through invariant slots, so only
   * `any` - or one endpoint's exact types - could name them here, and naming
   * one endpoint's types would pin this interface to one consumer. Each
   * consumer narrows inside its own implementation instead.
   */
  replace: (path: Record<string, string>, body: Record<string, unknown>[]) => Promise<readonly CostRow[]>
  /**
   * The path parameters of the replace-set. Throws when the consumer has no
   * parent to write against, the way the invoice form refuses to save costs
   * without an order.
   */
  replacePath: () => Record<string, string>
  /** Narrow one edited row to the endpoint's request body. */
  rowBody: (row: CostRow) => Record<string, unknown>
}

/**
 * A draft row seeded with `price`: the panel's default rate for this kind of
 * cost, which the row's PriceInput then edits in place.
 */
export function makeCostRow(
  input: Partial<CostRow> & { cost_type: Api.CostTypeEnum },
  price: { price: string | number | null | undefined; currency: string },
  vat: string | number,
): CostRow {
  const currency = price.currency
  return {
    ...hydrateInvoicePrices({ price: formatMoneyPlain(toDinero(price.price, currency)), total: '0.00', vat: '0.00', price_currency: currency, total_currency: currency, vat_currency: currency }),
    amount_int: 0, amount_decimal: 0, amount_duration: null, amount_duration_read: '',
    vat_type: vat,
    ...input,
  }
}

/** A row's amount as the field its cost type counts in, for turning it into a line. */
export function costAmountOf(row: CostRow): CostAmount {
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

export interface CollectionOptions {
  /**
   * The form's shared reads and callbacks; see `CostPanelContext`. A consumer
   * that builds its own line drafts (the quotation) leaves `linesCreated` out
   * and never calls `createInvoiceLinesClicked`.
   */
  context: Pick<CostPanelContext, 'parentPk' | 'engineers' | 'lines' | 'emptyCollectionClicked'>
    & Partial<Pick<CostPanelContext, 'linesCreated'>>
  /** Where this collection is read from and written to. */
  source: CostCollectionSource
  costType: () => Api.CostTypeEnum
  /** The tenant default currency from the server bootstrap, for empty sums. */
  currency: () => string
  buildRows: () => CostRow[]
  description: (row: CostRow) => string
  title: () => string
  amount: () => number | string | null | undefined
}

/**
 * One kind of order or quotation costs (hours, distance, call-out costs, used
 * materials) as the cost panels edit it: the stored rows when the server has
 * any for this parent and type, otherwise locally built drafts seeded with the
 * panel's default rate. Each row carries its own `price`, which the panel edits
 * in place; there is no rate to resolve at save time.
 *
 * The read is one cached query per parent and cost type, like the document
 * collections, disabled until the form's bootstrap has answered. The write is
 * one bulk replace-set: the panel's rows go in a single request, the server
 * prices them, and the panel adopts the returned rows, so their stored ids and
 * totals are what the server stored. Totals on unsaved drafts stay zero until
 * that save.
 *
 * `source` is the only part the consumer supplies; everything else is the same
 * for the invoice (order costs) and the quotation (chapter costs).
 */
export function useCostCollection(options: CollectionOptions) {
  const { context, source } = options
  const { create } = useToast()
  const queryClient = useQueryClient()

  const listQuery = useQuery(() => {
    const query = source.listOptions()
    return {
      ...(query ?? {}),
      enabled: query !== null,
      refetchOnWindowFocus: false,
    } as never
  })
  useQueryErrorToast(listQuery.error, $trans('Error loading costs'))

  const collection = ref<CostRow[]>([])
  // True while a save or empty is in flight; the query's own loading covers the reads.
  const saving = ref(false)
  const isLoading = computed(() => {
    return listQuery.isLoading.value || saving.value
  })
  // The generated list options resist a single generic signature (see
  // `useResourceForm`), so the query above is deliberately loose and this is
  // the accessor its consumers read: the cached page of stored rows.
  type CostListData = { results?: CostRow[] }
  const listData = (data: unknown): CostListData => (data ?? {})
  // Stored rows exist when the server answered with any for this parent and type.
  const hasStoredData = computed(() => {
    return (listData(listQuery.data.value).results?.length ?? 0) > 0
  })
  const totals = computed(() => sumInvoiceTotals(collection.value, options.currency()))
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
  const parentHasInvoiceLines = computed(() => checkParentHasInvoiceLines(context.lines.value))

  function reconcile(records: readonly CostRow[]) {
    if (records.length > 0) {
      collection.value = records.map((row) => makeCostRow({ ...row, ...hydrateInvoicePrices(row), amount_int: row.amount_int ?? 0, amount_decimal: row.amount_decimal ?? 0, amount_duration_read: row.amount_duration_read ?? '' }, { price: row.price, currency: row.price_currency }, row.vat_type ?? '0'))
    } else {
      collection.value = options.buildRows()
    }
  }

  // The server rows are the source of truth once they exist; without them the
  // panel edits locally built drafts priced off the form's bootstrap data.
  watch(listQuery.data, (data) => {
    reconcile(listData(data).results ?? [])
  }, { immediate: true })

  /**
   * Reload the stored rows after a write, or rebuild the drafts when the
   * pricing inputs they were built from changed (see MaterialsPanel).
   *
   * `refetch` always hits the server, so the invalidate-then-fetchQuery the
   * hand-rolled `useCostApi` wrapper needed to bypass the cache is
   * unnecessary here - which is why that wrapper is gone.
   */
  async function loadData() {
    if (source.listOptions() === null) {
      reconcile([])
      return
    }
    const result = await listQuery.refetch({ throwOnError: true })
    reconcile(listData(result.data).results ?? [])
  }

  /**
   * Adopt a replace-set's answer as the stored set: it is the whole set, so it
   * is written into the list cache rather than read back. The quotation
   * panels save this way; `saveCollection` below keeps the invoice's
   * adopt-then-reload.
   */
  function adoptStored(rows: readonly CostRow[]) {
    const query = source.listOptions() as { queryKey?: readonly unknown[] } | null
    if (!query?.queryKey) {
      reconcile(rows)
      return
    }
    queryClient.setQueryData(query.queryKey, (old: unknown) => ({
      ...(old && typeof old === 'object' ? old : {}),
      count: rows.length, next: null, previous: null, results: [...rows],
    }))
    reconcile(rows)
  }

  async function saveCollection() {
    saving.value = true
    try {
      // Adopt the returned rows first, so a retry after a failed follow-up
      // updates them instead of creating duplicates; the reload then syncs
      // the list cache the stored/draft switch reads.
      reconcile(await source.replace(
        source.replacePath(),
        collection.value.map(source.rowBody),
      ))
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
      await source.replace(source.replacePath(), [])
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
    const costs = collection.value.map(row => ({ ...row, ...costAmountOf(row) }))
    const lines = createInvoiceLines(costs, selected, {
      item: options.description, total: options.title(),
    }, { type: invoiceLineType(options.costType()), amount: options.amount() ?? 0 }, options.currency())
    if (selected !== 'none') context.linesCreated?.(lines)
  }
  function changeVatType(row: CostRow, value: string | number) {
    row.vat_type = value
  }
  /** Put a new price on one row; its totals refresh when the set is saved. */
  function setPrice(row: CostRow, rate: { price: string | number | null | undefined; currency: string }) {
    const dinero = toDinero(rate.price, rate.currency)
    row.price = formatMoneyPlain(dinero)
    row.price_currency = dinero.getCurrency()
  }
  function priceChanged(value: ReturnType<typeof toDinero>, row: CostRow) {
    setPrice(row, { price: formatMoneyPlain(value), currency: value.getCurrency() })
  }
  function getFullname(id: number | null | undefined) {
    return context.engineers.value.find(user => user.id === id)?.full_name ?? ''
  }

  return {
    collection, isLoading, hasStoredData, total_dinero, totalVAT_dinero,
    useOnInvoiceOptions, checkParentHasInvoiceLines, parentHasInvoiceLines,
    loadData, saveCollection, adoptStored, emptyCollection, emptyCollectionClicked,
    createInvoiceLinesClicked, changeVatType, priceChanged, setPrice, getFullname,
  }
}
