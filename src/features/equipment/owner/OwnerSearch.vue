<template>
  <BFormGroup
    label-size="sm"
    label-class="p-sm-0"
    :label="label"
    :label-for="id"
  >
    <VueMultiselect
      v-if="!disabled"
      :id="id"
      track-by="id"
      :placeholder="$trans('Type to search')"
      open-direction="bottom"
      :options="options"
      :multiple="false"
      :loading="isLoading"
      :internal-search="false"
      :clear-on-select="true"
      :close-on-select="true"
      :options-limit="30"
      :limit="10"
      :max-height="600"
      :show-no-results="true"
      :hide-selected="true"
      :custom-label="labelOf"
      @search-change="$emit('search', $event)"
      @select="$emit('select', $event)"
    >
      <template #noResult>
        {{ $trans('Oops! No elements found. Consider changing the search query.') }}
      </template>
    </VueMultiselect>
    <b-form-invalid-feedback :state="state">
      {{ error }}
    </b-form-invalid-feedback>
  </BFormGroup>
</template>

<script setup lang="ts">
import VueMultiselect from 'vue-multiselect'
import type { OwnerOption } from './use-form-owner'

/**
 * The type-ahead for whichever owner foreign key applies, and the copy under it.
 *
 * The element id is passed in rather than derived: it is part of the screen's
 * DOM contract (`equipment_customer_search`), the three forms spell it
 * differently, and a field a label points at has to keep its name.
 */
withDefaults(defineProps<{
  /** The input's DOM id. */
  id: string
  label: string
  /** The copy shown once the form has been submitted and the field is empty. */
  error: string
  /** `null` before submit, so nothing is flagged until the user tries. */
  state?: boolean | null
  options: OwnerOption[]
  isLoading?: boolean
  /** Withheld while the record is loading, so the picker never shows a stale list. */
  disabled?: boolean
}>(), {
  state: null,
  isLoading: false,
  disabled: false,
})

defineEmits<{
  (event: 'search', term: string): void
  (event: 'select', option: OwnerOption): void
}>()

const labelOf = (option: OwnerOption) => `${option.name} - ${option.city ?? ''}`
</script>
