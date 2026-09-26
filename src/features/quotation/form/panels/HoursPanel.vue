<template>
  <QuotationCostPanel
    :options="options"
    :is-view="isView"
    :add-label="type === 'work_hours' ? $trans('Add work hours') : $trans('Add travel hours')"
    :price-label="$trans('Engineer rate')"
  >
    <template #amount="{ cost, changed }">
      <BFormGroup :label="$trans('Hours')">
        <DurationInput
          style="width: 80px !important;"
          :model-value="String(cost.amount_duration ?? '0:00')"
          @update:model-value="(value: string) => { cost.amount_duration = value }"
          @durationChanged="(value: string) => { changeDuration(cost, value); changed() }"
        />
      </BFormGroup>
    </template>
  </QuotationCostPanel>
</template>

<script setup lang="ts">
import type { CostRow } from '@/features/costing'
import { durationSeconds } from '../calculations'
import QuotationCostPanel from './QuotationCostPanel.vue'

/** A chapter's estimated work or travel hours, at the tenant's quotation hourly rate. */
const props = withDefaults(defineProps<{
  chapterId: number
  type: 'work_hours' | 'travel_hours'
  isView?: boolean
}>(), {isView: false})

const { mainStore } = useCommon()
const title = () => props.type === 'work_hours' ? $trans('Work hours') : $trans('Travel hours')

const options = {
  chapterId: () => props.chapterId,
  costType: props.type,
  defaultPrice: () => mainStore.getQuotationDefaultHourlyRate,
  title,
  description: title,
  saved: () => $trans('Hours costs have been updated'),
  saveError: () => $trans('Error creating hours costs'),
}

/**
 * A duration was typed (`H:MM`): it is what the row sends, its seconds price
 * the row, and its `H:MM` is what an "items" quotation line shows as amount.
 */
function changeDuration(cost: CostRow, value: string) {
  const seconds = durationSeconds(value)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  Object.assign(cost, {
    amount_duration: value,
    amount_duration_secs: seconds,
    amount_duration_read: hours + ':' + String(minutes).padStart(2, '0'),
  })
}
</script>
