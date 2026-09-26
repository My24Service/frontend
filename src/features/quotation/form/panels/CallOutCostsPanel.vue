<template>
  <QuotationCostPanel
    :options="options"
    :is-view="isView"
    :add-label="$trans('Add call-out cost')"
    :price-label="$trans('Price')"
  >
    <template #amount="{ cost, changed }">
      <BFormGroup :label="$trans('Amount')">
        <BFormInput type="number" size="sm" v-model.number="cost.amount_int" @blur="changed" />
      </BFormGroup>
    </template>
  </QuotationCostPanel>
</template>

<script setup lang="ts">
import QuotationCostPanel from './QuotationCostPanel.vue'

/** A chapter's call-out costs, at the tenant's quotation call-out price. */
const props = withDefaults(defineProps<{
  chapterId: number
  isView?: boolean
}>(), {isView: false})

const { mainStore } = useCommon()

const options = {
  chapterId: () => props.chapterId,
  costType: 'call_out_costs' as const,
  defaultPrice: () => mainStore.getQuotationDefaultCallOutCosts,
  title: () => $trans('Call-out costs'),
  description: () => $trans('Call-out costs'),
  saved: () => $trans('Call-out costs have been updated'),
  saveError: () => $trans('Error creating call-out costs'),
}
</script>
