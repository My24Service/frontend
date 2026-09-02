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
              <BFormInput
                id="customer_contact"
                v-model="customer.contact"
                rows="5"
              ></BFormInput>
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


          </div> <!-- .panel -->
        </div> <!-- .flex-columns -->
      </b-overlay>
    </div> <!-- .page-detail-->
  </div><!-- .app-page -->
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'
import type Dinero from 'dinero.js'
import type {
  CompanyPartnerBranchCreateFromCustomerCreateData,
  CompanyPartnerCopyCustomerOrdersCreateData,
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
import { invalidateCustomerListQueries } from './list-invalidation'
import { SESSION_AUTH_HEADER } from '../session-auth-header'
import { useMainStore } from '@/stores/main'
import { errorToast, infoToast, $trans } from '@/utils'

/**
 * The Customer create/edit form, rewritten into the feature folder.
 *
 * Reads go through the generated query options (the record under edit, the
 * branch-partner dropdown and, once a partner is picked, its branches);
 * writes go through the generated mutations and invalidate the customer-list
 * queries, so the list shows the saved change when the user comes back.
 *
 * Validation parses the form against the generated request schemas
 * (`./schemas.ts`) — the same schemas the network seam holds request bodies
 * to. The parsed output is exactly what goes on the wire, which is why the
 * saved bodies carry only the fields the API declares: the readonly response
 * fields the old model round-tripped (`id`, the `*_currency` strings,
 * `documents`, `branch_view`, the counts) never leave this component.
 *
 * The branch flow keeps the legacy wiring: choosing a partner loads its
 * branches (the query key folds the partner in, so a change refetches), a
 * sync or a created branch invalidates that query the way the legacy
 * `getBranchesForPartner()` call did, and a customer without a branch
 * partner sends `branch_id: null` — the legacy rule that clears the orphan.
 */

const props = defineProps({
  pk: {
    type: [String, Number],
    default: null,
  },
})

const router = useRouter()
const queryClient = useQueryClient()
const mainStore = useMainStore()
const {create} = useToast()

const isCreate = computed(() => !props.pk)
// Route params arrive as strings; the generated operations want the number.
const customerId = computed(() => Number(props.pk))

// reads -----------------------------------------------------------------

const partnersQuery = useQuery(companyPartnerListOptions({query: {page: 1}}))

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

const detailQuery = useQuery(() => ({
  ...customerCustomerRetrieveOptions({path: {id: customerId.value}, headers: SESSION_AUTH_HEADER}),
  // A create form has no record to fetch; without this the retrieve fires
  // against `undefined`.
  enabled: !isCreate.value,
}))

watch(
  () => detailQuery.error.value,
  (error) => {
    if (error) errorToast(create, $trans('Error loading customer'))
  },
)

const checkQuery = useQuery({
  ...customerCustomerCheckCustomerIdHandlingRetrieveOptions({}),
  // Only the create flow asks how the tenant handles customer ids.
  enabled: isCreate.value,
})

// form state ------------------------------------------------------------

const customer = ref<CustomerFormValues>(emptyCustomer())

/** The create-time fact that the tenant generated the id, so the input is
 * readonly — the legacy `customerIdCreated`, which started true and only a
 * `created: false` answer could turn off. */
const customerIdCreated = ref(true)

watch(
  () => detailQuery.data.value,
  (data) => {
    if (!data) return
    customer.value = customerFromRecord(data)
  },
  {immediate: true},
)

watch(
  () => checkQuery.data.value,
  (data) => {
    if (!data) return
    if (data.created) {
      customerIdCreated.value = true
      // The id arrives as a number; the form carries it as the string the
      // input shows — what the backend stringifies it to anyway.
      customer.value.customer_id = String(data.customer_id)
    } else {
      customerIdCreated.value = false
    }
  },
  {immediate: true},
)

const countries = computed(() => mainStore.getCountries)

// Standard hours: the legacy select held '00'/'15'/'30'/'45' strings that
// DRF coerced; the request schema declares integers, so the options are
// numbers wearing the same labels.
const minutes = [
  {value: 0, text: '00'},
  {value: 15, text: '15'},
  {value: 30, text: '30'},
  {value: 45, text: '45'},
]

// A number input binds strings; the schema wants the number or nothing.
const standardHoursHour = computed({
  get: () => customer.value.standard_hours_hour,
  set: (value: string | number | null) => {
    const parsed = Number(value)
    customer.value.standard_hours_hour = value === '' || value === null || Number.isNaN(parsed)
      ? undefined
      : parsed
  },
})

/** The legacy `setPriceField`: a changed price normalises itself to the
 * dinero amount's own format and currency. */
function applyPrice(field: 'hourly_rate_engineer' | 'call_out_costs', dinero: Dinero.Dinero) {
  customer.value[field] = dinero.toFormat('0.00')
  customer.value[`${field}_currency` as 'hourly_rate_engineer_currency' | 'call_out_costs_currency'] =
    dinero.getCurrency() as string
}

// branch section --------------------------------------------------------

const branchesQuery = useQuery(() => ({
  ...companyPartnerBranchesRetrieveOptions({path: {id: customer.value.branch_partner as number}}),
  // A customer without a branch partner has no branches to ask for; the
  // getter form keeps the query key tracking the partner as it changes.
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

// The schema misdeclares both partner actions' bodies as a Partner; the
// backend reads `customer_id` from the data
// (source/apps/company/views.py:1293-1296 and 1307-1309). Parsing the body
// against the generated schema would strip the one field the endpoint needs,
// so the raw body goes out — the seam tolerates it, because the generated
// write schema happens to ignore unknown keys.
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
    // Already handled: onError told the user.
  }
  syncingOrders.value = false
}

const createBranchMutation = useMutation({
  ...companyPartnerBranchCreateFromCustomerCreateMutation(),
  onSuccess: async (result) => {
    // The legacy flow selected the new branch outright.
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

// one-off read ----------------------------------------------------------

/**
 * "Generate new": a one-shot read whose verdict fills one field and is
 * nowhere displayed again — the raw-SDK rule's exception, called directly
 * with the reasoning above.
 */
async function getNewCustomerIdFromLatest() {
  const {data} = await customerCustomerGetNewCustomerIdFromLatestRetrieve({throwOnError: true})
  customer.value.customer_id = String(data.result.last_customer_id)
}

// writes ----------------------------------------------------------------

const createMutation = useMutation({
  ...customerCustomerCreateMutation({headers: SESSION_AUTH_HEADER}),
  onSuccess: async () => {
    infoToast(create, $trans('Created'), $trans('Customer has been created'))
    await invalidateCustomerListQueries(queryClient)
    router.go(-1)
  },
})

const updateMutation = useMutation({
  ...customerCustomerPartialUpdateMutation(),
  onSuccess: async () => {
    infoToast(create, $trans('Updated'), $trans('Customer has been updated'))
    await invalidateCustomerListQueries(queryClient)
    router.go(-1)
  },
})

const isLoading = computed(() =>
  detailQuery.isLoading.value ||
  saving.value ||
  createMutation.isPending.value ||
  updateMutation.isPending.value)
const buttonDisabled = computed(() =>
  createMutation.isPending.value || updateMutation.isPending.value || saving.value)

// validation ------------------------------------------------------------

const errors = ref<CustomerFieldErrors>({})
const submitClicked = ref(false)
const saving = ref(false)

async function submitForm() {
  if (saving.value) return
  saving.value = true

  try {
    submitClicked.value = true

    // The legacy rule, kept: a customer without a branch partner carries no
    // branch id.
    if (customer.value.branch_partner === null) {
      customer.value.branch_id = null
    }

    const found = validateCustomerForm(customer.value)
    errors.value = found
    if (Object.keys(found).length > 0) return

    // The parsed output is the body — typed by the endpoint's own request
    // schema and stripped of anything it does not declare.
    const body = isCreate.value
      ? parseCustomerCreate(customer.value)
      : parseCustomerPatch(customer.value)

    try {
      if (isCreate.value) {
        await createMutation.mutateAsync({body, headers: SESSION_AUTH_HEADER})
      } else {
        await updateMutation.mutateAsync({path: {id: customerId.value}, body})
      }
    } catch {
      errorToast(create, $trans(isCreate.value ? 'Error creating customer' : 'Error updating customer'))
    }
  } finally {
    saving.value = false
  }
}

function cancelForm() {
  router.go(-1)
}
</script>
