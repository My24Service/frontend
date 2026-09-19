export function useRoutePk(pk: MaybeRefOrGetter<string | number | null>) {
  const isCreate = computed(() => !toValue(pk))
  const id = computed(() => Number(toValue(pk)))
  return { isCreate, id }
}
