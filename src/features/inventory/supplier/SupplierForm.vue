<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiShop></IBiShop>
          <span class="backlink" @click="form.cancelForm">{{ $trans('Suppliers') }}</span> /
          {{ values.name }}
          <span v-if="!isCreate" class="dimmed">{{ $trans('edit') }}</span>
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
    <section class="page-detail">
      <b-overlay :show="isLoading" rounded="sm">
        <ValidatedForm
          v-model="values"
          name="supplier"
          :errors="errors"
          :labels="FIELD_LABELS"
          :submitted="submitClicked"
        >
          <b-form class="flex-columns">
            <div class="panel">
              <h6>{{ $trans('Supplier') }}</h6>
              <ValidatedFormField name="identifier" label-cols="3" />
              <ValidatedFormField name="name" label-cols="3" />
              <ValidatedFormField name="address" label-cols="3" />
              <ValidatedFormField name="postal" label-cols="3" />
              <ValidatedFormField name="city" label-cols="3" />

              <BFormGroup
                label-size="sm"
                label-cols="3"
                :label="$trans('Country')"
                label-for="supplier_country_code"
              >
                <BFormSelect id="supplier_country_code" v-model="values.country_code" :options="countries" size="sm"></BFormSelect>
                <b-form-invalid-feedback :state="submitClicked ? !errors.country_code : null">
                  {{ errors.country_code }}
                </b-form-invalid-feedback>
              </BFormGroup>
            </div>

            <div class="panel">
              <h6>{{ $trans('Contact') }}</h6>
              <ValidatedFormField name="email" label-cols="3" />
              <ValidatedFormField name="tel" label-cols="3" />
              <ValidatedFormField name="mobile" label-cols="3" />
              <ValidatedFormField name="contact" label-cols="3" />
            </div>
          </b-form>
        </ValidatedForm>
      </b-overlay>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  useResourceForm,
  ValidatedForm,
  ValidatedFormField,
} from '@/features/forms'
import {
  emptySupplier,
  FIELD_LABELS,
  supplierFromRecord,
  supplierWrite,
} from './schemas'

/**
 * The supplier create/edit form. The skeleton - pk split, detail read,
 * create/update pair, toasts, guards and exit - is `useResourceForm`'s; the
 * screen keeps its two panels and the tenant's country list.
 */
const props = withDefaults(defineProps<{
  /** The route's `:pk`. A create has none. */
  pk?: string | number | null
}>(), {
  pk: null,
})

const { mainStore } = useCommon()
const countries = computed(() => mainStore.getCountries)

const form = useResourceForm({
  pk: () => props.pk,
  resource: Api.InventorySupplier,
  empty: emptySupplier,
  fromRecord: supplierFromRecord,
  contract: supplierWrite,
  copy: {
    fetchError: $trans('Error fetching supplier'),
    created: $trans('Created'),
    createdDetail: $trans('Supplier has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Supplier has been updated'),
    createError: $trans('Error creating supplier'),
    updateError: $trans('Error updating supplier'),
  },
})
const { values, errors, submitClicked, isCreate, isLoading, buttonDisabled } = form
</script>
