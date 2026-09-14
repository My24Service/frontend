import { statuscodeStatuscodeList } from '@/api/sdk.gen'

/**
 * TEMPORARY SHIM — do not extend.
 *
 * The statuscode screens moved to `src/features/statuscode/`. What remains
 * here is the one call the not-yet-rewritten `QuotationList` still makes:
 * the quotation statuscodes it hands `TableStatusInfo`, read as the legacy
 * service returned them (`{results}`). It goes when the Quotation Slice does.
 */
class QuotationStatuscodeService {
  async list() {
    const { data } = await statuscodeStatuscodeList({ query: { code_type: 'quotation' }, throwOnError: true })
    return data
  }
}

export { QuotationStatuscodeService }
