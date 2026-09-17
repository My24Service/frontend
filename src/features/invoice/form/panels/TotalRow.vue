<template>
  <b-row>
    <b-col cols="9">
      {{ $trans('Total') }}: <span class="total-text">{{ items_total }}</span>
    </b-col>
    <b-col cols="3">
      <TotalsInputs
        :total="total ?? undefined"
        :is-final-total="true"
        :vat="total_vat ?? undefined"
      />
    </b-col>
  </b-row>
</template>

<script setup lang="ts">
import TotalsInputs from '@/components/TotalsInputs.vue'
import { $trans } from '@/services/i18n'
import type { InvoiceTotals } from '../calculations'

defineProps<{
  items_total?: string | number | null
  total?: InvoiceTotals['total_dinero'] | null
  total_vat?: InvoiceTotals['vat_dinero'] | null
}>()
</script>

<style scoped>
.total-text {
  font-size: 14px;
  font-weight: bold;
}
</style>
