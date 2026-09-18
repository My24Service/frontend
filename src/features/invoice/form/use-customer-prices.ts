import { useMutation } from '@tanstack/vue-query'
import {
  customerCustomerPartialUpdateMutation,
  companyEngineerPartialUpdateMutation,
  inventoryMaterialPartialUpdateMutation,
} from '@/api/@tanstack/vue-query.gen'
import { errorToast, infoToast, $trans } from '@/services/i18n'
import { useToast } from 'bootstrap-vue-next'

/** The three editor-managed price fields on the customer record. */
export interface PatchedCustomerPrices {
  hourly_rate_engineer?: string
  call_out_costs?: string
  price_per_km?: string
}

/**
 * Pricing writes the Manage-prices panel performs. Each updater takes the
 * record being edited plus the patch body captured from the PriceInput events
 * and reports through toasts exactly like the legacy editor did.
 */
export function usePricingUpdates() {
  const { create } = useToast()
  const customerPatch = useMutation(customerCustomerPartialUpdateMutation())
  const engineerPatch = useMutation(companyEngineerPartialUpdateMutation())
  const materialPatch = useMutation(inventoryMaterialPartialUpdateMutation())

  async function updateCustomerPrices(
    customerId: number | undefined,
    body: PatchedCustomerPrices,
  ): Promise<boolean> {
    // The panel only offers Update after queueing a price, but the guard keeps
    // this safe on its own: no customer or no staged fields is a no-op rather
    // than a PATCH of an empty body.
    if (!customerId || Object.keys(body).length === 0) {
      return false
    }
    try {
      await customerPatch.mutateAsync({
        path: { id: customerId },
        body,
      })
      infoToast(create, $trans('Updated'), $trans('Customer data has been updated'))
      return true
    } catch {
      errorToast(create, $trans('Error updating customer prices'))
      return false
    }
  }

  async function updateEngineerRate(
    engineerId: number,
    hourlyRate: string | undefined,
  ): Promise<boolean> {
    // Nothing was ever typed for this engineer, so there is nothing to send.
    if (hourlyRate === undefined) {
      return false
    }
    try {
      await engineerPatch.mutateAsync({
        path: { id: engineerId },
        body: { engineer: { hourly_rate: hourlyRate } },
      })
      infoToast(create, $trans('Updated'), $trans('Hourly rate engineer has been updated'))
      return true
    } catch {
      errorToast(create, $trans('Error updating hourly rate'))
      return false
    }
  }

  async function updateMaterialPrices(
    materialId: number,
    body: { price_purchase?: string; price_selling?: string },
  ): Promise<boolean> {
    // Nothing was ever typed for this material, so there is nothing to send.
    if (Object.keys(body).length === 0) {
      return false
    }
    try {
      await materialPatch.mutateAsync({
        path: { id: materialId },
        body,
      })
      infoToast(create, $trans('Updated'), $trans('Material prices have been updated'))
      return true
    } catch {
      errorToast(create, $trans('Error updating material prices'))
      return false
    }
  }

  return { updateCustomerPrices, updateEngineerRate, updateMaterialPrices }
}
