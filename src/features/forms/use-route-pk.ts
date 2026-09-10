import { computed, toValue, type MaybeRefOrGetter } from 'vue'

/**
 * The create/edit split every resource form makes from its `pk` route prop.
 *
 * Route params arrive as strings; the generated operations want the number.
 */
export function useRoutePk(pk: MaybeRefOrGetter<string | number | null>) {
  const isCreate = computed(() => !toValue(pk))
  const id = computed(() => Number(toValue(pk)))
  return { isCreate, id }
}
