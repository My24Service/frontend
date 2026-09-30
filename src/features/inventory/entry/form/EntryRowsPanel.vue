<template>
  <div class="entry-materials">
    <h4>{{ $trans('Products') }}</h4>
    <b-row>
      <b-col cols="12">
        <b-table
          v-if="rows.length > 0"
          small
          :fields="entriesFields"
          :items="rows"
          responsive="md"
        >
          <template #cell(entry_date)="data">
            {{ data.item.entry_date ? toApiDate(data.item.entry_date) : '' }}
          </template>
          <template #cell(icons)="data">
            <div class="float-end">
              <BLink class="h5 mx-2" @click="editRow(data.index)">
                <IBiPencil />
              </BLink>
              <BLink class="h5 mx-2" @click.prevent="deleteRow(data.index)">
                <IBiTrash />
              </BLink>
            </div>
          </template>
        </b-table>
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="12" role="group">
        <BFormGroup
          label-size="sm"
          :label="$trans('Product')"
          label-for="purchaseorder-entry-material-search"
        >
          <VueMultiselect
            id="purchaseorder-entry-material-search"
            track-by="id"
            :placeholder="$trans('Type to search')"
            open-direction="bottom"
            :options="materials"
            :multiple="false"
            :internal-search="true"
            :clear-on-select="true"
            :close-on-select="true"
            :options-limit="30"
            :limit="10"
            :max-height="600"
            :show-no-results="false"
            :hide-selected="true"
            :custom-label="materialLabel"
            @select="pickMaterial"
          >
            <template #noResult>
              {{ $trans('Oops! No elements found. Consider changing the search query.') }}
            </template>
          </VueMultiselect>
          <b-form-invalid-feedback :state="submitted ? !draftErrors.purchase_order_material : null">
            {{ draftErrors.purchase_order_material }}
          </b-form-invalid-feedback>
        </BFormGroup>
      </b-col>
    </b-row>

    <EntryFields
      ref="fields"
      v-model="draft"
      :stock-locations="stockLocations"
      :errors="draftErrors"
      :submitted="submitted"
    />

    <footer class="modal-footer">
      <BButton
        class="btn btn-primary"
        size="sm"
        type="button"
        variant="secondary"
        @click="cancelEdit"
      >
        {{ $trans('Cancel') }}
      </BButton>
      &nbsp;
      <BButton
        v-if="editingIndex !== null"
        class="btn btn-primary"
        size="sm"
        type="button"
        variant="warning"
        :disabled="!canCommit"
        @click="saveEdit"
      >
        {{ $trans('Edit entry') }}
      </BButton>
      <BButton
        v-else
        class="btn btn-primary"
        size="sm"
        type="button"
        variant="primary"
        :disabled="!canCommit"
        @click="addRow"
      >
        {{ $trans('Add entry') }}
      </BButton>
    </footer>
  </div>
</template>

<script setup lang="ts">
import VueMultiselect from 'vue-multiselect'

import { toApiDate } from '@/features/forms'
import EntryFields from './EntryFields.vue'
import type { EntryRows } from './use-entry-rows'

/**
 * The staged entries of a create: the table of what will be booked in, the
 * product picker over the order's materials, and the row editor beneath it.
 * Rendered by the form; the staged set and its operations are the form's
 * (`useEntryRows`), this only shows and drives them.
 */
const props = defineProps<{
  staging: EntryRows
  stockLocations: readonly Api.StockLocation[]
  /** Errors show only once a save was tried, as the legacy form did. */
  submitted: boolean
}>()

const {
  rows,
  materials,
  draft,
  draftErrors,
  canCommit,
  editingIndex,
  editRow,
  deleteRow,
  addRow,
  saveEdit,
  cancelEdit,
  selectMaterial,
} = props.staging

const fields = useTemplateRef<{focusAmount: () => void}>('fields')

const entriesFields = [
  { key: 'material_name', label: $trans('Name') },
  { key: 'unit', label: $trans('Unit') },
  { key: 'ordered_amount', label: $trans('Ordered amount') },
  { key: 'amount', label: $trans('Entry amount') },
  { key: 'entry_date', label: $trans('Date') },
  { key: 'stock_location_name', label: $trans('Location') },
  { key: 'icons', label: '' },
]

// The label is a literal, not a translated string: it carries the order's own numbers.
const materialLabel = (material: Api.PurchaseOrderMaterial) =>
  `${material.material_view.name} (ordered: ${material.amount}, entries: ${material.num_entries})`

function pickMaterial(option: Api.PurchaseOrderMaterial) {
  selectMaterial(option)
  fields.value?.focusAmount()
}
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
