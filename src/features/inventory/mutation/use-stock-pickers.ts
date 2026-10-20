import type { QueryClient } from '@tanstack/vue-query'

import { useQueryErrorToast, useSearch } from '@/features/forms'

/** A material as the in-stock search answers: what is left of it, and who supplies it. */
export type StockMaterial = Api.InventoryInventoryMaterials.ListResponse[number]

/** A stock location holding a material, with how much of it. */
export type StockLocationOfMaterial = Api.InventoryInventoryLocationsForMaterial.ListResponse[number]

/** How the in-stock picker names a material: its name and what is left of it. */
export const materialLabel = (material: StockMaterial) =>
  `${material.material_name}, ${$trans('in stock')}: ${material.total_amount}`

/** How a location that holds a material is offered: its name and how much it holds. */
export const locationLabel = (location: StockLocationOfMaterial) =>
  `${location.location_name} (${location.total_amount})`

/**
 * The picker both stock screens start from: materials that are in stock,
 * searched as the user types. Nothing is read until a term is typed.
 */
export function useStockMaterialSearch() {
  return useSearch(
    (q) => Api.InventoryInventoryMaterials.list.options({query: {q}}),
    () => true,
    $trans('Error fetching materials'),
    (rows) => rows,
  )
}

/**
 * The stock locations that hold a material, with the amount each holds. Reads
 * nothing while `material` is null, and answers an empty list then.
 */
export function useLocationsOfMaterial(material: () => number | null) {
  const query = useQuery(() => ({
    ...Api.InventoryInventoryLocationsForMaterial.list.options({query: {material: material() ?? undefined}}),
    enabled: material() !== null,
  }))
  useQueryErrorToast(query.error, $trans('Error fetching locations'))
  const locations = computed<StockLocationOfMaterial[]>(() => query.data.value ?? [])
  return {locations}
}

/**
 * A stock write changed how much is where: the mutation list, the in-stock
 * material search, a material's locations, the material stats and the stock
 * locations' own counts all read stale figures until they are read again.
 */
export function invalidateStock(queryClient: QueryClient) {
  return Promise.all([
    Api.InventoryStockmutationsimpleList.invalidate(queryClient),
    Api.InventoryInventoryMaterials.invalidate(queryClient),
    Api.InventoryInventoryLocationsForMaterial.invalidate(queryClient),
    Api.InventoryMaterial.invalidate(queryClient),
    Api.InventoryStockLocation.invalidate(queryClient),
  ])
}
