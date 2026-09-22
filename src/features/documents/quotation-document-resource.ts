import {
  quotationDocumentCreateMutation,
  quotationDocumentDestroyMutation,
  quotationDocumentListOptions,
  quotationDocumentListQueryKey,
  quotationDocumentPartialUpdateMutation,
} from '@/api/@tanstack/vue-query.gen'
import type { DocumentResource } from './use-document-collection'
import { WHOLE_COLLECTION_PAGE_SIZE } from '@/features/table'

export const quotationDocumentResource: DocumentResource = {
  // The panel stages every document for editing and replays the set on save, so
  // it needs the whole collection: a page-1 read would hide the rows past 20 and
  // then never write them. `WHOLE_COLLECTION_PAGE_SIZE` is the API's own ceiling.
  list: (parentId) => quotationDocumentListOptions({query: {quotation: parentId, page: 1, page_size: WHOLE_COLLECTION_PAGE_SIZE}}),
  create: quotationDocumentCreateMutation,
  update: quotationDocumentPartialUpdateMutation,
  destroy: quotationDocumentDestroyMutation,
  queryKey: quotationDocumentListQueryKey,
  parentField: 'quotation',
}
