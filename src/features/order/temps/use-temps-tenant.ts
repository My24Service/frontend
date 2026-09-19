import { useMainStore } from '@/stores/main'

/**
 * Whether the session's tenant is a temps agency (`profile.flavour: 'temps'`)
 * rather than a maintenance company. The one flag the temps screens hang
 * off: the form and the view are picked by it, and the list's people
 * column counts heads instead of naming them.
 */
export function useTempsTenant() {
  const mainStore = useMainStore()
  return computed(() => mainStore.getFlavour === 'temps')
}
