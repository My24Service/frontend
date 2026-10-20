<template>
  <QuotationCostPanel
    :options="options"
    :is-view="isView"
    :add-label="$trans('Add distance')"
    :price-label="$trans('Price')"
  >
    <template #amount="{ cost, changed }">
      <BFormGroup :label="$trans('Kilometers')">
        <BFormInput type="number" size="sm" v-model.number="cost.amount_int" @blur="changed" />
      </BFormGroup>
    </template>
  </QuotationCostPanel>
</template>

<script setup lang="ts">
import QuotationCostPanel from './QuotationCostPanel.vue'

/** The kilometres a chapter's work will take, at the tenant's quotation price per km. */
const props = withDefaults(defineProps<{
  chapterId: number
  isView?: boolean
}>(), {isView: false})

const { mainStore } = useCommon()

const options = {
  chapterId: () => props.chapterId,
  costType: 'distance' as const,
  defaultPrice: () => mainStore.getQuotationDefaultPricePerKm,
  title: () => $trans('Distance'),
  description: () => $trans('distance'),
  saved: () => $trans('Distance costs updated'),
  saveError: () => $trans('Error updating distance costs'),
}
</script>
