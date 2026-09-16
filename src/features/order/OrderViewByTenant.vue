<template>
  <TempsView
    v-if="isTemps"
    :pk="pk"
    :uuid="uuid"
  />
  <OrderView
    v-else
    :pk="pk"
    :uuid="uuid"
    :past="past"
  />
</template>

<script lang="ts" setup>
import OrderView from './order/OrderView.vue'
import TempsView from './temps/TempsView.vue'
import { useTempsTenant } from './temps/use-temps-tenant'

/**
 * The order detail the router mounts: the temps tenant's or everyone
 * else's, by the session's member type.
 */
withDefaults(defineProps<{
  pk?: string | number | null
  uuid?: string | null
  past?: boolean
}>(), {
  pk: null,
  uuid: null,
  past: false,
})

const isTemps = useTempsTenant()
</script>
