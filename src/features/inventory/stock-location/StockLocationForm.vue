<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
      <header>
        <div class="page-title">
          <h3>
            <IBiBookshelf></IBiBookshelf>
            <span v-if="isCreate">{{ $trans('New stock location') }}</span>
            <span v-if="!isCreate">{{ $trans('Edit stock location') }}</span>
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
      <div class="page-detail panel">
        <ValidatedForm
          v-model="values"
          name="stock-location"
          :errors="errors"
          :labels="FIELD_LABELS"
          :submitted="submitClicked"
        >
          <b-form>
            <b-row>
              <b-col cols="4" role="group">
                <ValidatedFormField name="name" />
              </b-col>
              <b-col cols="4" role="group">
                <ValidatedFormField name="identifier" />
              </b-col>
              <b-col cols="4" role="group">
                <BFormGroup
                  label-size="sm"
                  label-for="stock-location_show_in_stats"
                  :label="$trans('Stats')"
                >
                  <BFormCheckbox id="stock-location_show_in_stats" v-model="values.show_in_stats">{{ $trans('Show in stats') }}</BFormCheckbox>
                </BFormGroup>
              </b-col>
            </b-row>
          </b-form>
        </ValidatedForm>
      </div>
    </div>
  </b-overlay>
</template>

<script setup lang="ts">
import {
  useResourceForm,
  ValidatedForm,
  ValidatedFormField,
} from '@/features/forms'
import {
  emptyStockLocation,
  FIELD_LABELS,
  stockLocationFromRecord,
  stockLocationWrite,
} from './schemas'

/**
 * The stock location create/edit form. The skeleton - pk split, detail read,
 * create/update pair, toasts, guards and exit - is `useResourceForm`'s.
 */
const props = withDefaults(defineProps<{
  /** The route's `:pk`. A create has none. */
  pk?: string | number | null
}>(), {
  pk: null,
})

const form = useResourceForm({
  pk: () => props.pk,
  resource: Api.InventoryStockLocation,
  empty: emptyStockLocation,
  fromRecord: stockLocationFromRecord,
  contract: stockLocationWrite,
  copy: {
    fetchError: $trans('Error fetching stock location'),
    created: $trans('Created'),
    createdDetail: $trans('Stock location has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Stock location has been updated'),
    createError: $trans('Error creating stock location'),
    updateError: $trans('Error updating stock location'),
  },
})
const { values, errors, submitClicked, isCreate, isLoading, buttonDisabled } = form
</script>
