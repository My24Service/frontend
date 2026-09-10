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
                {{ errors.customer_id || FIELD_MESSAGES.customer_id() }}
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
                {{ errors.name || FIELD_MESSAGES.name() }}
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
                {{ errors.address || FIELD_MESSAGES.address() }}
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
                {{ errors.postal || FIELD_MESSAGES.postal() }}
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
                {{ errors.city || FIELD_MESSAGES.city() }}
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
                {{ errors.country_code || FIELD_MESSAGES.country_code() }}
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
              ></BFormInput>
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
              ></BFormInput>
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

          <div class='panel col-1-3'>
            <h6>{{ $trans('Legal & Financial') }}</h6>
            <BFormGroup
              label-size="sm"
              label-cols="6"
              v-bind:label="$trans('Maintenance contract')"
              label-for="customer_maintenance_contract"
            >
              <BFormTextarea
                id="customer_maintenance_contract"
                v-model="customer.maintenance_contract"
                rows="5"
              ></BFormTextarea>
            </BFormGroup>
            <BFormGroup
              label-cols="6"
              label-size="sm"
              v-bind:label="$trans('Standard hours/mins.')"
              label-for="customer_standard_hours_hour"
            >
              <b-input-group>

                <BFormInput
                  id="customer_standard_hours_hour"
                  size="sm"
                  v-model="standardHoursHour"
                  type="number"
                ></BFormInput>

                <template #append>
                  <BFormSelect v-model="customer.standard_hours_minute" :options="minutes" size="sm"></BFormSelect>
                </template>
              </b-input-group>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="6"
              v-bind:label="$trans('Products without tax?')"
              label-for="customer_products_without_tax"
            >
              <BFormCheckbox
                id="customer_products_without_tax"
                v-model="customer.products_without_tax"
              >
              </BFormCheckbox>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="6"
              v-bind:label="$trans('Hourly rate engineer')"
              label-for="customer_hourly_rate_engineer"
            >
              <PriceInput
                v-model="customer.hourly_rate_engineer"
                :currency="customer.hourly_rate_engineer_currency"
                :allow-empty="isCreate"
                @priceChanged="(dinero) => applyPrice('hourly_rate_engineer', dinero)"
              />
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="6"
              v-bind:label="$trans('Call out costs')"
              label-for="customer_hourly_rate_engineer"
            >
              <PriceInput
                v-model="customer.call_out_costs"
                :currency="customer.call_out_costs_currency"
                :allow-empty="isCreate"
                @priceChanged="(dinero) => applyPrice('call_out_costs', dinero)"
              />
            </BFormGroup>

            <DocumentsComponent
              v-if="customer.id"
              :customer="customer"
              :is-view="false"
            />
          </div>

          <div class='panel col-1-3'>
            <h6>{{ $trans('Orders') }}</h6>
            <div class="branch-section section" v-if="!isCreate && hasBranchPartners">
              <div class='flex-columns space-between'>
                <p>
                  {{ $trans('Customer has ') }} {{ customer.num_orders }} {{ $trans('orders') }},
                  {{ $trans('branch has') }} {{ selectedBranch ? selectedBranch.num_orders : '0' }} {{ $trans('orders') }}.
                </p>
                <BButton
                  @click="syncOrders"
                  type="button"
                  variant="secondary"
                  :disabled="syncingOrders"
                  >
                  <b-spinner v-if="syncingOrders" small></b-spinner>
                  <IBiArrowRepeat v-else></IBiArrowRepeat>
                  &nbsp; {{ $trans('Synchronize orders') }}
                </BButton>

              </div>
              <hr/>
              <details open>
                <summary class="flex-columns space-between">
                  <h6>{{ $trans('branch') }} </h6><IBiChevronDown></IBiChevronDown>
                </summary>
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Partner')"
                  label-for="customer_branch_partners"
                >
                  <BFormSelect
                    id="customer_branch_partners"
                    v-model="customer.branch_partner"
                    :options="branchPartners"
                    size="sm"
                  ></BFormSelect>
                </BFormGroup>

                <BFormGroup label="Branches" v-if="customer.branch_partner !== null && branches.length > 0">
                  <BFormRadio
                    :key="branch.id"
                    v-for="branch in branches"
                    v-model="customer.branch_id"
                    name="branch"
                    :value="branch.id"
                  >
                    {{ branch.name }} - {{ branch.city }} ({{ branch.country_code }})
                  </BFormRadio>
                </BFormGroup>
                <hr>
                <BFormGroup v-if="customer.branch_partner !== null" >
                  <p class="flex-columns space-between align-items-center">
                  {{ $trans("Branch not listed? Create from customer data.") }}
                  <BButton @click="createBranchFromCustomer" type="button" variant="secondary">
                    {{ $trans('Create') }}</BButton>
                  </p>
                </BFormGroup>
                <hr>
                <BFormGroup
                  label-size="sm"
                  label-cols="4"
                  v-bind:label="$trans('Use address from branch')"
                  label-for="customer_use_branch_address"
                >
                  <BFormCheckbox
                    id="customer_use_branch_address"
                    :value="true"
                    v-model="customer.use_branch_address"
                  >
                  </BFormCheckbox>
                </BFormGroup>
              </details>
            </div>


          </div>
        </div>
      </b-overlay>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'
import type Dinero from 'dinero.js'
import type {
  CompanyPartnerBranchCreateFromCustomerCreateData,
  CompanyPartnerCopyCustomerOrdersCreateData,
  Customer,
} from '@/api/types.gen'

import {
  companyPartnerBranchCreateFromCustomerCreateMutation,
  companyPartnerBranchesRetrieveOptions,
  companyPartnerBranchesRetrieveQueryKey,
  companyPartnerCopyCustomerOrdersCreateMutation,
  companyPartnerListOptions,
  customerCustomerCheckCustomerIdHandlingRetrieveOptions,
  customerCustomerCreateMutation,
  customerCustomerPartialUpdateMutation,
  customerCustomerRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import { customerCustomerGetNewCustomerIdFromLatestRetrieve } from '@/api/sdk.gen'
import PriceInput from '@/components/PriceInput.vue'
import DocumentsComponent from '../document/DocumentPanel.vue'
import {
  customerFromRecord,
  emptyCustomer,
  FIELD_MESSAGES,
  parseCustomerCreate,
  parseCustomerPatch,
  validateCustomerForm,
  type CustomerFieldErrors,
  type CustomerFormValues,
} from './schemas'
import { customerCustomerListQueryKey } from '@/api/@tanstack/vue-query.gen'
import { SESSION_AUTH_HEADER } from '@/features/shared/session-auth-header'
import { useMainStore } from '@/stores/main'
import { errorToast, infoToast, $trans } from '@/services/i18n'
import { useResourceForm } from '@/features/forms/use-resource-form'




const props = withDefaults(defineProps<{
  pk?: string | number | null
}>(), {
  pk: null,
})

const queryClient = useQueryClient()
const mainStore = useMainStore()
const {create} = useToast()

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
  retrieve: (id) => customerCustomerRetrieveOptions({path: {id}, headers: SESSION_AUTH_HEADER}),
  create: customerCustomerCreateMutation(),
  update: customerCustomerPartialUpdateMutation(),
  createVars: (body) => ({body, headers: SESSION_AUTH_HEADER}),
  invalidate: (qc) => qc.invalidateQueries({queryKey: customerCustomerListQueryKey()}),
  empty: () => emptyCustomer(),
  fromRecord: (record) => customerFromRecord(record),
  validate: (values) => {
    if (values.branch_partner === null) {
      values.branch_id = null
    }
    return validateCustomerForm(values)
  },
  parse: (values, context) => (context.isCreate ? parseCustomerCreate(values) : parseCustomerPatch(values)),
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



// The partner dropdown must offer every partner, not the first page of them.
// 1000 is the API's own ceiling: `My24Pagination.max_page_size` (my24service
// `source/apps/core/rest.py:236`), which DRF clamps a larger value down to
// rather than rejecting it, so this is the most one response can carry.
const WHOLE_COLLECTION_PAGE_SIZE = 1000

const partnersQuery = useQuery(
  companyPartnerListOptions({query: {page: 1, page_size: WHOLE_COLLECTION_PAGE_SIZE}}),
)

const branchPartners = computed(() => {
  const partners = partnersQuery.data.value?.results ?? []
  return [
    {value: null as number | null, text: '-'},
    ...partners
      .filter((partner) => partner.partner_view.has_branches)
      .map((partner) => ({
        value: partner.id as number,
        text: `${partner.partner_view.companycode} - ${partner.partner_view.city}`,
      })),
  ]
})

const hasBranchPartners = computed(() => branchPartners.value.length > 1)

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


const minutes = [
  {value: 0, text: '00'},
  {value: 15, text: '15'},
  {value: 30, text: '30'},
  {value: 45, text: '45'},
]


const standardHoursHour = computed({
  get: () => customer.value.standard_hours_hour,
  set: (value: string | number | null) => {
    const parsed = Number(value)
    customer.value.standard_hours_hour = value === '' || value === null || Number.isNaN(parsed)
      ? undefined
      : parsed
  },
})


function applyPrice(field: 'hourly_rate_engineer' | 'call_out_costs', dinero: Dinero.Dinero) {
  customer.value[field] = dinero.toFormat('0.00')
  customer.value[`${field}_currency` as 'hourly_rate_engineer_currency' | 'call_out_costs_currency'] =
    dinero.getCurrency() as string
}



const branchesQuery = useQuery(() => ({
  ...companyPartnerBranchesRetrieveOptions({path: {id: customer.value.branch_partner as number}}),

  enabled: customer.value.branch_partner != null,
}))

const branches = computed(() => branchesQuery.data.value?.branches ?? [])

const selectedBranch = computed(() =>
  branches.value.find((branch) => branch.id === customer.value.branch_id))

const useBranchAddress = computed(() =>
  hasBranchPartners.value && customer.value.branch_id !== null && customer.value.use_branch_address)

function invalidateBranches() {
  return queryClient.invalidateQueries({
    queryKey: companyPartnerBranchesRetrieveQueryKey(
      {path: {id: customer.value.branch_partner as number}},
    ),
  })
}


type CopyOrdersBody = CompanyPartnerCopyCustomerOrdersCreateData['body']
type CreateBranchBody = CompanyPartnerBranchCreateFromCustomerCreateData['body']

const copyOrdersMutation = useMutation({
  ...companyPartnerCopyCustomerOrdersCreateMutation(),
  onSuccess: async () => {
    infoToast(create, $trans('Synced'), $trans('Orders synced'))
    await invalidateBranches()
  },
  onError: () => {
    errorToast(create, $trans('Error syncing orders'))
  },
})

const syncingOrders = ref(false)

async function syncOrders() {
  if (customer.value.branch_partner == null) return
  syncingOrders.value = true
  try {
    await copyOrdersMutation.mutateAsync({
      path: {id: customer.value.branch_partner},
      body: {customer_id: customerId.value} as CopyOrdersBody,
    })
  } catch {

  }
  syncingOrders.value = false
}

const createBranchMutation = useMutation({
  ...companyPartnerBranchCreateFromCustomerCreateMutation(),
  onSuccess: async (result) => {

    customer.value.branch_id = result.branch.id
    await invalidateBranches()
  },
})

async function createBranchFromCustomer() {
  if (customer.value.branch_partner == null) return
  if (confirm($trans('Create branch from customer?'))) {
    await createBranchMutation.mutateAsync({
      path: {id: customer.value.branch_partner},
      body: {customer_id: customerId.value} as CreateBranchBody,
    })
  }
}




async function getNewCustomerIdFromLatest() {
  const {data} = await customerCustomerGetNewCustomerIdFromLatestRetrieve({throwOnError: true})
  customer.value.customer_id = String(data.result.last_customer_id)
}
</script>
