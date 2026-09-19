import { useAuthStore } from '@/features/auth/store'
import { useMainStore } from '@/stores/main'

/** Which of the two owner foreign keys a record hangs off. */
export type OwnerKind = 'customer' | 'branch'

/**
 * The two owner slots every owned form holds.
 *
 * The create body is a union - `{branch, …}` or `{customer, …}` - but a form
 * keeps both, because which one applies is a property of the tenant rather
 * than of the field; the parse resolves the union and drops the other slot.
 */
export interface OwnedValues {
  customer: number | null
  branch: number | null
}

/** The two owner foreign keys an owned record carries, as the API reads them. */
export interface OwnedRecord {
  customer?: number | null
  branch?: number | null
}

export interface OwnerContext {
  /**
   * The foreign key this tenant's request variant carries.
   *
   * The backend documents the create/update bodies as a `oneOf` - `{branch, …}`
   * or `{customer, …}` - because the viewset picks its serializer from
   * `member.has_branches` inside the method body, and says the client should
   * "keep the pair and select per tenant at runtime". This is that selection:
   * for a branch tenant the branch variant, otherwise the customer one.
   *
   * It is always one of the two, including for the roles that do not choose:
   * an employee's and a customer user's requests carry the key too, and the
   * value is the one the API is going to use anyway.
   */
  wireKind: ComputedRef<OwnerKind>
  /**
   * Whether this user picks the owner.
   *
   * A branch employee and a customer user are pinned to their own branch or
   * customer by the API, which overwrites whatever the request carried, so
   * their forms show no picker.
   */
  chooses: ComputedRef<boolean>
}

/**
 * Which owner a new equipment/location/building belongs to, and who decides.
 *
 * The columns a *list* shows follow a different matrix - a customer user sees
 * no owner column, and neither does an employee, but a branch tenant's employee
 * still has its rows scoped by branch. Do not reuse this for a table.
 */
export function useOwnerContext(): OwnerContext {
  const mainStore = useMainStore()
  const authStore = useAuthStore()

  return {
    wireKind: computed<OwnerKind>(() => (mainStore.getMemberHasBranches ? 'branch' : 'customer')),
    chooses: computed(() => (mainStore.getMemberHasBranches ? !authStore.isEmployee : !authStore.isCustomer)),
  }
}
