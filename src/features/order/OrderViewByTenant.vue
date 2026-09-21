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
import { OrderView } from '@/features/order/order'
import { TempsView } from '@/features/order/temps'
import { useTempsTenant } from '@/features/order/temps'

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
