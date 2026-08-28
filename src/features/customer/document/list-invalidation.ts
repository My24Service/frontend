import type { QueryClient } from '@tanstack/vue-query'

import { customerDocumentListQueryKey } from '@/api/@tanstack/vue-query.gen'

/**
 * The Customer-document list queries.
 *
 * Invalidation by resource, as settled for contracts in #323: a document
 * write invalidates every `customer=` filter of the document list at once,
 * via partial key matching.
 *
 * The Customer record embeds a `documents` array in its responses, but no
 * screen displays that embedded copy — the panels read the document list
 * itself — so no customer query needs invalidating here.
 */
export async function invalidateDocumentListQueries(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({queryKey: customerDocumentListQueryKey()})
}
