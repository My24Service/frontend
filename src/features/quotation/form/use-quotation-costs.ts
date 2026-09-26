import {
  costAmountOf,
  invoiceLineType,
  makeCostRow,
  useCostCollection,
  useCostPanelContext,
  type CostRow,
  type InvoiceLineOption,
} from '@/features/costing'
import type { Money } from '@/services/money'
import {
  createQuotationLines,
  isEmptyQuotationCost,
  priceQuotationCost,
  sumQuotationCostAmounts,
  type QuotationLineDraft,
} from './calculations'
import { useQuotationCostSource } from './quotation-cost-source'

export interface QuotationCostsOptions {
  /** The chapter these costs belong to; the list and the replace-set are scoped by it. */
  chapterId: () => number
  costType: Api.CostTypeEnum
  /** The tenant's default price for a new row of this type. */
  defaultPrice: () => string | number | null | undefined
  /** The panel's title, and the info of a "total" quotation line. */
  title: () => string
  /** The info of an "items" quotation line made from one row. */
  description: (row: CostRow) => string
  /** Toast copy of a save, per panel as the legacy panels worded it. */
  saved: () => string
  saveError: () => string
  /** A row the save sends; the materials panel leaves material-less rows out. */
  keepOnSave?: (row: CostRow) => boolean
}

/**
 * One cost type of one quotation chapter, as its panel edits it: the stored
 * rows (or one blank row to start from), priced client-side on every edit
 * because the quotation cost endpoint stores the totals it is sent.
 *
 * The read, the draft/stored reconcile and the running totals are the shared
 * `useCostCollection`; what is quotation-only is here: rows are added and
 * deleted freely, a save is one chapter-scoped replace-set whose answer is
 * adopted as it is (no re-read), and turning costs into lines builds
 * quotation-line drafts that the form's line panel takes.
 */
export function useQuotationCosts(options: QuotationCostsOptions) {
  const context = useCostPanelContext<QuotationLineDraft>()
  const { mainStore, toast: create } = useCommon()
  const currency = mainStore.requiredDefaultCurrency
  const defaultVat = mainStore.getQuotationDefaultVat ?? mainStore.requiredInvoiceDefaultVat
  const chapterId = computed(() => options.chapterId())
  const costType = options.costType

  function blankRow(): CostRow {
    const row = makeCostRow({
      cost_type: costType, chapter: chapterId.value, material: null,
      amount_duration: null, amount_duration_read: '0:00', amount_duration_secs: 0,
    }, {price: options.defaultPrice(), currency}, defaultVat ?? '0')
    return {...row, ...priceQuotationCost(row)}
  }

  const source = useQuotationCostSource(context.parentPk, chapterId, () => costType)
  const collectionApi = useCostCollection({
    // The quotation builds its own line drafts, so the shared
    // `linesCreated` for invoice drafts is not handed over.
    context: {
      parentPk: context.parentPk,
      engineers: context.engineers,
      lines: context.lines,
      emptyCollectionClicked: (type) => context.emptyCollectionClicked(type),
    },
    source,
    costType: () => costType,
    currency: () => currency,
    buildRows: () => [blankRow()],
    description: options.description,
    title: options.title,
    amount: () => totalAmount.value,
  })
  const { collection, total_dinero, totalVAT_dinero, parentHasInvoiceLines, adoptStored } = collectionApi

  const saving = ref(false)
  const isLoading = computed(() => collectionApi.isLoading.value || saving.value)
  const hasChanges = ref(false)
  const totalAmount = computed(() => sumQuotationCostAmounts(collection.value, costType))
  const collectionHasEmptyItem = computed(() => collection.value.some((row) => isEmptyQuotationCost(row)))
  const isCollectionEmpty = computed(() => collection.value.every((row) => isEmptyQuotationCost(row)))

  /** An edit on a row: reprice it, and there is something to save. */
  function changed(row: CostRow) {
    Object.assign(row, priceQuotationCost(row))
    hasChanges.value = true
  }
  function priceChanged(value: Money, row: CostRow) {
    collectionApi.priceChanged(value, row)
    changed(row)
  }
  function changeVatType(row: CostRow, value: string | number) {
    collectionApi.changeVatType(row, value)
    changed(row)
  }
  function addCost() {
    collection.value.push(blankRow())
  }
  function deleteCost(index: number) {
    collection.value.splice(index, 1)
    if (collection.value.length === 0) addCost()
    hasChanges.value = true
  }

  async function saveCosts() {
    const rows = collection.value.filter(options.keepOnSave ?? (() => true))
    saving.value = true
    try {
      adoptStored(await source.replace(source.replacePath(), rows.map(source.rowBody)))
      hasChanges.value = false
      infoToast(create, $trans('Updated'), options.saved())
    } catch {
      errorToast(create, options.saveError())
    } finally {
      saving.value = false
    }
  }

  function createLinesClicked(option: InvoiceLineOption | null) {
    if (option === null || option === 'none') return
    const lines = createQuotationLines(collection.value.map((row) => ({...row, ...costAmountOf(row)})), option, {
      costType,
      item: options.description,
      total: options.title(),
      amount: totalAmount.value,
      currency,
    })
    context.linesCreated(lines)
  }

  /** "Remove quotation lines": the chapter drops this type's lines; the costs stay, editable again. */
  function removeLinesClicked() {
    context.emptyCollectionClicked(invoiceLineType(costType))
  }

  return {
    collection, isLoading, hasChanges, totalAmount, total_dinero, totalVAT_dinero,
    collectionHasEmptyItem, isCollectionEmpty, parentHasLines: parentHasInvoiceLines,
    changed, priceChanged, changeVatType, addCost, deleteCost, saveCosts,
    createLinesClicked, removeLinesClicked, useOnQuotationOptions: collectionApi.useOnInvoiceOptions,
  }
}
