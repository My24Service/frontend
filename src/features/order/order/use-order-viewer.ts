import { computed } from 'vue'

import { useAuthStore } from '@/features/auth'
import { useMainStore } from '@/stores/main'

/**
 * Who is looking at an order, and what their tenant has: the flags the
 * detail's panels show and hide their rows by.
 */
export function useOrderViewer() {
  const authStore = useAuthStore()
  const mainStore = useMainStore()
  return {
    isCustomer: computed(() => Boolean(authStore.isCustomer)),
    isPlanning: computed(() => Boolean(authStore.isPlanning)),
    isBranchEmployee: computed(() => Boolean(authStore.isBranchEmployee)),
    hasBranches: computed(() => Boolean(mainStore.getMemberHasBranches)),
    usesEquipment: computed(() => Boolean(mainStore.getMemberUsesEquipment)),
  }
}
