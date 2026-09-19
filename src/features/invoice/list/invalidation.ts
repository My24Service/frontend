import type { QueryClient } from '@tanstack/vue-query'
import {
  invoiceInvoiceListQueryKey,
  invoiceInvoicePreliminaryListQueryKey,
  invoiceInvoiceSentListQueryKey,
} from '@/api/@tanstack/vue-query.gen'

export function invalidateInvoiceLists(queryClient: QueryClient) {
  return Promise.all([
    invoiceInvoiceListQueryKey(),
    invoiceInvoicePreliminaryListQueryKey(),
    invoiceInvoiceSentListQueryKey(),
  ].map((queryKey) => queryClient.invalidateQueries({queryKey})))
}
