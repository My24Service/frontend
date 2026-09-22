import {
  equipmentEquipmentDocumentCreateMutation,
  equipmentEquipmentDocumentDestroyMutation,
  equipmentEquipmentDocumentListOptions,
  equipmentEquipmentDocumentListQueryKey,
  equipmentEquipmentDocumentPartialUpdateMutation,
  equipmentLocationDocumentCreateMutation,
  equipmentLocationDocumentDestroyMutation,
  equipmentLocationDocumentListOptions,
  equipmentLocationDocumentListQueryKey,
  equipmentLocationDocumentPartialUpdateMutation,
} from '@/api/@tanstack/vue-query.gen'
import type { DocumentResource } from '@/features/documents'
import { WHOLE_COLLECTION_PAGE_SIZE } from '@/features/table'

export const equipmentDocumentResource: DocumentResource = {
  list: (parentId) => equipmentEquipmentDocumentListOptions({query: {equipment: parentId, page: 1, page_size: WHOLE_COLLECTION_PAGE_SIZE}}),
  create: equipmentEquipmentDocumentCreateMutation,
  update: equipmentEquipmentDocumentPartialUpdateMutation,
  destroy: equipmentEquipmentDocumentDestroyMutation,
  queryKey: equipmentEquipmentDocumentListQueryKey,
  parentField: 'equipment',
}

export const locationDocumentResource: DocumentResource = {
  list: (parentId) => equipmentLocationDocumentListOptions({query: {location: parentId, page: 1, page_size: WHOLE_COLLECTION_PAGE_SIZE}}),
  create: equipmentLocationDocumentCreateMutation,
  update: equipmentLocationDocumentPartialUpdateMutation,
  destroy: equipmentLocationDocumentDestroyMutation,
  queryKey: equipmentLocationDocumentListQueryKey,
  parentField: 'location',
}
