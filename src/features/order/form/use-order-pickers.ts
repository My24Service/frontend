import { computed, ref, type Ref } from 'vue'
import { refDebounced } from '@vueuse/core'
import { useMutation, useQuery, type DefaultError, type UseQueryOptions } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'
import { useToast } from 'bootstrap-vue-next'
import type { Simplify } from 'type-fest'

import {
  companyBranchAutocompleteListOptions,
  companyEngineerListForSelectListOptions,
  companySalesuserListOptions,
  customerCustomerAutocompleteListOptions,
  equipmentEquipmentAutocompleteListOptions,
  equipmentEquipmentCreateQuickCreateMutation,
  equipmentLocationAutocompleteListOptions,
  equipmentLocationCreateQuickCreateMutation,
} from '@/api/@tanstack/vue-query.gen'
import type { BranchAutocomplete, CustomerAutocomplete } from '@/api/types.gen'
import { useAuthStore } from '@/features/auth'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { $trans, errorToast } from '@/services/i18n'
import { useMainStore } from '@/stores/main'
import type { OrderFormValues } from './schemas'

const DEBOUNCE_MS = 500

/**
 * A search-as-you-type picker's read: the term typed, debounced half a
 * second, then the list op for it — only while there is a term and the
 * picker applies. What comes back is the options; a failure toasts.
 */
function useSearch<TData, TKey extends readonly unknown[], TOption>(
  optionsFor: (term: string) => UseQueryOptions<TData, AxiosError<DefaultError>, TData, TData, TKey>,
  enabled: () => boolean,
  errorCopy: string,
  results: (data: TData) => TOption[],
) {
  const term = ref('')
  const queryTerm = refDebounced(term, DEBOUNCE_MS)
  const query = useQuery(() => ({
    ...optionsFor(queryTerm.value),
    enabled: enabled() && queryTerm.value.length > 0,
  }))
  useQueryErrorToast(query.error, errorCopy)
  const options = computed<TOption[]>(() => (query.data.value == null ? [] : results(query.data.value)))
  return {term, options}
}

/** The read's rows are the options as they are. */
const asIs = <T>(rows: T[]) => rows

type Like<T extends { id: unknown }> = Simplify<Partial<Omit<T, 'value'>> & Pick<T, 'id'>>
export type CustomerLike = Like<CustomerAutocomplete>
export type BranchLike = Like<BranchAutocomplete>

/**
 * The owner picker: a tenant with branches orders for a branch, one without
 * for a customer, and the equipment and location pickers are scoped to
 * whichever is chosen. Which of the two it is decides the search and the
 * fill together, so a pick lands typed on its own fill — the template binds
 * `options` and `select` without naming either shape. A tenant's shape does
 * not change while the form is open, so it is read once.
 */
export function useOwnerPicker(values: Ref<OrderFormValues>, hasBranches: boolean) {
  if (hasBranches) {
    const {term, options} = useSearch(
      (q) => companyBranchAutocompleteListOptions({query: {q}}),
      () => true,
      $trans('Error fetching branches'),
      asIs,
    )
    return {term, options, select: (branch: typeof options['value'][number]) => fillBranch(values.value, branch)}
  }
  const {term, options} = useSearch(
    (q) => customerCustomerAutocompleteListOptions({query: {q}}),
    () => true,
    $trans('Error fetching customers'),
    asIs,
  )
  return {term, options, select: (customer: typeof options['value'][number]) => fillCustomer(values.value, customer)}
}

/** How the owner pickers label a customer or branch: name, address, city. */
export function addressLabel({name, address, city}: {name?: string | null; address?: string | null; city?: string | null}) {
  return `${name ?? ''} - ${address ?? ''} - ${city ?? ''}`
}

/** Copy a chosen customer onto the order's contact block. */
export function fillCustomer(values: OrderFormValues, customer: CustomerLike) {
  values.customer_relation = customer.id
  values.customer_id = customer.customer_id ?? ''
  values.order_name = customer.name ?? ''
  values.order_address = customer.address ?? ''
  values.order_city = customer.city ?? ''
  values.order_postal = customer.postal ?? ''
  values.order_country_code = customer.country_code ?? values.order_country_code
  values.order_tel = customer.tel ?? ''
  values.order_mobile = customer.mobile ?? ''
  values.order_email = customer.email ?? ''
  values.order_contact = customer.contact ?? ''
  values.customer_remarks = customer.remarks ?? ''
}

/** Copy a chosen branch onto the order's contact block. */
export function fillBranch(values: OrderFormValues, branch: BranchLike) {
  values.branch = branch.id
  values.order_name = branch.name ?? ''
  values.order_address = branch.address ?? ''
  values.order_city = branch.city ?? ''
  values.order_postal = branch.postal ?? ''
  values.order_country_code = branch.country_code ?? values.order_country_code
  values.order_tel = branch.tel ?? ''
  values.order_mobile = branch.mobile ?? ''
  values.order_email = branch.email ?? ''
  values.order_contact = branch.contact ?? ''
}

export interface EquipmentOption {
  id: number
  name: string | null
  location?: {id: number; name: string} | null
}

/**
 * The equipment and location pickers on an orderline, scoped to the
 * order's owner, with the quick-create modals a tenant may allow.
 *
 * Scoping: a planning user searches by the chosen customer or branch; a
 * branch employee's own scope is implied by their session, so their search
 * carries no owner. Quick-create names the owner the same way, and a
 * non-planning user sends `0` — the backend fills in their own.
 */
export function useEquipmentPickers(
  values: Ref<OrderFormValues>,
  options: {hasBranches: () => boolean; scopedByOwner: () => boolean},
) {
  const mainStore = useMainStore()
  const authStore = useAuthStore()
  const {create} = useToast()

  const owner = computed(() => {
    if (!options.scopedByOwner()) return {}
    return options.hasBranches()
      ? {branch: values.value.branch ?? undefined}
      : {customer: values.value.customer_relation ?? undefined}
  })
  const ownerChosen = computed(
    () => !options.scopedByOwner() || (options.hasBranches() ? values.value.branch !== null : values.value.customer_relation !== null),
  )

  const equipment = useSearch(
    (q) => equipmentEquipmentAutocompleteListOptions({query: {q, ...owner.value}}),
    () => ownerChosen.value,
    $trans('Error searching equipment'),
    asIs,
  )
  const locations = useSearch(
    (q) => equipmentLocationAutocompleteListOptions({query: {q, ...owner.value}}),
    () => ownerChosen.value,
    $trans('Error searching location'),
    asIs,
  )

  const isPlanningUser = computed(() => authStore.isPlanning || authStore.isAdmin)

  function ownerBody() {
    if (options.hasBranches()) return {branch: isPlanningUser.value ? (values.value.branch ?? 0) : 0}
    return {customer: isPlanningUser.value ? (values.value.customer_relation ?? 0) : 0}
  }

  const quickCreateEquipment = useMutation({...equipmentEquipmentCreateQuickCreateMutation()})
  const quickCreateLocation = useMutation({...equipmentLocationCreateQuickCreateMutation()})

  async function createEquipment(name: string): Promise<{id: number; name: string} | null> {
    try {
      return await quickCreateEquipment.mutateAsync({body: {name, ...ownerBody()}})
    } catch {
      errorToast(create, $trans('Error adding equipment'))
      return null
    }
  }

  async function createLocation(name: string): Promise<{id: number; name: string} | null> {
    try {
      return await quickCreateLocation.mutateAsync({body: {name, ...ownerBody()}})
    } catch {
      errorToast(create, $trans('Error adding location'))
      return null
    }
  }

  return {
    ownerChosen,
    equipmentTerm: equipment.term,
    equipmentOptions: equipment.options,
    locationTerm: locations.term,
    locationOptions: locations.options,
    createEquipment,
    createLocation,
    canQuickCreateEquipment: computed(() => Boolean(
      options.scopedByOwner()
        ? mainStore.getSettingEquipmentPlanningQuickCreate
        : mainStore.getSettingEquipmentQuickCreate,
    )),
    canQuickCreateLocation: computed(() => Boolean(
      options.scopedByOwner()
        ? mainStore.getSettingEquipmentLocationPlanningQuickCreate
        : mainStore.getSettingEquipmentLocationQuickCreate,
    )),
  }
}

/**
 * The engineers a planning user can assign. The whole select list is one
 * read and the picker narrows it client-side; the list is short enough
 * that a search per keystroke, as the legacy did, bought nothing.
 */
export function useEngineerOptions(enabled: () => boolean) {
  const query = useQuery(() => ({
    ...companyEngineerListForSelectListOptions(),
    enabled: enabled(),
  }))
  const engineers = computed(() => query.data.value ?? [])
  useQueryErrorToast(query.error, $trans('Error searching engineers'))
  return {engineers}
}

/** The sales users whose e-mail goes on the order's extra recipients. */
export function useSalesUserOptions(enabled: () => boolean) {
  const salesUsers = useSearch(
    (q) => companySalesuserListOptions({query: {q}}),
    enabled,
    $trans('Error fetching sales users'),
    (page) => page.results ?? [],
  )
  return {salesUserTerm: salesUsers.term, salesUsers: salesUsers.options}
}
