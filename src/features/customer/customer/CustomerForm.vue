<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiBuilding></IBiBuilding>
          <span v-if="isCreate">{{ $trans('New customer') }}</span>
          <span v-else>{{ $trans('Edit customer') }}</span>
        </h3>
        <div class="flex-columns">
          <BButton @click="cancelForm" type="button" variant="secondary">
            {{ $trans('Cancel') }}</BButton>
          <BButton @click="submitForm" type="button" variant="primary" :disabled="buttonDisabled">
            {{ $trans('Save') }}</BButton>
        </div>
      </div>
    </header>

    <div class="page-detail">
      <b-overlay :show="isLoading" rounded="sm">
        <div class='flex-columns'>
          <div class='panel col-1-3'>
            <h6>{{ $trans('Customer details')}}</h6>
            <BFormGroup
              label-cols="3"
              label-size="sm"
              :label="$trans('Customer ID')"
              label-for="customer_customer_id"
            >
              <BFormInput
                id="customer_customer_id"
                size="sm"
                v-model="customer.customer_id"
                :readonly="customerIdCreated"
                :state="submitClicked ? !errors.customer_id : null"
              ></BFormInput>
              <p v-if="!customer.customer_id"><BLink @click="getNewCustomerIdFromLatest">{{ $trans('generate new') }}</BLink></p>
              <b-form-invalid-feedback
                :state="submitClicked ? !errors.customer_id : null">
                {{ errors.customer_id || PLACEHOLDERS.customer_id() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="3"
              v-bind:label="$trans('Ext. identifier')"
              label-for="customer_external_identifier"
            >
              <BFormInput
                id="customer_external_identifier"
                size="sm"
                v-model="customer.external_identifier"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="3"
              v-bind:label="$trans('Name')"
              label-for="customer_name"
            >
              <BFormInput
                autofocus
                id="customer_name"
                size="sm"
                v-model="customer.name"
                :state="submitClicked ? !errors.name : null"
              ></BFormInput>
              <b-form-invalid-feedback
                :state="submitClicked ? !errors.name : null">
                {{ errors.name || PLACEHOLDERS.name() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="3"
              v-bind:label="$trans('Address')"
              label-for="customer_address"
            >
              <BFormInput
                id="customer_address"
                size="sm"
                :disabled="useBranchAddress"
                v-model="customer.address"
                :state="submitClicked ? !errors.address : null"
              ></BFormInput>
              <b-form-invalid-feedback
                :state="submitClicked ? !errors.address : null">
                {{ errors.address || PLACEHOLDERS.address() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="3"
              v-bind:label="$trans('Postal')"
              label-for="customer_postal"
            >
              <BFormInput
                id="customer_postal"
                size="sm"
                :disabled="useBranchAddress"
                v-model="customer.postal"
                :state="submitClicked ? !errors.postal : null"
              ></BFormInput>
              <b-form-invalid-feedback
                :state="submitClicked ? !errors.postal : null">
                {{ errors.postal || PLACEHOLDERS.postal() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="3"
              v-bind:label="$trans('City')"
              label-for="customer_city"
            >
              <BFormInput
                id="customer_city"
                size="sm"
                :disabled="useBranchAddress"
                v-model="customer.city"
                :state="submitClicked ? !errors.city : null"
              ></BFormInput>
              <b-form-invalid-feedback
                :state="submitClicked ? !errors.city : null">
                {{ errors.city || PLACEHOLDERS.city() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="3"
              v-bind:label="$trans('Country')"
              label-for="customer_country"
            >
              <BFormSelect
                id="customer_country"
                :disabled="useBranchAddress"
                v-model="customer.country_code"
                :options="countries"
                size="sm"></BFormSelect>

              <b-form-invalid-feedback
                :state="submitClicked ? !errors.country_code : null">
                {{ errors.country_code || PLACEHOLDERS.country_code() }}
              </b-form-invalid-feedback>

            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="3"
              v-bind:label="$trans('Email')"
              label-for="customer_email"
            >
              <BFormInput
                id="customer_email"
                size="sm"
                v-model="customer.email"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="3"
              v-bind:label="$trans('Tel.')"
              label-for="customer_tel"
            >
              <BFormInput
                id="customer_tel"
                size="sm"
                v-model="customer.tel"
                :state="submitClicked ? !errors.tel : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="customer_tel-feedback"
                :state="submitClicked ? !errors.tel : null">
                {{ errors.tel || PLACEHOLDERS.tel() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="3"
              v-bind:label="$trans('Mobile')"
              label-for="customer_mobile"
            >
              <BFormInput
                id="customer_mobile"
                size="sm"
                v-model="customer.mobile"
                :state="submitClicked ? !errors.mobile : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="customer_mobile-feedback"
                :state="submitClicked ? !errors.mobile : null">
                {{ errors.mobile || PLACEHOLDERS.mobile() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="3"
              v-bind:label="$trans('Contact')"
              label-for="customer_contact"
            >
              <BFormTextarea
                id="customer_contact"
                v-model="customer.contact"
                rows="5"
              ></BFormTextarea>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="3"
              v-bind:label="$trans('Remarks')"
              label-for="customer_remarks"
            >
              <BFormTextarea
                id="customer_remarks"
                v-model="customer.remarks"
                rows="5"
              ></BFormTextarea>
            </BFormGroup>
          </div>

          <CustomerFinancialsPanel
            v-model:values="customer"
            :is-create="isCreate"
          />

          <CustomerBranchPanel
            v-model:values="customer"
            v-model:use-branch-address="useBranchAddress"
            :is-create="isCreate"
            :customer-id="customerId"
          />
        </div>
      </b-overlay>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Customer } from '@/api/types.gen'

import {
  customerCustomerCheckCustomerIdHandlingRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import { customerCustomer } from '@/api/resources.gen'
import { customerCustomerGetNewCustomerIdFromLatestRetrieve } from '@/api/sdk.gen'
import CustomerFinancialsPanel from './CustomerFinancialsPanel.vue'
import CustomerBranchPanel from './CustomerBranchPanel.vue'
import {
  customerFromRecord,
  emptyCustomer,
  PLACEHOLDERS,
  parseCustomerCreate,
  parseCustomerPatch,
  validateCustomerForm,
  type CustomerFieldErrors,
  type CustomerFormValues,
} from './schemas'
import { useResourceForm } from '@/features/forms'

const props = withDefaults(defineProps<{
  pk?: string | number | null
}>(), {
  pk: null,
})

const mainStore = useMainStore()

const {
  values: customer,
  errors,
  submitClicked,
  isCreate,
  id: customerId,
  isLoading,
  buttonDisabled,
  submitForm,
  cancelForm,
} = useResourceForm<
  CustomerFormValues,
  Customer,
  ReturnType<typeof parseCustomerCreate> | ReturnType<typeof parseCustomerPatch>,
  CustomerFieldErrors
>({
  pk: () => props.pk,
  resource: customerCustomer,
  createVars: (body) => ({body}),
  empty: () => emptyCustomer(),
  fromRecord: (record) => customerFromRecord(record),
  validate: (values) => validateCustomerForm(values),
  parse: (values, context) => {
    // A customer with no branch partner has no branch, and the wire never
    // carries one. The rule belongs where the body is built rather than in
    // `validate`, which does not decide what is sent and used to mutate the
    // form's own values to say so.
    const body = values.branch_partner === null ? {...values, branch_id: null} : values
    return context.isCreate ? parseCustomerCreate(body) : parseCustomerPatch(body)
  },
  copy: {
    fetchError: $trans('Error loading customer'),
    created: $trans('Created'),
    createdDetail: $trans('Customer has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Customer has been updated'),
    createError: $trans('Error creating customer'),
    updateError: $trans('Error updating customer'),
  },
})

const useBranchAddress = ref(false)

const checkQuery = useQuery({
  ...customerCustomerCheckCustomerIdHandlingRetrieveOptions({}),

  enabled: isCreate.value,
})

const customerIdCreated = ref(true)

watch(
  () => checkQuery.data.value,
  (data) => {
    if (!data) return
    if (data.created) {
      customerIdCreated.value = true

      customer.value.customer_id = String(data.customer_id)
    } else {
      customerIdCreated.value = false
    }
  },
  {immediate: true},
)

const countries = computed(() => mainStore.getCountries)

async function getNewCustomerIdFromLatest() {
  const {data} = await customerCustomerGetNewCustomerIdFromLatestRetrieve({throwOnError: true})
  customer.value.customer_id = String(data.result.last_customer_id)
}
</script>
