import { computed, ref, type Ref } from 'vue'
import { refDebounced } from '@vueuse/core'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'

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
import type { EngineerForSelect } from '@/api/types.gen'
import { useAuthStore } from '@/features/auth'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { $trans, errorToast } from '@/services/i18n'
import { useMainStore } from '@/stores/main'
import type { OrderFormValues } from './schemas'

const DEBOUNCE_MS = 500

/**
 * The fields the contact block copies from a customer or branch — present on
 * the autocomplete rows and on the full records alike, each field optional
 * or nullable in one shape or the other.
 */
type ContactLike = {
  id: number
  name?: string | null
  address?: string | null
  city?: string | null
  postal?: string | null
  country_code?: string | null
  tel?: string | null
  mobile?: string | null
  email?: string | null
  contact?: string | null
}
export type CustomerLike = ContactLike & {customer_id?: string | null; remarks?: string | null}
export type BranchLike = ContactLike

/**
 * Who the order is for. A tenant with branches orders for a branch, one
 * without for a customer; the equipment and location pickers are scoped
 * to whichever is chosen.
 */
export function useOwnerPickers(values: Ref<OrderFormValues>, options: {hasBranches: () => boolean}) {
  const customerTerm = ref('')
  const customerQueryTerm = refDebounced(customerTerm, DEBOUNCE_MS)
  const customerQuery = useQuery(() => ({
    ...customerCustomerAutocompleteListOptions({query: {q: customerQueryTerm.value}}),
    enabled: !options.hasBranches() && customerQueryTerm.value.length > 0,
  }))
  const customers = computed(() => customerQuery.data.value ?? [])
  useQueryErrorToast(customerQuery.error, $trans('Error fetching customers'))

  const branchTerm = ref('')
  const branchQueryTerm = refDebounced(branchTerm, DEBOUNCE_MS)
  const branchQuery = useQuery(() => ({
    ...companyBranchAutocompleteListOptions({query: {q: branchQueryTerm.value}}),
    enabled: options.hasBranches() && branchQueryTerm.value.length > 0,
  }))
  const branches = computed(() => branchQuery.data.value ?? [])
  useQueryErrorToast(branchQuery.error, $trans('Error fetching branches'))

  function addressLabel({name, address, city}: {name?: string | null; address?: string | null; city?: string | null}) {
    return `${name ?? ''} - ${address ?? ''} - ${city ?? ''}`
  }

  /** Copy a chosen customer onto the order's contact block. */
  function fillCustomer(customer: CustomerLike) {
    values.value.customer_relation = customer.id
    values.value.customer_id = customer.customer_id ?? ''
    values.value.order_name = customer.name ?? ''
    values.value.order_address = customer.address ?? ''
    values.value.order_city = customer.city ?? ''
    values.value.order_postal = customer.postal ?? ''
    values.value.order_country_code = customer.country_code ?? values.value.order_country_code
    values.value.order_tel = customer.tel ?? ''
    values.value.order_mobile = customer.mobile ?? ''
    values.value.order_email = customer.email ?? ''
    values.value.order_contact = customer.contact ?? ''
    values.value.customer_remarks = customer.remarks ?? ''
  }

  /** Copy a chosen branch onto the order's contact block. */
  function fillBranch(branch: BranchLike) {
    values.value.branch = branch.id
    values.value.order_name = branch.name ?? ''
    values.value.order_address = branch.address ?? ''
    values.value.order_city = branch.city ?? ''
    values.value.order_postal = branch.postal ?? ''
    values.value.order_country_code = branch.country_code ?? values.value.order_country_code
    values.value.order_tel = branch.tel ?? ''
    values.value.order_mobile = branch.mobile ?? ''
    values.value.order_email = branch.email ?? ''
    values.value.order_contact = branch.contact ?? ''
  }

  return {customerTerm, customers, branchTerm, branches, addressLabel, fillCustomer, fillBranch}
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

  const equipmentTerm = ref('')
  const equipmentQueryTerm = refDebounced(equipmentTerm, DEBOUNCE_MS)
  const equipmentQuery = useQuery(() => ({
    ...equipmentEquipmentAutocompleteListOptions({query: {q: equipmentQueryTerm.value, ...owner.value}}),
    enabled: ownerChosen.value && equipmentQueryTerm.value.length > 0,
  }))
  const equipmentOptions = computed<EquipmentOption[]>(() => equipmentQuery.data.value ?? [])
  useQueryErrorToast(equipmentQuery.error, $trans('Error searching equipment'))

  const locationTerm = ref('')
  const locationQueryTerm = refDebounced(locationTerm, DEBOUNCE_MS)
  const locationQuery = useQuery(() => ({
    ...equipmentLocationAutocompleteListOptions({query: {q: locationQueryTerm.value, ...owner.value}}),
    enabled: ownerChosen.value && locationQueryTerm.value.length > 0,
  }))
  const locationOptions = computed(() => locationQuery.data.value ?? [])
  useQueryErrorToast(locationQuery.error, $trans('Error searching location'))

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
    equipmentTerm,
    equipmentOptions,
    locationTerm,
    locationOptions,
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
 * read and the picker narrows it client-side — the legacy searched the
 * user list per keystroke through a query the schema does not declare.
 */
export function useEngineerOptions(enabled: () => boolean) {
  const query = useQuery(() => ({
    ...companyEngineerListForSelectListOptions(),
    enabled: enabled(),
  }))
  const engineers = computed<EngineerForSelect[]>(() => query.data.value ?? [])
  useQueryErrorToast(query.error, $trans('Error searching engineers'))
  return {engineers}
}

/** The sales users whose e-mail goes on the order's extra recipients. */
export function useSalesUserOptions(enabled: () => boolean) {
  const term = ref('')
  const queryTerm = refDebounced(term, DEBOUNCE_MS)
  const query = useQuery(() => ({
    ...companySalesuserListOptions({query: {q: queryTerm.value}}),
    enabled: enabled() && queryTerm.value.length > 0,
  }))
  const salesUsers = computed(() => query.data.value?.results ?? [])
  useQueryErrorToast(query.error, $trans('Error fetching sales users'))
  return {salesUserTerm: term, salesUsers}
}
