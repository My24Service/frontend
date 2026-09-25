import {
  useQueryErrorToast,
  useQueryOf,
} from '@/features/forms'
import type { OwnedRecord, OwnedValues, OwnerKind } from './owner-kind'

/** An autocomplete row from either owner endpoint: they share id/name/city. */
export type OwnerOption = Api.CustomerAutocomplete | Api.BranchAutocomplete

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
 * the second is the form's own `values[wireKind]`, which goes in the body, and
 * a pinned role must send it even though nothing on screen shows where it came
 * from. This composable writes that slot itself - the form's values are the one
 * place that knows the owner in all three cases, seeded from the record on an
 * edit and filled here for a pick or a pinned role.
 */
export function useFormOwner(options: {
  wireKind: Ref<OwnerKind>
  chooses: Ref<boolean>
  /** A create has no owner on the record, so a pinned role reads its own. */
  isCreate: Ref<boolean>
  /** The record an edit was filled from; its owner key is the one read back. */
  record: Ref<OwnedRecord | undefined>
  /** The form's values, whose owner slot is written when the owner resolves. */
  values: Ref<OwnedValues>
  /** Focused after a pick, so the user lands on the first field to type in. */
  nameInput?: Ref<{focus?: () => void} | null>
}) {
  const {wireKind, chooses, isCreate, record, values, nameInput} = options

  const owner = ref<OwnerRecord | null>(null)
  const searchTerm = ref('')
  const debouncedTerm = refDebounced(searchTerm, 500)
  const isBranchOwner = computed(() => wireKind.value === 'branch')

  const ownerLabel = computed(() => (isBranchOwner.value ? $trans('Branch') : $trans('Customer')))
  const fetchError = () => (isBranchOwner.value
    ? $trans('Error fetching branches')
    : $trans('Error fetching customers'))

  /** The wire id: the owner slot this tenant's variant carries, or null until there is one. */
  const ownerId = computed<number | null>(() => values.value[wireKind.value])

  function applyId(id: number) {
    values.value[wireKind.value] = id || null
  }

  // The picker's type-ahead. An empty term asks nothing: VueMultiselect calls
  // `search-change` with '' when the menu opens or the field is cleared, and the
  // endpoints answer that with every row the tenant has - the placeholder says
  // "type to search", so it stays empty until there is something to search for.
  const searchQuery = useQueryOf<OwnerOption[]>(() => ({
    ...(isBranchOwner.value
      ? Api.CompanyBranchAutocomplete.list.options({query: {q: debouncedTerm.value}})
      : Api.CustomerCustomerAutocomplete.list.options({query: {q: debouncedTerm.value}})),
    enabled: chooses.value && debouncedTerm.value.length > 0,
  }))

  // The pinned roles' own owner, on a create: a chooser picks one instead, and
  // an edit reads the one the record already names.
  const myQuery = useQueryOf<OwnerRecord & {id: number}>(() => ({
    ...(isBranchOwner.value ? Api.CompanyBranchMy.retrieve.options() : Api.CustomerCustomerMy.retrieve.options()),
    enabled: isCreate.value && !chooses.value,
  }))

  // The owner an edit already names, fetched so the read-only block shows an
  // address rather than an id.
  const namedOwnerId = computed(() => record.value?.[wireKind.value] ?? null)
  const namedOwnerQuery = useQueryOf<OwnerRecord>(() => ({
    ...(isBranchOwner.value
      ? Api.CompanyBranch.retrieve.options({path: {id: namedOwnerId.value ?? 0}})
      : Api.CustomerCustomer.retrieve.options({path: {id: namedOwnerId.value ?? 0}})),
    enabled: namedOwnerId.value != null,
  }))

  useQueryErrorToast(searchQuery.error, fetchError)
  useQueryErrorToast(myQuery.error, fetchError)
  useQueryErrorToast(namedOwnerQuery.error, fetchError)

  // A pinned role's id, written into the body once the read answers.
  watch(
    () => myQuery.data.value,
    (data) => {
      if (!chooses.value && data?.id != null) applyId(data.id)
      if (data) owner.value = data
    },
    {immediate: true},
  )

  // An edit's owner, for the read-only block only - the id is already in the
  // record the form was filled from.
  watch(
    () => namedOwnerQuery.data.value,
    (data) => {
      if (data) owner.value = data
    },
  )

  /** A chooser's pick: into the body, onto the read-only block, and on to the name. */
  function selectOwner(option: OwnerOption) {
    applyId(option.id)
    owner.value = option
    nameInput?.value?.focus?.()
  }

  /** True while a pinned role's own owner is still being read. */
  const isResolvingOwner = computed(() =>
    isCreate.value && !chooses.value && myQuery.isLoading.value)

  return {
    wireKind,
    chooses,
    owner,
    ownerId,
    ownerLabel,
    searchTerm,
    options: computed<OwnerOption[]>(() => searchQuery.data.value ?? []),
    isSearching: computed(() => searchQuery.isFetching.value),
    isResolvingOwner,
    selectOwner,
  }
}

/** What `useFormOwner` hands a form: the picker's state, and the pick itself. */
export type FormOwner = ReturnType<typeof useFormOwner>
