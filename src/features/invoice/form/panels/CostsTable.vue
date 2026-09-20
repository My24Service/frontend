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
      {{ formatMoney(data.item.price_dinero) }}
    </template>
    <template #cell(vat)="data">
      {{ formatMoney(data.item.vat_dinero) }} ({{ data.item.vat_type }}%)
    </template>
    <template #cell(total)="data">
      {{ formatMoney(data.item.total_dinero) }}
    </template>
  </b-table>
</template>

<script setup lang="ts">
import { $trans } from '@/services/i18n'
import { formatMoney } from '@/services/money'
import { COST_TYPE } from '../calculations'
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
    case COST_TYPE.USED_MATERIALS:
      return [{ key: 'material_name', label: $trans('Name') }, { key: 'amount_decimal', label: $trans('Amount') }, ...prices]
    case COST_TYPE.WORK_HOURS:
    case COST_TYPE.TRAVEL_HOURS:
    case COST_TYPE.EXTRA_WORK:
    case COST_TYPE.ACTUAL_WORK:
      return [{ key: 'user_full_name', label: $trans('User') }, { key: 'amount_duration_read', label: $trans('Amount') }, ...prices]
    case COST_TYPE.DISTANCE:
    case COST_TYPE.CALL_OUT_COSTS:
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
