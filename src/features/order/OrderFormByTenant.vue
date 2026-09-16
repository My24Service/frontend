<template>
  <TempsForm
    v-if="isTemps"
    :pk="pk"
  />
  <OrderForm
    v-else
    :pk="pk"
    :maintenance="maintenance"
    :from-quotation="fromQuotation"
    :quotation-id="quotationId"
  />
</template>

<script lang="ts" setup>
import OrderForm from './form/OrderForm.vue'
import TempsForm from './temps/TempsForm.vue'
import { useTempsTenant } from './temps/use-temps-tenant'

/**
 * The order form the router mounts: the temps tenant's or everyone
 * else's, by the session's member type. The maintenance-contract and
 * quotation seeds are maintenance concepts and are not offered to a
 * temps tenant.
 */
withDefaults(defineProps<{
  pk?: string | number | null
  maintenance?: boolean
  fromQuotation?: boolean
  quotationId?: string | number | null
}>(), {
  pk: null,
  maintenance: false,
  fromQuotation: false,
  quotationId: null,
})

const isTemps = useTempsTenant()
</script>
