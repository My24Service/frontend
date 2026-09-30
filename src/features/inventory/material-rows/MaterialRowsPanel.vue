
<template>
  <div class="panel col-2-3">
    <div
      v-if="supplierChosen"
      class="material-rows"
    >
      <h6>{{ $trans('Products') }}</h6>
      <b-row>
        <b-col cols="12">
          <b-table
            v-if="rows.length > 0"
            small
            :fields="fields"
            :items="rows"
            responsive="md"
          >
            <template #cell(icons)="data">
              <div class="float-end">
                <BLink
                  class="h5 mx-2 edit-row"
                  @click="editRow(data.index)"
                >
                  <IBiPencil />
                </BLink>
                <BLink
                  class="h5 mx-2 delete-row"
                  @click.prevent="deleteRow(data.index)"
                >
                  <IBiTrash />
                </BLink>
              </div>
            </template>
          </b-table>
        </b-col>
      </b-row>
      <b-row>
        <b-col
          cols="12"
          role="group"
        >
          <BFormGroup
            label-size="sm"
            :label="$trans('Search product')"
          >
            <VueMultiselect
              id="material-rows-search"
              track-by="id"
              label="name"
              :placeholder="$trans('Type to search')"
              open-direction="bottom"
              :options="productOptions"
              :multiple="false"
              :loading="searching"
              :internal-search="false"
              :clear-on-select="true"
              :close-on-select="true"
              :options-limit="30"
              :limit="10"
              :max-height="600"
              :show-no-results="false"
              :hide-selected="true"
              @search-change="(value: string) => { searchTerm = value }"
              @select="selectMaterial"
            >
              <template #noResult>
                {{ $trans('Oops! No elements found. Consider changing the search query.') }}
              </template>
            </VueMultiselect>
          </BFormGroup>
        </b-col>
      </b-row>
      <b-row>
        <b-col
          cols="4"
          role="group"
        >
          <BFormGroup
            label-size="sm"
            :label="$trans('Name')"
            label-for="material-rows-name"
          >
            <BFormInput
              id="material-rows-name"
              v-model="draft.name"
              readonly
              size="sm"
            />
            <b-form-invalid-feedback :state="!draftErrors.material">
              {{ draftErrors.material }}
            </b-form-invalid-feedback>
          </BFormGroup>
        </b-col>
        <b-col
          cols="4"
          role="group"
        >
          <BFormGroup
            label-size="sm"
            :label="$trans('Amount')"
            label-for="material-rows-amount"
          >
            <BFormInput
              id="material-rows-amount"
              ref="amountInput"
              v-model="draft.amount"
              size="sm"
            />
            <b-form-invalid-feedback :state="!draftErrors.amount">
              {{ draftErrors.amount }}
            </b-form-invalid-feedback>
          </BFormGroup>
        </b-col>
        <b-col
          cols="4"
          role="group"
        >
          <BFormGroup
            label-size="sm"
            :label="$trans('Remarks')"
            label-for="material-rows-remarks"
          >
            <BFormTextarea
              id="material-rows-remarks"
              v-model="draft.remarks"
              rows="1"
            />
          </BFormGroup>
        </b-col>
      </b-row>
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
          :disabled="!isDraftValid"
          @click="commitEdit"
        >
          {{ $trans('Edit product') }}
        </BButton>
        <BButton
          v-else
          class="btn btn-primary"
          size="sm"
          type="button"
          variant="primary"
          :disabled="!isDraftValid"
          @click="addRow"
        >
          {{ $trans('Add product') }}
        </BButton>
      </footer>
    </div>
    <div v-else>
      <h6>{{ $trans('Products') }}</h6>
      <h3 class="dimmed">
        {{ placeholder }}
      </h3>
    </div>
  </div>
</template>

<script setup lang="ts">
import VueMultiselect from 'vue-multiselect'

import type { MaterialRows } from './use-material-rows'

/**
 * The material rows of a purchase order or a reservation: the staged rows, the
 * supplier's product picker, and the editor that adds, edits and cancels. The
 * staged set is the parent form's (`useMaterialRows`); this renders it.
 */
const props = defineProps<{
  staging: MaterialRows
  /** Products are the chosen supplier's, so the editor shows only once there is one. */
  supplierChosen: boolean
  /** What shows in the editor's place until then. */
  placeholder: string
}>()

const {
  rows,
  productOptions,
  searching,
  searchTerm,
  selectMaterial,
  draft,
  draftErrors,
  isDraftValid,
  editingIndex,
  addRow,
  editRow,
  commitEdit,
  cancelEdit,
  deleteRow,
  amountInput,
} = props.staging

const fields = [
  {key: 'name', label: $trans('Name')},
  {key: 'amount', label: $trans('Amount')},
  {key: 'remarks', label: $trans('Remarks')},
  {key: 'icons', label: ''},
]
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
