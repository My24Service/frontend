import { computed, ref, watch, type Ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { UseMutationOptions } from '@tanstack/vue-query'
import {
  customerDocumentCreateMutation,
  customerDocumentDestroyMutation,
  customerDocumentListOptions,
  customerDocumentListQueryKey,
  customerDocumentPartialUpdateMutation,
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

/**
 * One row of a document collection, as the panel edits it.
 *
 * `file` is a base64 data URL while the row is being uploaded and the API's own
 * URL once the server has it - the panel and the collection both have to know
 * which, so the distinction lives on the field rather than in a wrapper.
 */
export interface DocumentRow {
  id?: number
  name?: string | null
  description?: string | null
  file?: string
  url?: string
}

/**
 * What the panel needs from whichever document resource it is showing.
 *
 * Equipment, location and customer documents are three endpoints with three
 * shapes, and only the parent key and the path differ between them. Everything
 * above this seam - the editor, the reconciliation, the reporting - is the
 * same for all of them, so the branch is resolved once here and the panel is
 * written against one contract rather than
 * `EquipmentDocument | LocationDocument | CustomerDocument`.
 */
export interface DocumentCollection {
  /** The server's rows, re-read whenever the parent changes. */
  rows: Ref<DocumentRow[]>
  isLoading: Ref<boolean>
  error: Ref<unknown>
  refetch: () => Promise<unknown>
  invalidate: () => Promise<void>
  create: (row: DocumentRow, parentId: number) => Promise<DocumentRow>
  update: (row: DocumentRow, parentId: number) => Promise<DocumentRow>
  destroy: (id: number) => Promise<void>
}

/**
 * The generated factories for one document resource.
 *
 * `any` on the mutation tuples is the same seam `ServerTable` documents for its
 * `destroyMutation`: each resource's mutation has its own response, error and
 * variables types, and restating them here would reject exactly the factories
 * this exists to accept. The two call sites below are concrete, so the `any`
 * never reaches a consumer.
 */
interface DocumentResource {
  // `any` for the list options as well as the mutations: the resources'
  // query options differ in their query type, and a shared parameter type
  // cannot accept all of them - which is the whole reason the branch lives here
  // instead of in the component.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  list: (parentId: number) => any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create: () => UseMutationOptions<any, any, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update: () => UseMutationOptions<any, any, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  destroy: () => UseMutationOptions<any, any, any>
  queryKey: () => readonly unknown[]
}

const EQUIPMENT_RESOURCE: DocumentResource = {
  list: (parentId) => equipmentEquipmentDocumentListOptions({query: {equipment: parentId}}),
  create: equipmentEquipmentDocumentCreateMutation,
  update: equipmentEquipmentDocumentPartialUpdateMutation,
  destroy: equipmentEquipmentDocumentDestroyMutation,
  queryKey: equipmentEquipmentDocumentListQueryKey,
}

const LOCATION_RESOURCE: DocumentResource = {
  list: (parentId) => equipmentLocationDocumentListOptions({query: {location: parentId}}),
  create: equipmentLocationDocumentCreateMutation,
  update: equipmentLocationDocumentPartialUpdateMutation,
  destroy: equipmentLocationDocumentDestroyMutation,
  queryKey: equipmentLocationDocumentListQueryKey,
}

const CUSTOMER_RESOURCE: DocumentResource = {
  // The panel stages every document for editing and replays the set on save, so
  // it needs the whole collection: a page-1 read would hide the rows past 20 and
  // then never write them. 1000 is the API's own ceiling
  // (`My24Pagination.max_page_size`, my24service `source/apps/core/rest.py:236`),
  // which DRF clamps a larger value down to rather than rejecting it.
  list: (parentId) => customerDocumentListOptions({query: {customer: parentId, page: 1, page_size: 1000}}),
  create: customerDocumentCreateMutation,
  update: customerDocumentPartialUpdateMutation,
  destroy: customerDocumentDestroyMutation,
  queryKey: customerDocumentListQueryKey,
}

const RESOURCES = {
  equipment: EQUIPMENT_RESOURCE,
  location: LOCATION_RESOURCE,
  customer: CUSTOMER_RESOURCE,
} satisfies Record<string, DocumentResource>

/**
 * Read and write one record's documents.
 *
 * `parentId` is null until a create form has created the record the documents
 * hang off, and the read stays disabled until it is not: an unparented panel
 * has nothing to ask for.
 */
export function useDocumentCollection(
  kind: 'equipment' | 'location' | 'customer',
  parentId: Ref<number | null>,
): DocumentCollection {
  const resource = RESOURCES[kind]
  const queryClient = useQueryClient()

  const listQuery = useQuery(() => ({
    ...resource.list(parentId.value as number),
    enabled: parentId.value != null,
  }))

  const createMutation = useMutation(resource.create())
  const updateMutation = useMutation(resource.update())
  const destroyMutation = useMutation(resource.destroy())

  const rows = ref<DocumentRow[]>([])
  watch(listQuery.data, (data) => {
    rows.value = ((data as {results?: DocumentRow[]})?.results ?? [])
  }, {immediate: true})

  return {
    rows,
    isLoading: computed(() => listQuery.isLoading.value) as Ref<boolean>,
    error: computed(() => listQuery.error.value) as Ref<unknown>,
    refetch: () => listQuery.refetch(),
    invalidate: () => queryClient.invalidateQueries({queryKey: resource.queryKey(), refetchType: 'none'}),
    create: async (row, parent) =>
      (await createMutation.mutateAsync({body: {...row, [kind]: parent}})) as DocumentRow,
    update: async (row, parent) =>
      (await updateMutation.mutateAsync({
        path: {id: row.id as number},
        body: {...row, [kind]: parent},
      })) as DocumentRow,
    destroy: async (id) => {
      await destroyMutation.mutateAsync({path: {id}})
    },
  }
}
