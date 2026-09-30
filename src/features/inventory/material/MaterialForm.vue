<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiBox></IBiBox>
          <span class="backlink" @click="form.cancelForm">{{ $trans("Materials") }}</span> /
          <span v-if="isCreate && !values.name" class="dimmed">({{ $trans("Material name") }})</span>
          <span v-else>{{ values.name }}</span>
        </h3>
        <div class="flex-columns">
          <BButton @click="form.cancelForm" class="btn btn-secondary" type="button" variant="secondary">
            {{ $trans('Cancel') }}
          </BButton>
          <BButton @click="form.submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
            {{ $trans('Submit') }}
          </BButton>
        </div>
      </div>
    </header>

    <div class="page-detail">
      <b-overlay :show="isLoading" rounded="sm">
        <ValidatedForm
          v-model="values"
          name="material"
          :errors="errors"
          :labels="FIELD_LABELS"
          :submitted="submitClicked"
        >
          <b-form class="flex-columns">
            <div class="panel col-1-3">
              <ValidatedFormField name="name" label-cols="4" />
              <ValidatedFormField name="name_short" label-cols="4" />
              <ValidatedFormField name="identifier" label-cols="4" />
              <ValidatedFormField name="unit" label-cols="4" />

              <BFormGroup
                label-size="sm"
                label-cols="4"
                :label="$trans('Search supplier')"
                label-for="material-supplier-search"
              >
                <VueMultiselect
                  id="material-supplier-search"
                  track-by="id"
                  :placeholder="$trans('Type to search')"
                  open-direction="bottom"
                  :options="suppliers"
                  :multiple="false"
                  :loading="suppliersLoading"
                  :internal-search="false"
                  :clear-on-select="false"
                  :close-on-select="true"
                  :options-limit="30"
                  :limit="10"
                  :max-height="600"
                  :show-no-results="false"
                  :hide-selected="true"
                  label="name"
                  @search-change="(value: string) => { supplierTerm = value }"
                  @select="selectSupplier"
                >
                  <template #noResult>
                    {{ $trans('Oops! No elements found. Consider changing the search query.') }}
                  </template>
                </VueMultiselect>
              </BFormGroup>

              <ValidatedFormField name="supplier_name" label-cols="4" readonly />
              <ValidatedFormField name="location" label-cols="4" />
              <ValidatedFormField name="product_type" label-cols="4" />

              <h6>{{ $trans("Pricing") }}</h6>

              <ValidatedFormField name="price_purchase" label-cols="4" />
              <ValidatedFormField name="price_selling" label-cols="4" />
              <ValidatedFormField name="price_selling_alt" label-cols="4" />
              <ValidatedFormField name="price_purchase_ex" label-cols="4" />
              <ValidatedFormField name="price_selling_ex" label-cols="4" />
              <ValidatedFormField name="price_selling_alt_ex" label-cols="4" />
            </div>

            <div class="panel col-2-3">
              <ImageUploadField
                field-id="material-image"
                :label="$trans('Image')"
                :current-image="currentImage"
                @selected="(dataUrl) => { values.image = dataUrl }"
              />
            </div>
          </b-form>
        </ValidatedForm>
      </b-overlay>
    </div>
  </div>
</template>

<script setup lang="ts">
import VueMultiselect from 'vue-multiselect'

import { NO_IMAGE_URL } from '@/constants'
import {
  ImageUploadField,
  useResourceForm,
  useSearch,
  ValidatedForm,
  ValidatedFormField,
} from '@/features/forms'
import {
  emptyMaterial,
  FIELD_LABELS,
  materialFromRecord,
  materialWrite,
} from './schemas'

/**
 * The material create/edit form.
 *
 * The skeleton - pk split, detail read, create/update pair, toasts, guards and
 * exit - is `useResourceForm`'s. What the screen has of its own is the two
 * pickers: the supplier, searched as the user types (an empty term reads
 * nothing), and the image, staged as a data URL and sent only when a file was
 * picked. The record's own image is a URL; it shows as the current image and
 * never enters the values.
 */
const props = withDefaults(defineProps<{
  /** The route's `:pk`. A create has none. */
  pk?: string | number | null
}>(), {
  pk: null,
})

const form = useResourceForm({
  pk: () => props.pk,
  resource: Api.InventoryMaterial,
  empty: emptyMaterial,
  fromRecord: materialFromRecord,
  contract: materialWrite,
  copy: {
    fetchError: $trans('Error fetching material'),
    created: $trans('Created'),
    createdDetail: $trans('Material has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Material has been updated'),
    createError: $trans('Error creating material'),
    updateError: $trans('Error updating material'),
  },
})
const { values, errors, submitClicked, isCreate, isLoading, buttonDisabled, record } = form

const currentImage = computed(() => record.value?.image || NO_IMAGE_URL)

const {term: supplierTerm, options: suppliers, loading: suppliersLoading} = useSearch(
  (q) => Api.InventorySupplierAutocomplete.list.options({query: {q}}),
  () => true,
  $trans('Error fetching suppliers'),
  (rows) => rows,
)

function selectSupplier(option: Api.SupplierAutocomplete) {
  values.value.supplier_relation = option.id
  values.value.supplier_name = option.name ?? ''
}
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
