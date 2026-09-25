
import type { DocumentResource } from '@/features/documents'
import { WHOLE_COLLECTION_PAGE_SIZE } from '@/features/table'

export const equipmentDocumentResource: DocumentResource = {
  list: (parentId) => Api.EquipmentEquipmentDocument.list.options({query: {equipment: parentId, page: 1, page_size: WHOLE_COLLECTION_PAGE_SIZE}}),
  create: Api.EquipmentEquipmentDocument.create.mutation,
  update: Api.EquipmentEquipmentDocument.update.mutation,
  destroy: Api.EquipmentEquipmentDocument.destroy.mutation,
  queryKey: Api.EquipmentEquipmentDocument.list.queryKey,
  parentField: 'equipment',
}

export const locationDocumentResource: DocumentResource = {
  list: (parentId) => Api.EquipmentLocationDocument.list.options({query: {location: parentId, page: 1, page_size: WHOLE_COLLECTION_PAGE_SIZE}}),
  create: Api.EquipmentLocationDocument.create.mutation,
  update: Api.EquipmentLocationDocument.update.mutation,
  destroy: Api.EquipmentLocationDocument.destroy.mutation,
  queryKey: Api.EquipmentLocationDocument.list.queryKey,
  parentField: 'location',
}
