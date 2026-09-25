<template>
  <UserFormShell
    :username="customerUser.username"
    :is-create="isCreate"
    :is-loading="isLoading"
    :button-disabled="buttonDisabled"
    @cancel="cancelForm"
    @submit="submitForm"
  >

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
                v-model="customerUser.customer_user.settings_group"
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
  </UserFormShell>
</template>

<style scoped>
.form-group.inline {
  margin-bottom: 0;
}
</style>

<script lang="ts" setup>
import UserFormShell from '../UserFormShell.vue'
import VueMultiselect from 'vue-multiselect'
import * as v from 'valibot'

import UserIdentityPanel from '../UserIdentityPanel.vue'
import { emptyUserIdentity, filledFrom, USERNAME_TAKEN_MESSAGE } from '../user-form'
import { useUserForm } from '../use-user-form'
import {
  emptyCustomerUser,
  FIELD_MESSAGES,
  parseCustomerUserForm,
  validateCustomerUserForm,
  type CustomerUserFieldErrors,
  type CustomerUserFormValues,
} from './schemas'
import { useQueryErrorToast } from '@/features/forms'

const props = withDefaults(defineProps<{
  pk?: string | number | null
}>(), {
  pk: null,
})

function customerUserFromRecord(record: Api.CustomerUser): CustomerUserFormValues {
  return {
    ...filledFrom(emptyUserIdentity(), record),
    customer_user: filledFrom(emptyCustomerUser().customer_user, record.customer_user),
  }
}

// The picker's display line is read-only on the wire: it comes with the
// record (`customer_details`), not the form.
function customerInfoOf(record: Api.CustomerUser): string {
  const details = record.customer_details
  return details && record.customer_user?.customer !== null
    ? `${details.name}, ${details.address}, ${details.city}`
    : ''
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
  Api.CustomerUser,
  v.InferOutput<typeof schemas.vCustomerUserRequestWritable>,
  CustomerUserFieldErrors
>({
  pk: () => props.pk,
  resource: Api.CompanyCustomeruser,
  empty: emptyCustomerUser,
  fromRecord: customerUserFromRecord,
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
    customerInfo.value = customerInfoOf(data)
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
  ...Api.CustomerCustomerAutocomplete.list.options({query: {q: customerQueryTerm.value}}),
  enabled: customerQueryTerm.value.length > 0,
}))

useQueryErrorToast(customerSearchQuery.error, $trans('Error fetching customers'))

const customerOptions = computed(() => customerSearchQuery.data.value ?? [])
const customerSearchPending = computed(() => customerSearchQuery.isFetching.value)

function customerLabel({ name, city }: { name?: string; city?: string }) {
  return `${name} - ${city}`
}

function selectCustomer(option: Api.CustomerAutocomplete) {
  customerUser.value.customer_user.customer = option.id
  customerInfo.value = `${option.name}, ${option.address}, ${option.city}`
}

function clearCustomer() {
  customerUser.value.customer_user.customer = null
  customerInfo.value = ''
}

const isLoading = computed(() => baseIsLoading.value || customerSearchQuery.isLoading.value)
</script>
