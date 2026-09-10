<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
      <header>
        <div class="page-title">
          <h3>
            <IBiPeople></IBiPeople>
            <span class="backlink" @click="cancelForm">{{ $trans("People") }}</span> /
            <strong> {{ customerUser.username }}</strong>
            <span class="dimmed" v-if="isCreate && !customerUser.username">{{ $trans('new') }}</span>
            <span class="dimmed" v-if="!isCreate && !customerUser.username">{{ $trans('edit') }}</span>
          </h3>
          <div class="flex-columns">
            <BButton @click="cancelForm" type="button" variant="secondary" class="outline">
              {{ $trans('Cancel') }}</BButton>
            <BButton @click="submitForm" :disabled="buttonDisabled" type="button" variant="primary">
              {{ $trans('Submit') }}</BButton>
          </div>
        </div>
      </header>
      <div class="page-detail">
        <div class="flex-columns">
          <div class="panel col-1-3">
            <h6>{{ $trans('User info')}}</h6>

            <UserIdentityPanel
              v-model:values="customerUser"
              id-prefix="customeruser"
              :errors="errors"
              :submit-clicked="submitClicked"
              :probe-state="probe.state.value"
              :taken-message="USERNAME_TAKEN_MESSAGE"
              :field-messages="FIELD_MESSAGES"
            />
          </div>

          <div class="panel col-1-3">
            <h6>{{ $trans('Personal details')}}</h6>
            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Settings group')"
              label-for="customeruser_settings_group"
            >
              <BFormInput
                id="customeruser_settings_group"
                size="sm"
                v-model="customerUser.settings_group"
              ></BFormInput>
            </BFormGroup>
          </div>

          <div class="panel col-1-3">
            <h6>{{ $trans('Customer') }}</h6>
            <div class="flex-columns">
              <BFormGroup
                label-size="sm"
                label=""
                label-for="customeruser_customer_search"
                class="inline"
              >
                <VueMultiselect
                  id="customeruser_customer_search"
                  track-by="id"
                  :placeholder="$trans('Type to search customer')"
                  open-direction="bottom"
                  :options="customerOptions"
                  :multiple="false"
                  :loading="customerSearchPending"
                  :internal-search="false"
                  :clear-on-select="true"
                  :close-on-select="true"
                  :options-limit="30"
                  :limit="10"
                  :max-height="600"
                  :show-no-results="false"
                  :hide-selected="true"
                  @search-change="customerSearchTerm = $event"
                  @select="selectCustomer"
                  :custom-label="customerLabel"
                >
                  <template #noResult>
                    {{ $trans('Oops! No elements found. Consider changing the search query.') }}
                  </template>
                </VueMultiselect>
              </BFormGroup>
              <BButton @click="clearCustomer" size="sm" type="button" variant="danger" :title="$trans('Clear customer')">
                <IBiBackspace></IBiBackspace>
              </BButton>
            </div>

            <br>
            <BFormGroup
              label-size="sm"
              label=""
              label-for="customeruser_customer"
            >
              <BFormInput
                id="customeruser_customer"
                size="sm"
                readonly
                v-model="customerInfo"
              ></BFormInput>
            </BFormGroup>
          </div>
        </div>
      </div>
    </div>
  </b-overlay>
</template>

<style scoped>
.form-group.inline {
  margin-bottom: 0;
}
</style>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import { useQuery } from '@tanstack/vue-query'
import VueMultiselect from 'vue-multiselect'
import * as v from 'valibot'

import {
  companyCustomeruserCreateMutation,
  companyCustomeruserListQueryKey,
  companyCustomeruserPartialUpdateMutation,
  companyCustomeruserRetrieveOptions,
  customerCustomerAutocompleteListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { CustomerAutocomplete, CustomerUser } from '@/api/types.gen'
import { vCustomerUserRequestWritable } from '@/api/valibot.gen'
import UserIdentityPanel from '../UserIdentityPanel.vue'
import { useUserForm } from '../use-user-form'
import {
  emptyCustomerUser,
  FIELD_MESSAGES,
  parseCustomerUserForm,
  USERNAME_TAKEN_MESSAGE,
  validateCustomerUserForm,
  type CustomerUserFieldErrors,
  type CustomerUserFormValues,
} from './schemas'
import { $trans } from '@/services/i18n'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'

const props = withDefaults(defineProps<{
  pk?: string | number | null
}>(), {
  pk: null,
})

function customerUserFromRecord(record: CustomerUser): { values: CustomerUserFormValues; info: string } {
  const values: CustomerUserFormValues = {
    username: record.username,
    first_name: record.first_name ?? '',
    last_name: record.last_name ?? '',
    email: record.email ?? '',
    password1: '',
    password2: '',
    customer: record.customer_user?.customer ?? null,
    settings_group: record.customer_user?.settings_group ?? '',
  }
  const details = record.customer_details
  const info = details && record.customer_user?.customer !== null
    ? `${details.name}, ${details.address}, ${details.city}`
    : ''
  return { values, info }
}

const {
  values: customerUser,
  errors,
  submitClicked,
  probe,
  record,
  isCreate,
  isLoading: baseIsLoading,
  buttonDisabled,
  submitForm,
  cancelForm,
} = useUserForm<
  CustomerUserFormValues,
  CustomerUser,
  v.InferOutput<typeof vCustomerUserRequestWritable>,
  CustomerUserFieldErrors
>({
  pk: () => props.pk,
  retrieve: (id) => companyCustomeruserRetrieveOptions({path: {id}}),
  create: companyCustomeruserCreateMutation(),
  update: companyCustomeruserPartialUpdateMutation(),
  invalidate: (queryClient) => queryClient.invalidateQueries({queryKey: companyCustomeruserListQueryKey()}),
  empty: () => ({...emptyCustomerUser()}),
  fromRecord: (record) => ({...customerUserFromRecord(record).values}),
  validate: validateCustomerUserForm,
  parse: parseCustomerUserForm,
  takenMessage: USERNAME_TAKEN_MESSAGE,
  copy: {
    fetchError: $trans('Error loading customer user'),
    created: $trans('Created'),
    createdDetail: $trans('Customer user has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Customer user has been updated'),
    createError: $trans('Error creating customer user'),
    updateError: $trans('Error updating customer user'),
  },
})

const customerInfo = ref('')

watch(
  () => record.value,
  (data) => {
    if (!data) return
    customerInfo.value = customerUserFromRecord(data).info
  },
  {immediate: true},
)

// The customer picker: debounced search term feeds the generated
// autocomplete query (same shape as the maintenance-contract customer
// picker); selecting an option pins the id and the display line, clearing
// nulls both again.
const customerSearchTerm = ref('')
const customerQueryTerm = refDebounced(customerSearchTerm, 500)

const customerSearchQuery = useQuery(() => ({
  ...customerCustomerAutocompleteListOptions({query: {q: customerQueryTerm.value}}),
  enabled: customerQueryTerm.value.length > 0,
}))

useQueryErrorToast(customerSearchQuery.error, $trans('Error fetching customers'))

const customerOptions = computed(() => customerSearchQuery.data.value ?? [])
const customerSearchPending = computed(() => customerSearchQuery.isFetching.value)

function customerLabel({ name, city }: { name?: string; city?: string }) {
  return `${name} - ${city}`
}

function selectCustomer(option: CustomerAutocomplete) {
  customerUser.value.customer = option.id
  customerInfo.value = `${option.name}, ${option.address}, ${option.city}`
}

function clearCustomer() {
  customerUser.value.customer = null
  customerInfo.value = ''
}

const isLoading = computed(() => baseIsLoading.value || customerSearchQuery.isLoading.value)
</script>
