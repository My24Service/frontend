import { useQueryErrorToast } from '@/features/forms'
import { WHOLE_COLLECTION_PAGE_SIZE } from '@/features/table'
import { toDinero } from '@/services/money'
import { hydrateQuotationLinePrices } from '../form/calculations'

/**
 * A quotation as the read-only view shows it: the record, its chapters in
 * order, each with its lines, every amount as a dinero.
 *
 * The legacy view read the quotation, then its chapters, then each chapter's
 * lines one request at a time. Neither the chapters nor the lines depend on
 * the quotation's answer — both filter on the pk the route already carries —
 * so the three reads run together, and the lines come in one `?quotation=`
 * read grouped by chapter rather than one read per chapter. The whole
 * collection is asked for: the legacy per-chapter reads used the default page
 * and silently dropped a chapter's 21st line.
 */
export function useQuotationDetail(pk: () => number) {
  const quotationQuery = useQuery(() => Api.QuotationQuotation.retrieve.options({path: {id: pk()}}))
  const chaptersQuery = useQuery(() => Api.QuotationChapter.list.options({
    query: {quotation: pk(), page: 1, page_size: WHOLE_COLLECTION_PAGE_SIZE},
  }))
  const linesQuery = useQuery(() => Api.QuotationQuotationLine.list.options({
    query: {quotation: pk(), page: 1, page_size: WHOLE_COLLECTION_PAGE_SIZE},
  }))

  const error = computed(() => quotationQuery.error.value ?? chaptersQuery.error.value ?? linesQuery.error.value)
  useQueryErrorToast(error, $trans('Error fetching quotation'))

  const isLoading = computed(() =>
    quotationQuery.isLoading.value || chaptersQuery.isLoading.value || linesQuery.isLoading.value)

  const quotation = computed(() => {
    const record = quotationQuery.data.value
    const chapters = chaptersQuery.data.value?.results
    const lines = linesQuery.data.value?.results
    // A failed read renders nothing, as the legacy view did.
    if (!record || !chapters || !lines || error.value) return undefined
    return {
      ...record,
      total_dinero: toDinero(record.total ?? '0.00', record.total_currency),
      vat_dinero: toDinero(record.vat ?? '0.00', record.vat_currency),
      chapters: chapters.map((chapter) => ({
        ...chapter,
        quotationLines: lines
          .filter((line) => line.chapter === chapter.id)
          .map((line) => ({...line, ...hydrateQuotationLinePrices(line)})),
      })),
    }
  })

  return {quotation, isLoading}
}
