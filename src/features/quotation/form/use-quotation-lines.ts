import * as v from 'valibot'

import { useQueryErrorToast } from '@/features/forms'
import { WHOLE_COLLECTION_PAGE_SIZE } from '@/features/table'
import { hydrateQuotationLinePrices, sumChapterTotals, type QuotationLineDraft } from './calculations'

/** A line as the panel holds it: stored (with an id) or staged, keyed locally either way. */
export type QuotationLineRow = QuotationLineDraft & {
  id?: number
  localKey: number
  /** Added or edited since the chapter was last saved; the table marks it. */
  hasChanges?: boolean
  /** Stored fields the panel does not edit but must send back unchanged. */
  old_material?: string | null
  material_identifier?: string | null
  location?: string | null
}

/**
 * One chapter's quotation lines, staged: lines are added (typed, or made from
 * the chapter's costs), edited and deleted locally, and the chapter is saved
 * as ONE replace-set - `POST quotation-line/chapter/{chapter_id}/` with every
 * line the panel holds; a stored line left out is deleted. The answer is the
 * stored set and is adopted as it is. "Discard" goes back to the stored set.
 */
export function useQuotationLines(chapterId: () => number) {
  const { mainStore, toast: create, queryClient } = useCommon()
  const currency = mainStore.requiredDefaultCurrency

  const listOptions = () => Api.QuotationQuotationLine.list.options({
    query: {chapter: chapterId(), page: 1, page_size: WHOLE_COLLECTION_PAGE_SIZE},
  })
  const linesQuery = useQuery(() => ({...listOptions(), refetchOnWindowFocus: false}))
  useQueryErrorToast(linesQuery.error, $trans('Error loading quotation lines'))

  const lines = ref<QuotationLineRow[]>([])
  const deleted = ref<QuotationLineRow[]>([])
  const hasChanges = ref(false)
  const saving = ref(false)
  const isLoading = computed(() => linesQuery.isLoading.value || saving.value)
  let nextKey = 0

  function fromStored(record: Api.QuotationLine): QuotationLineRow {
    const prices = {...record, price: record.price ?? '0.00', total: record.total ?? '0.00', vat: record.vat ?? '0.00'}
    return {
      ...prices,
      ...hydrateQuotationLinePrices(prices),
      cost_type: (record.cost_type ?? 'manual') as QuotationLineRow['cost_type'],
      info: record.info ?? '',
      extra_description: record.extra_description ?? '',
      vat_type: record.vat_type ?? '0',
      localKey: nextKey++,
    }
  }
  function adopt(records: readonly Api.QuotationLine[]) {
    lines.value = records.map(fromStored)
    deleted.value = []
    hasChanges.value = false
  }
  watch(linesQuery.data, (data) => {
    if (data?.results && !hasChanges.value) adopt(data.results)
  }, {immediate: true})

  const totals = computed(() => sumChapterTotals(lines.value, currency))

  function stage(draft: QuotationLineDraft): QuotationLineRow {
    return {...draft, localKey: nextKey++, hasChanges: true}
  }
  function addLine(draft: QuotationLineDraft) {
    lines.value.push(stage(draft))
    hasChanges.value = true
  }
  function updateLine(localKey: number, draft: QuotationLineDraft) {
    const index = lines.value.findIndex((line) => line.localKey === localKey)
    if (index === -1) return
    lines.value[index] = {...lines.value[index], ...draft, hasChanges: true}
    hasChanges.value = true
  }
  function deleteLine(localKey: number) {
    const line = lines.value.find((row) => row.localKey === localKey)
    if (!line) return
    lines.value = lines.value.filter((row) => row.localKey !== localKey)
    if (line.id !== undefined) deleted.value.push(line)
    hasChanges.value = true
  }
  /** Lines a cost panel made from its costs. */
  function addLines(drafts: readonly QuotationLineDraft[]) {
    if (!drafts.length) return
    lines.value.push(...drafts.map(stage))
    hasChanges.value = true
    const label = drafts.length === 1 ? $trans('quotation line') : $trans('quotation lines')
    infoToast(create, $trans('Added'), `${drafts.length} ${label} ${$trans('added')}`)
  }
  /** A cost panel's "remove quotation lines": every line made from that cost type goes. */
  function removeLinesForType(costType: Api.CostTypeEnum) {
    for (const line of lines.value.filter((row) => row.cost_type === costType)) deleteLine(line.localKey)
  }

  function rowBody(line: QuotationLineRow) {
    // The chapter travels in the url and the quotation is inferred from it,
    // so neither is in a row. The currency companions go along when the row
    // has one: the server keeps the column's default (EUR) without them.
    return v.parse(schemas.vQuotationLineRowRequest, {
      ...(line.id == null ? {} : {id: line.id}),
      old_material: line.old_material ?? null,
      material: line.material ?? null,
      material_name: line.material_name ?? null,
      material_identifier: line.material_identifier ?? null,
      location: line.location ?? null,
      amount: String(line.amount),
      info: line.info || null,
      extra_description: line.extra_description || null,
      vat_type: String(line.vat_type),
      cost_type: line.cost_type,
      price: line.price,
      vat: line.vat,
      total: line.total,
      ...(line.price_currency ? {price_currency: line.price_currency} : {}),
      ...(line.vat_currency ? {vat_currency: line.vat_currency} : {}),
      ...(line.total_currency ? {total_currency: line.total_currency} : {}),
    })
  }

  const saveMutation = useMutation(Api.QuotationQuotationLineChapter.create.mutation())
  async function saveCollection() {
    saving.value = true
    try {
      const stored = await saveMutation.mutateAsync({
        path: {chapter_id: String(chapterId())},
        body: lines.value.map(rowBody),
      })
      queryClient.setQueryData(listOptions().queryKey, (old) => old && {...old, count: stored.length, results: stored})
      adopt(stored)
      infoToast(create, $trans('Updated'), $trans('chapter has been updated'))
    } catch {
      errorToast(create, $trans('Error updating chapter'))
    } finally {
      saving.value = false
    }
  }

  function discard() {
    adopt(linesQuery.data.value?.results ?? [])
  }

  return {
    lines, deleted, hasChanges, isLoading, totals,
    addLine, updateLine, deleteLine, addLines, removeLinesForType, saveCollection, discard,
  }
}
