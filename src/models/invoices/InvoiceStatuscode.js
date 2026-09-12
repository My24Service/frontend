import { statuscodeStatuscodeList } from '@/api/sdk.gen'

/**
 * TEMPORARY SHIM — do not extend.
 *
 * The statuscode screens moved to `src/features/statuscode/`. What remains
 * here is the one call the not-yet-rewritten `InvoiceList` still makes: the
 * invoice statuscodes it hands `TableStatusInfo`, read as the legacy service
 * returned them (`{results}`). It goes when the Invoice Slice does.
 */
class InvoiceStatuscodeService {
  async list() {
    const { data } = await statuscodeStatuscodeList({ query: { code_type: 'invoice' }, throwOnError: true })
    return data
  }
}

export { InvoiceStatuscodeService }
