import type { QueryClient } from '@tanstack/vue-query'

/**
 * A part write stales the equipment too, which the schema cannot connect: the
 * equipment's own `parts` list the part with its scores, and a deleted part
 * leaves that list.
 */
export async function invalidateEquipmentPartQueries(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    Api.EquipmentEquipmentPart.invalidate(queryClient),
    Api.EquipmentEquipment.invalidate(queryClient),
  ])
}
