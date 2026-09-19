import {
  companyBranchMyRetrieveOptions,
  customerCustomerRetrieveOptions,
  equipmentEquipmentRetrieveOptions,
  quotationQuotationRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import { useAuthStore } from '@/features/auth'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { $trans } from '@/services/i18n'
import { useMainStore } from '@/stores/main'
import type { FormRole, OrderFormValues, OrderlineRow } from './schemas'
import { fillBranch, fillCustomer } from './use-order-pickers'

/** What the maintenance contract view stages in the store before opening the form. */
type MaintenanceSeed = {
  maintenanceEquipment: Array<{equipment_pk: number; remarks?: string; amount?: number}>
  customer_pk: number
  contract_pk: number
}

/**
 * What a new order starts out with, by who opens the form and from where:
 *
 * - a branch employee's own branch, and a customer user's own company, are
 *   read and copied onto the contact block the way a planning user's picker
 *   would;
 * - from a quotation, its customer and reference;
 * - for a maintenance contract, the customer and the equipment rows the
 *   contract view staged in the store, each staged as an orderline.
 *
 * Every read is gated on the case it serves; an edit seeds nothing.
 */
export function useOrderSeeds(
  order: Ref<OrderFormValues>,
  options: {
    role: () => FormRole
    isCreate: () => boolean
    fromQuotation: () => boolean
    quotationId: () => string | number | null
    maintenance: () => boolean
    stageOrderline: (row: OrderlineRow) => void
  },
) {
  const authStore = useAuthStore()
  const mainStore = useMainStore()

  const myBranchQuery = useQuery(() => ({
    ...companyBranchMyRetrieveOptions(),
    enabled: options.role() === 'employee' && options.isCreate(),
  }))
  useQueryErrorToast(myBranchQuery.error, $trans('Error fetching branch'))
  watch(() => myBranchQuery.data.value, (branch) => {
    if (branch) fillBranch(order.value, branch)
  }, {immediate: true})

  const ownCustomerId = computed(() => {
    const user = authStore.userInfo as {customer_user?: {customer?: number}} | null
    return user?.customer_user?.customer ?? null
  })
  const ownCustomerQuery = useQuery(() => ({
    ...customerCustomerRetrieveOptions({path: {id: ownCustomerId.value as number}}),
    enabled: options.role() === 'customer' && options.isCreate() && ownCustomerId.value !== null,
  }))
  useQueryErrorToast(ownCustomerQuery.error, $trans('Error fetching customer'))
  watch(() => ownCustomerQuery.data.value, (customer) => {
    if (customer) fillCustomer(order.value, customer)
  }, {immediate: true})

  const quotationQuery = useQuery(() => ({
    ...quotationQuotationRetrieveOptions({path: {id: Number(options.quotationId())}}),
    enabled: options.fromQuotation() && options.quotationId() !== null && options.isCreate(),
  }))
  useQueryErrorToast(quotationQuery.error, $trans('Error fetching quotation'))
  const quotationCustomerQuery = useQuery(() => ({
    ...customerCustomerRetrieveOptions({path: {id: quotationQuery.data.value?.customer_relation as number}}),
    enabled: quotationQuery.data.value?.customer_relation != null,
  }))
  watch(() => quotationCustomerQuery.data.value, (customer) => {
    const quotation = quotationQuery.data.value
    if (!customer || !quotation) return
    fillCustomer(order.value, customer)
    order.value.quotation = quotation.id
    order.value.order_reference = quotation.quotation_reference ?? ''
  }, {immediate: true})

  const maintenanceSeed = computed<MaintenanceSeed | null>(() => {
    if (!options.maintenance() || !options.isCreate()) return null
    const staged = mainStore.getMaintenanceEquipment as unknown
    return staged && typeof staged === 'object' && 'customer_pk' in staged ? (staged as MaintenanceSeed) : null
  })
  const maintenanceCustomerQuery = useQuery(() => ({
    ...customerCustomerRetrieveOptions({path: {id: maintenanceSeed.value?.customer_pk as number}}),
    enabled: maintenanceSeed.value !== null,
  }))
  watch(() => maintenanceCustomerQuery.data.value, (customer) => {
    if (customer) fillCustomer(order.value, customer)
  }, {immediate: true})
  // One read per staged row; the set is fixed for the life of the form.
  for (const seedRow of maintenanceSeed.value?.maintenanceEquipment ?? []) {
    const equipmentQuery = useQuery(() => equipmentEquipmentRetrieveOptions({path: {id: seedRow.equipment_pk}}))
    watch(() => equipmentQuery.data.value, (equipment) => {
      if (!equipment || !maintenanceSeed.value) return
      options.stageOrderline({
        product: equipment.name,
        location: equipment.location_name ?? '',
        remarks: seedRow.remarks ?? '',
        equipment: equipment.id,
        equipment_location: equipment.location ?? null,
        amount: seedRow.amount ?? null,
        maintenance_contract: maintenanceSeed.value.contract_pk,
      })
    }, {immediate: true})
  }

  return {
    isLoading: computed(() => myBranchQuery.isLoading.value || ownCustomerQuery.isLoading.value),
  }
}
