import { computed, ref, watch, type Ref } from 'vue'
import { refDebounced } from '@vueuse/core'
import { useQuery } from '@tanstack/vue-query'
import {
  companyBranchAutocompleteListOptions,
  companyBranchMyRetrieveOptions,
  companyBranchRetrieveOptions,
  customerCustomerAutocompleteListOptions,
  customerCustomerMyRetrieveOptions,
  customerCustomerRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { BranchAutocomplete, CustomerAutocomplete } from '@/api/types.gen'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { $trans } from '@/services/i18n'
import type { OwnerKind } from './owner-kind'

/** An autocomplete row from either owner endpoint: they share id/name/city. */
export type OwnerOption = CustomerAutocomplete | BranchAutocomplete

/** What the picked owner's read-only block shows. */
export interface OwnerRecord {
  name?: string | null
  address?: string | null
  city?: string | null
  country_code?: string | null
}

/**
 * The owner a form is filling in: the type-ahead, and the record it resolves to.
 *
 * Equipment, location and building all hang off a customer or a branch, and all
 * three forms arrive at that owner the same three ways, so the whole concern
 * lives here rather than three times over:
 *
 * - a user who chooses picks one from a debounced type-ahead;
 * - a branch employee or a customer user is pinned by the API, and reads their
 *   own owner instead;
 * - an edit reads the owner the record already names.
 *
 * The display record and the wire id are separate on purpose. The first is what
 * the read-only block renders, and only exists when there is something to show;
 * the second is what goes in the body, and a pinned role must send it even
 * though nothing on screen shows where it came from.
 */
export function useFormOwner(options: {
  wireKind: Ref<OwnerKind>
  chooses: Ref<boolean>
  /** A create has no owner on the record, so a pinned role reads its own. */
  isCreate: Ref<boolean>
  /** The owner foreign key the record already carries, on an edit. */
  recordId?: Ref<number | null | undefined>
  /** Filled in when the owner resolves, so the body carries the key. */
  applyId: (id: number) => void
}) {
  const {wireKind, chooses, isCreate, recordId, applyId} = options

  const owner = ref<OwnerRecord | null>(null)
  const searchTerm = ref('')
  const debouncedTerm = refDebounced(searchTerm, 500)
  const isBranchOwner = computed(() => wireKind.value === 'branch')

  // The picker's type-ahead. An empty term asks nothing: VueMultiselect calls
  // `search-change` with '' when the menu opens or the field is cleared, and the
  // endpoints answer that with every row the tenant has - the placeholder says
  // "type to search", so it stays empty until there is something to search for.
  const customerSearchQuery = useQuery(() => ({
    ...customerCustomerAutocompleteListOptions({query: {q: debouncedTerm.value}}),
    enabled: chooses.value && wireKind.value === 'customer' && debouncedTerm.value.length > 0,
  }))
  const branchSearchQuery = useQuery(() => ({
    ...companyBranchAutocompleteListOptions({query: {q: debouncedTerm.value}}),
    enabled: chooses.value && wireKind.value === 'branch' && debouncedTerm.value.length > 0,
  }))

  useQueryErrorToast(customerSearchQuery.error, $trans('Error fetching customers'))
  useQueryErrorToast(branchSearchQuery.error, $trans('Error fetching branches'))

  // The pinned roles' own owner, on a create: a chooser picks one instead, and
  // an edit reads the one the record already names.
  const myBranchQuery = useQuery(() => ({
    ...companyBranchMyRetrieveOptions(),
    enabled: isCreate.value && !chooses.value && wireKind.value === 'branch',
  }))
  const myCustomerQuery = useQuery(() => ({
    ...customerCustomerMyRetrieveOptions(),
    enabled: isCreate.value && !chooses.value && wireKind.value === 'customer',
  }))

  // The owner an edit already names, fetched so the read-only block shows an
  // address rather than an id. Two queries gated by kind, not one ternary: a
  // ternary between two generated `*Options` is a union `useQuery` rejects.
  const namedOwnerId = computed(() => recordId?.value ?? 0)
  const branchOwnerQuery = useQuery(() => ({
    ...companyBranchRetrieveOptions({path: {id: namedOwnerId.value}}),
    enabled: isBranchOwner.value && recordId?.value != null,
  }))
  const customerOwnerQuery = useQuery(() => ({
    ...customerCustomerRetrieveOptions({path: {id: namedOwnerId.value}}),
    enabled: !isBranchOwner.value && recordId?.value != null,
  }))
  const ownerDetailQuery = computed(() => (isBranchOwner.value ? branchOwnerQuery : customerOwnerQuery))

  useQueryErrorToast(myBranchQuery.error, $trans('Error fetching branches'))
  useQueryErrorToast(myCustomerQuery.error, $trans('Error fetching customers'))
  useQueryErrorToast(branchOwnerQuery.error, $trans('Error fetching branches'))
  useQueryErrorToast(customerOwnerQuery.error, $trans('Error fetching customers'))

  const searchQuery = computed(() => (wireKind.value === 'branch' ? branchSearchQuery : customerSearchQuery))
  const myQuery = computed(() => (wireKind.value === 'branch' ? myBranchQuery : myCustomerQuery))

  // A pinned role's id, written into the body once the read answers.
  watch(
    () => myQuery.value.data.value,
    (data) => {
      if (!chooses.value) applyId((data as {id: number} | undefined)?.id ?? 0)
      if (data) owner.value = data as unknown as OwnerRecord
    },
    {immediate: true},
  )

  // An edit's owner, for the read-only block only - the id is already in the
  // record the form was filled from.
  watch(
    () => ownerDetailQuery.value.data.value,
    (data) => {
      if (data) owner.value = data as unknown as OwnerRecord
    },
  )

  function selectOption(option: OwnerOption) {
    applyId(option.id)
    owner.value = option
  }

  /** True while a pinned role's own owner is still being read. */
  const isResolvingOwner = computed(() =>
    isCreate.value && !chooses.value && myQuery.value.isLoading.value)

  return {
    owner,
    searchTerm,
    options: computed<OwnerOption[]>(() => searchQuery.value.data.value ?? []),
    isSearching: computed(() => searchQuery.value.isFetching.value),
    isResolvingOwner,
    selectOption,
  }
}

/** "Acme - Utrecht", the line both pickers show for an option. */
export function ownerOptionLabel(option: OwnerOption): string {
  return `${option.name} - ${option.city ?? ''}`
}
