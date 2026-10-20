<template>
  <QuotationCostPanel
    :options="options"
    :is-view="isView"
    :add-label="$trans('Add material')"
    :price-label="$trans('Price')"
    :row-ready="(cost) => cost.material != null"
  >
    <template #before-row="{ cost, changed }">
      <b-row>
        <b-col cols="12">
          <BFormGroup
            v-if="cost.material == null"
            label-cols="3"
            :label="$trans('Material')"
            label-for="material-search"
          >
            <VueMultiselect
              id="material-search"
              track-by="id"
              :placeholder="$trans('Type to search')"
              open-direction="bottom"
              :options="materials"
              :loading="searching"
              :multiple="false"
              :internal-search="false"
              :clear-on-select="false"
              :close-on-select="true"
              :options-limit="30"
              :limit="10"
              :max-height="600"
              :show-no-results="false"
              :hide-selected="true"
              label="name"
              @search-change="(value: string) => { term = value }"
              @select="(material: Api.MaterialAutocomplete) => pickMaterial(cost, material, changed)"
            >
              <template #noResult>{{ $trans('Oops! No elements found. Consider changing the search query.') }}</template>
            </VueMultiselect>
          </BFormGroup>
          <BFormGroup v-else label-for="material-search">
            <BFormInput readonly :model-value="cost.material_name ?? ''" />
          </BFormGroup>
        </b-col>
      </b-row>
    </template>
    <template #amount="{ cost, changed }">
      <BFormGroup :label="$trans('Amount')" label-for="material-amount">
        <BFormInput v-model="cost.amount_decimal" @change="changed" />
      </BFormGroup>
    </template>
  </QuotationCostPanel>
</template>

<script setup lang="ts">
import VueMultiselect from 'vue-multiselect'

import { useSearch } from '@/features/forms'
import type { CostRow } from '@/features/costing'
import QuotationCostPanel from './QuotationCostPanel.vue'

/**
 * The materials a chapter uses. A new row starts without a material; picking
 * one reads its detail once to seed the row with its selling price. Stored
 * rows are named from the cost list itself, never one material read per row.
 */
const props = withDefaults(defineProps<{
  chapterId: number
  isView?: boolean
}>(), {isView: false})

const { mainStore, queryClient, toast: create } = useCommon()
const currency = mainStore.requiredDefaultCurrency

const options = {
  chapterId: () => props.chapterId,
  costType: 'used_materials' as const,
  defaultPrice: () => '0.00',
  title: () => $trans('Materials'),
  description: (row: CostRow) => $trans('material') + ': ' + (row.material_name || $trans('unknown')),
  saved: () => $trans('Materials costs have been updated'),
  saveError: () => $trans('Error updating material costs'),
  // A row without a material is a picker nobody used; it is not sent.
  keepOnSave: (row: CostRow) => row.material != null,
}

const {term, options: materials, loading: searching} = useSearch(
  (q) => Api.InventoryMaterialAutocomplete.list.options({query: {q}}),
  () => true,
  $trans('Error fetching materials'),
  (rows) => rows,
)

async function pickMaterial(cost: CostRow, material: Api.MaterialAutocomplete, changed: () => void) {
  try {
    const detail = await queryClient.fetchQuery(Api.InventoryMaterial.retrieve.options({path: {id: material.id}}))
    Object.assign(cost, {
      material: detail.id,
      material_name: detail.name,
      price: detail.price_selling_ex,
      price_currency: detail.price_selling_ex_currency || currency,
      amount_decimal: '0.00',
    })
    changed()
  } catch {
    errorToast(create, $trans('Error fetching material'))
  }
}
</script>
