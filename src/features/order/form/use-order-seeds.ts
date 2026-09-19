import { orderOrderNewRetrieveOptions } from '@/api/@tanstack/vue-query.gen'
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
 * What a new order starts out with, by who opens the form and from where, in
 * one seed read:
 *
 * - a branch employee's own branch, and a customer user's own company, are
 *   read and copied onto the contact block the way a planning user's picker
 *   would;
 * - from a quotation, its customer and reference;
 * - for a maintenance contract, the customer and the equipment rows the
 *   contract view staged in the store, each staged as an orderline.
 *
 * A planning user's blank create seeds nothing, so it issues no read. An
 * edit seeds nothing either.
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
  const mainStore = useMainStore()

  const maintenanceSeed = computed<MaintenanceSeed | null>(() => {
    if (!options.maintenance() || !options.isCreate()) return null
    const staged = mainStore.getMaintenanceEquipment as unknown
    return staged && typeof staged === 'object' && 'customer_pk' in staged ? (staged as MaintenanceSeed) : null
  })

  const fromQuotationId = computed(() =>
    options.fromQuotation() && options.quotationId() !== null && options.isCreate()
      ? Number(options.quotationId())
      : null,
  )

  const seedQuery = useQuery(() => ({
    ...orderOrderNewRetrieveOptions({
      query: {
        ...(fromQuotationId.value !== null ? {from_quotation: fromQuotationId.value} : {}),
        ...(maintenanceSeed.value !== null
          ? {
              maintenance_customer: maintenanceSeed.value.customer_pk,
              ...(maintenanceSeed.value.maintenanceEquipment.length > 0
                ? {equipment: maintenanceSeed.value.maintenanceEquipment.map((row) => row.equipment_pk)}
                : {}),
            }
          : {}),
      },
    }),
    enabled: options.isCreate() && (
      options.role() !== 'planning' || fromQuotationId.value !== null || maintenanceSeed.value !== null
    ),
  }))
  useQueryErrorToast(seedQuery.error, $trans('Error fetching order'))

  watch(() => seedQuery.data.value, (seed) => {
    if (!seed) return
    if (seed.branch) fillBranch(order.value, seed.branch)
    if (seed.customer) fillCustomer(order.value, seed.customer)
    if (seed.quotation) {
      order.value.quotation = seed.quotation.id
      order.value.order_reference = seed.quotation.quotation_reference ?? ''
    }
    // One staged row per equipment the seed answers with; the remarks, the
    // amount and the contract are the store's, the product and location the
    // seed's.
    if (seed.equipment.length > 0 && maintenanceSeed.value) {
      const staged = maintenanceSeed.value
      const byEquipment = new Map(staged.maintenanceEquipment.map((row) => [row.equipment_pk, row]))
      for (const equipment of seed.equipment) {
        const row = byEquipment.get(equipment.id)
        if (!row) continue
        options.stageOrderline({
          product: equipment.name,
          location: equipment.location_name ?? '',
          remarks: row.remarks ?? '',
          equipment: equipment.id,
          equipment_location: equipment.location ?? null,
          amount: row.amount ?? null,
          maintenance_contract: staged.contract_pk,
        })
      }
    }
  }, {immediate: true})

  return {
    isLoading: computed(() => seedQuery.isLoading.value),
  }
}
