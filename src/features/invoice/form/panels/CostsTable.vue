<template>
  <b-table
    small
    id="costs-table"
    :fields="tableFields"
    :items="collection"
    responsive="md"
    class="data-table"
  >
    <template #cell(price)="data">
      {{ data.item.price_dinero.toFormat('$0.00') }} ({{ data.item.use_price }})
    </template>
    <template #cell(vat)="data">
      {{ data.item.vat_dinero.toFormat('$0.00') }} ({{ data.item.vat_type }}%)
    </template>
    <template #cell(total)="data">
      {{ data.item.total_dinero.toFormat('$0.00') }}
    </template>
  </b-table>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { $trans } from '@/services/i18n'
import {
  COST_TYPE_ACTUAL_WORK, COST_TYPE_CALL_OUT_COSTS, COST_TYPE_DISTANCE,
  COST_TYPE_EXTRA_WORK, COST_TYPE_TRAVEL_HOURS, COST_TYPE_USED_MATERIALS,
  COST_TYPE_WORK_HOURS,
} from '../calculations'
import type { CostType } from '../calculations'
import type { CostRow } from '../use-cost-collection'

const props = defineProps<{ type: CostType; collection: CostRow[] }>()
const prices = [
  { key: 'price', label: $trans('Price') },
  { key: 'vat', label: $trans('VAT') },
  { key: 'total', label: $trans('Total') },
]
const tableFields = computed(() => {
  const type = props.type
  switch (type) {
    case COST_TYPE_USED_MATERIALS:
      return [{ key: 'material_name', label: $trans('Name') }, { key: 'amount_decimal', label: $trans('Amount') }, ...prices]
    case COST_TYPE_WORK_HOURS:
    case COST_TYPE_TRAVEL_HOURS:
    case COST_TYPE_EXTRA_WORK:
    case COST_TYPE_ACTUAL_WORK:
      return [{ key: 'user_full_name', label: $trans('User') }, { key: 'amount_duration_read', label: $trans('Amount') }, ...prices]
    case COST_TYPE_DISTANCE:
    case COST_TYPE_CALL_OUT_COSTS:
      return [{ key: 'amount_int', label: $trans('Amount') }, ...prices]
    default: {
      const unreachable: never = type
      throw new Error('Unknown cost type: ' + String(unreachable))
    }
  }
})
</script>

<style scoped>

</style>
