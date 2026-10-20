import type { ListQueryOptions } from '@/features/table'

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
 * same for all of them, so the branch is resolved by the caller and the panel
 * is written against one contract rather than
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
 * this exists to accept. The call sites are concrete, so the `any` never
 * reaches a consumer.
 */
export interface DocumentResource {
  // The generated `.options()` call's queryKey/queryFn pair (see
  // ListQueryOptions): each document endpoint's concrete options type
  // differs, but all of them carry these two.
  list: (parentId: number) => ListQueryOptions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create: () => UseMutationOptions<any, any, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update: () => UseMutationOptions<any, any, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  destroy: () => UseMutationOptions<any, any, any>
  queryKey: () => readonly unknown[]
  /** The request body field that carries the parent id, e.g. `equipment`. */
  parentField: string
}

/**
 * Read and write one record's documents.
 *
 * `parentId` is null until a create form has created the record the documents
 * hang off, and the read stays disabled until it is not: an unparented panel
 * has nothing to ask for.
 */
export function useDocumentCollection(
  resource: DocumentResource,
  parentId: Ref<number | null>,
): DocumentCollection {
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
    isLoading: computed(() => listQuery.isLoading.value),
    error: computed(() => listQuery.error.value),
    refetch: () => listQuery.refetch(),
    invalidate: () => queryClient.invalidateQueries({queryKey: resource.queryKey(), refetchType: 'none'}),
    create: async (row, parent) =>
      (await createMutation.mutateAsync({body: {...row, [resource.parentField]: parent}})) as DocumentRow,
    update: async (row, parent) =>
      (await updateMutation.mutateAsync({
        path: {id: row.id as number},
        body: {...row, [resource.parentField]: parent},
      })) as DocumentRow,
    destroy: async (id) => {
      await destroyMutation.mutateAsync({path: {id}})
    },
  }
}
