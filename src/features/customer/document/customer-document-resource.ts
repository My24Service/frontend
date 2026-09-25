
import type { DocumentResource } from '@/features/documents'
import { WHOLE_COLLECTION_PAGE_SIZE } from '@/features/table'

export const customerDocumentResource: DocumentResource = {
  // The panel stages every document for editing and replays the set on save, so
  // it needs the whole collection: a page-1 read would hide the rows past 20 and
  // then never write them. `WHOLE_COLLECTION_PAGE_SIZE` is the API's own ceiling
  // (`My24Pagination.max_page_size`, my24service `source/apps/core/rest.py:236`),
  // which DRF clamps a larger value down to rather than rejecting it.
  list: (parentId) => Api.CustomerDocument.list.options({query: {customer: parentId, page: 1, page_size: WHOLE_COLLECTION_PAGE_SIZE}}),
  create: Api.CustomerDocument.create.mutation,
  update: Api.CustomerDocument.update.mutation,
  destroy: Api.CustomerDocument.destroy.mutation,
  queryKey: Api.CustomerDocument.list.queryKey,
  parentField: 'customer',
}
