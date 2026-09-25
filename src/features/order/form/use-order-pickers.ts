import type { Simplify } from 'type-fest'

import {
  useSearch,
  useQueryErrorToast,
} from '@/features/forms'
import type { OrderContactBlock, OrderFormValues } from './schemas'

/** The read's rows are the options as they are. */
const asIs = <T>(rows: T[]) => rows

type Like<T extends { id: unknown }> = Simplify<Partial<Omit<T, 'value'>> & Pick<T, 'id'>>
export type CustomerLike = Like<Api.CustomerAutocomplete>
export type BranchLike = Like<Api.BranchAutocomplete>

/**
 * The owner picker: a tenant with branches orders for a branch, one without
 * for a customer, and the equipment and location pickers are scoped to
 * whichever is chosen. Which of the two it is decides the search and the
 * fill together, so a pick lands typed on its own fill — the template binds
 * `options` and `select` without naming either shape. A tenant's shape does
 * not change while the form is open, so it is read once.
 */
export function useOwnerPicker<TValues extends OrderContactBlock>(values: Ref<TValues>, hasBranches: boolean) {
  if (hasBranches) {
    const {term, options} = useSearch(
      (q) => Api.CompanyBranchAutocomplete.list.options({query: {q}}),
      () => true,
      $trans('Error fetching branches'),
      asIs,
    )
    // The tenant's shape does not change while the form is open, so the
    // branch path only runs where the values carry a branch: the cast names
    // the `hasBranches` invariant instead of demanding the full form values
    // from every caller.
    return {term, options, select: (branch: typeof options['value'][number]) => fillBranch(values.value as TValues & {branch: number | null}, branch)}
  }
  const {term, options} = useSearch(
    (q) => Api.CustomerCustomerAutocomplete.list.options({query: {q}}),
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
export function fillCustomer<TValues extends OrderContactBlock>(values: TValues, customer: CustomerLike) {
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
export function fillBranch<TValues extends OrderContactBlock & {branch: number | null}>(values: TValues, branch: BranchLike) {
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
    (q) => Api.EquipmentEquipmentAutocomplete.list.options({query: {q, ...owner.value}}),
    () => ownerChosen.value,
    $trans('Error searching equipment'),
    asIs,
  )
  const locations = useSearch(
    (q) => Api.EquipmentLocationAutocomplete.list.options({query: {q, ...owner.value}}),
    () => ownerChosen.value,
    $trans('Error searching location'),
    asIs,
  )

  const isPlanningUser = computed(() => authStore.isPlanning || authStore.isAdmin)

  function ownerBody() {
    if (options.hasBranches()) return {branch: isPlanningUser.value ? (values.value.branch ?? 0) : 0}
    return {customer: isPlanningUser.value ? (values.value.customer_relation ?? 0) : 0}
  }

  const quickCreateEquipment = useMutation({...Api.EquipmentEquipmentCreateQuick.create.mutation()})
  const quickCreateLocation = useMutation({...Api.EquipmentLocationCreateQuick.create.mutation()})

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
    ...Api.CompanyEngineerListForSelect.list.options(),
    enabled: enabled(),
  }))
  const engineers = computed(() => query.data.value ?? [])
  useQueryErrorToast(query.error, $trans('Error searching engineers'))
  return {engineers}
}

/** The sales users whose e-mail goes on the order's extra recipients. */
export function useSalesUserOptions(enabled: () => boolean) {
  const salesUsers = useSearch(
    (q) => Api.CompanySalesuser.list.options({query: {q}}),
    enabled,
    $trans('Error fetching sales users'),
    (page) => page.results ?? [],
  )
  return {salesUserTerm: salesUsers.term, salesUsers: salesUsers.options}
}
