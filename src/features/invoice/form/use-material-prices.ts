import { inventoryMaterialPartialUpdateMutation } from '@/api/@tanstack/vue-query.gen'
import { errorToast, infoToast, $trans } from '@/services/i18n'

/**
 * The material price write the Manage-prices panel performs: the record being
 * edited plus the patch body captured from the PriceInput events, reported
 * through toasts exactly like the legacy editor did.
 */
export function useMaterialPriceUpdates() {
  const { create } = useToast()
  const materialPatch = useMutation(inventoryMaterialPartialUpdateMutation())

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

  return { updateMaterialPrices }
}
