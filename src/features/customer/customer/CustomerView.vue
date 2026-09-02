<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
      <header>
        <div class="page-title">
          <h3>
            <IBiBuilding></IBiBuilding>
            <span class="backlink" @click="goBack">{{ $trans("Customers") }}</span> / {{  customer.name }}
          </h3>
          <router-link v-if="pk" class="btn btn-primary" :to="{name:'customer-edit', params: {pk: pk}}">
            <IBiPencil font-scale="0.95"></IBiPencil> &nbsp; {{ $trans('Edit customer') }}
          </router-link>
        </div>
      </header>

      <div class="page-detail customer-details" v-if="!isCustomer">

        <div class='flex-columns'>
          <div class="panel col-1-3 sidebar">
            <CustomerCard :customer="customer" />
          </div>
          <div class="panel col-2-3">
            <b-tabs>
              <b-tab :title="$trans('Orders')">
                <div class="overflow-auto">
                  <OrdersTable :orders="orders" :hide-columns="['order_name']" />

                  <b-pagination
                    v-if="orderCount > 20"
                    class="pt-4"
                    :model-value="ordersPage"
                    :total-rows="orderCount"
                    :per-page="PER_PAGE"
                    aria-controls="customer-orders-table"
                    @update:model-value="goToOrdersPage"
                  ></b-pagination>

                </div>
              </b-tab>
              <b-tab :title="$trans('Equipment')">
                <span class="button-container">
                  <BButton
                    class="btn btn-outline-secondary"
                    :to="{name: 'customers-equipment-add'}"
                    size="sm"
                    type="button"
                    variant="outline-secondary"
                  >
                    {{ $trans('Add equipment') }}
                  </BButton>
                </span>
                <span class="button-container">
                  <BButton
                    class="btn btn-outline-secondary"
                    :to="{name: 'customers-equipment-list'}"
                    size="sm"
                    type="button"
                    variant="outline-secondary"
                  >
                    {{ $trans('Manage equipment') }}
                  </BButton>
                </span>
                <hr/>
                <b-table
                  id="customer-equipment-table"
                  small
                  :busy='isLoading'
                  :fields="equipmentFields"
                  :items="equipmentRows"
                  responsive="md"
                  class="data-table"
                >
                  <template #cell(customer)="data">
                    {{ data.item.customer_branch_view.name }} - {{ data.item.customer_branch_view.city }}
                  </template>
                  <template #cell(branch)="data">
                    {{ data.item.customer_branch_view.name }} - {{ data.item.customer_branch_view.city }}
                  </template>
                  <template #cell(icons)="data">
                    <div class="h2 float-right">
                      <span class="button-container">
                        <BButton
                          :to="{name: 'customers-equipment-edit', params: {pk: data.item.id}}"
                          class="btn btn-outline-secondary"
                          size="sm"
                          type="button"
                          variant="outline-secondary"
                        >
                          {{ $trans('Edit') }}
                        </BButton>
                      </span>
                    </div>
                  </template>
                </b-table>
              </b-tab>
              <b-tab :title="$trans('Maintenance contracts')">
                <!-- <h6>{{ $trans("Maintenance contracts") }}</h6> -->
                <b-table
                    id="customer-maintenance-contracts-table"
                    small
                    :busy='isLoading'
                    :fields="maintenanceContractFields"
                    :items="contractRows"
                    responsive="md"
                    class="data-table"
                  >
                    <template #cell(contract)="data">
                      <b-row>
                        <b-col cols="5">
                          <table class="totals">
                            <tbody>
                              <tr>
                                <td><strong>{{ $trans('Name') }}:</strong></td>
                                <td>{{ data.item.name }}</td>
                              </tr>
                              <tr>
                                <td><strong>{{ $trans('Contract value') }}:</strong></td>
                                <td>EUR {{ data.item.contract_value }}</td>
                              </tr>
                            </tbody>
                          </table>
                        </b-col>
                        <b-col cols="4">
                          <table class="totals">
                            <tbody>
                              <tr>
                                <td><strong>{{ $trans('Created orders') }}</strong></td>
                                <td>{{ data.item.created_orders}}</td>
                              </tr>
                              <tr>
                                <td><strong>{{ $trans('# equipment in orders') }}</strong></td>
                                <td>{{ data.item.num_order_equipment}}</td>
                              </tr>
                            </tbody>
                          </table>
                        </b-col>
                        <b-col cols="3">
                          <div class="float-right">
                            <span class="button-container">
                              <BButton
                                class="btn btn-outline-primary"
                                :to="{name: 'order-add-maintenance'}"
                                size="sm"
                                type="button"
                                variant="outline-primary"
                              >
                                {{ $trans('Create order') }}
                              </BButton>
                            </span>

                            <span class="button-container">
                              <BButton
                                :to="{name: 'maintenance-contract-edit', params: {pk: data.item.id}}"
                                class="btn btn-outline-secondary"
                                size="sm"
                                type="button"
                                variant="outline-secondary"
                              >
                                {{ $trans('Edit') }}
                              </BButton>
                            </span>
                          </div>
                        </b-col>
                      </b-row>
                    </template>
                </b-table>
                <hr/>
                <span class="button-container">
                <BButton
                  class="btn btn-outline-secondary"
                  :to="{name: 'maintenance-contract-add'}"
                  size="sm"
                  type="button"
                  variant="outline-secondary"
                >
                  {{ $trans('Add contract') }}
                </BButton>
              </span>
              <span class="button-container">
                <BButton
                  class="btn btn-outline-secondary"
                  :to="{name: 'maintenance-contracts'}"
                  size="sm"
                  type="button"
                  variant="outline-secondary"
                >
                  {{ $trans('Manage contracts') }}
                </BButton>
              </span>
              </b-tab>
              <b-tab :title="$trans('Locations')">
                <b-table
                  id="customer-location-table"
                  small
                  :busy='isLoading'
                  :fields="locationFields"
                  :items="locationRows"
                  responsive="md"
                  class="data-table">
                  <template #cell(customer)="data">
                    {{ data.item.customer_branch_view.name }} - {{ data.item.customer_branch_view.city }}
                  </template>
                  <template #cell(branch)="data">
                    {{ data.item.customer_branch_view.name }} - {{ data.item.customer_branch_view.city }}
                  </template>
                  <template #cell(icons)="data">
                    <div class="h2 float-right">
                      <span class="button-container">
                        <BButton
                          :to="{name: 'customers-location-edit', params: {pk: data.item.id}}"
                          class="btn btn-outline-secondary"
                          size="sm"
                          type="button"
                          variant="outline-secondary"
                        >
                          {{ $trans('Edit') }}
                        </BButton>
                      </span>
                    </div>
                  </template>
                </b-table>
                <b-row align-h="end">
                  <span class="button-container">
                    <BButton
                      class="btn btn-outline-secondary"
                      :to="{name: 'customers-location-add'}"
                      size="sm"
                      type="button"
                      variant="outline-secondary"
                    >
                      {{ $trans('New') }}
                    </BButton>
                  </span>
                  <span class="button-container">
                    <BButton
                      class="btn btn-outline-secondary"
                      :to="{name: 'customers-location-list'}"
                      size="sm"
                      type="button"
                      variant="outline-secondary"
                    >
                      {{ $trans('Manage >>') }}
                    </BButton>
                  </span>
                </b-row>
              </b-tab>
              <b-tab :title="$trans('Insights')" key="stats" @click="insightsOpened = true">
                <OrderStats
                  :data-in="statsData"
                  ref="order-stats"
                />
              </b-tab>
            </b-tabs>
          </div>
        </div>

      </div>
    </div>
  </b-overlay>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'

import type { Customer, MaintenanceContract } from '@/api/types.gen'
import {
  customerCustomerRetrieveOptions,
  customerMaintenanceContractListOptions,
  equipmentEquipmentListOptions,
  equipmentLocationListOptions,
  orderOrderAllForCustomerWebListOptions,
  orderOrderCountsYearOrderTypeStatsRetrieveOptions,
  orderOrderOrderCountsStatsRetrieveOptions,
  orderOrderOrderTypesMonthStatsRetrieveOptions,
  orderOrderOrderTypesStatsRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import { useAuthStore } from '@/stores/auth'
import CustomerCard from '@/components/CustomerCard.vue'
import OrdersTable from '@/components/OrdersTable.vue'
import OrderStats from '@/components/OrderStats.vue'
import { errorToast, $trans } from '@/utils'
import { SESSION_AUTH_HEADER } from '../session-auth-header'

/**
 * The customer detail view, rewritten into the feature folder.
 *
 * One component serves two very different users, exactly as the legacy screen
 * did: staff at `/customers/customers/:pk` get the record's orders (via the
 * `all_for_customer_web` action), maintenance contracts, the record itself
 * and its locations and equipment; a customer-type user at
 * `/customers/dashboard` gets their own — the backend scopes every read to
 * the signed-in customer, so the queries simply carry no customer filter
 * there. The legacy screen sent `customer_id=null` on the dashboard's order
 * fetch; the action ignores the parameter for a customer user
 * (source/apps/order/views/mixins/queryset.py:28-35), so the omitted
 * parameter is the same request, truthfully typed.
 *
 * The page-detail content only renders for staff — as it always did. The
 * dashboard's three fetches still fire (they are what the legacy wire saw);
 * what they return has nowhere to show up, which is the legacy state of
 * things too.
 */

const props = defineProps({
  pk: {
    type: [String, Number],
    default: null,
  },
})

const router = useRouter()
const {create} = useToast()

// Route params arrive as strings; the generated operations want the number.
const customerId = computed(() => Number(props.pk))

const PER_PAGE = 20

const authStore = useAuthStore()
const isCustomer = computed(() => authStore.isCustomer)

// reads -----------------------------------------------------------------

const ordersPage = ref(1)
const insightsOpened = ref(false)

const ordersQuery = useQuery(() => ({
  ...orderOrderAllForCustomerWebListOptions({
    query: {
      // A staff visit names the customer; a customer-type user's own orders
      // need no id at all (the backend scopes it).
      ...(isCustomer.value ? {} : {customer_id: customerId.value}),
      page: ordersPage.value,
    },
  }),
}))

const orders = computed(() => ordersQuery.data.value?.results ?? [])
const orderCount = computed(() => ordersQuery.data.value?.count ?? 0)

watch(
  () => ordersQuery.error.value,
  (error) => {
    if (error) errorToast(create, $trans('Error fetching customer orders'))
  },
)

function goToOrdersPage(page: number | string) {
  ordersPage.value = Number(page)
}

const maintenanceContractsQuery = useQuery(() => ({
  ...customerMaintenanceContractListOptions({
    query: {page: 1, ...(isCustomer.value ? {} : {customer: customerId.value})},
  }),
  enabled: !isCustomer.value,
}))
const maintenanceContracts = computed(() => maintenanceContractsQuery.data.value?.results ?? [])

/** `contract_value` left the backend in migration 0009 (renamed on
 * MaintenanceEquipment) — the generated type no longer declares it — but the
 * legacy template still renders its slot, empty as it is. Kept as seen. */
type ContractRow = MaintenanceContract & {contract_value?: string}
const contractRows = computed(() => maintenanceContracts.value as ContractRow[])

/** The equipment/location rows carry the parent record in
 * `customer_branch_view`; the template reads it directly, as the legacy
 * screen always did. */
type BranchRow = Record<string, any> & {id: number}
const locationRows = computed(() => locations.value as BranchRow[])
const equipmentRows = computed(() => equipment.value as BranchRow[])

const detailQuery = useQuery(() => ({
  ...customerCustomerRetrieveOptions({path: {id: customerId.value}, headers: SESSION_AUTH_HEADER}),
  // The dashboard has no record to fetch; the legacy screen only read one
  // for staff.
  enabled: !isCustomer.value,
}))

watch(
  () => detailQuery.error.value,
  (error) => {
    if (error) errorToast(create, $trans('Error fetching orders'))
  },
)

/** The record as the header and CustomerCard read it — an empty shell where
 * no record was fetched, exactly the legacy `new CustomerModel({})`. */
const customer = computed<Customer>(() => detailQuery.data.value ?? ({} as Customer))

const locationsQuery = useQuery(() => ({
  ...equipmentLocationListOptions({
    query: {page: 1, ...(isCustomer.value ? {} : {customer: customerId.value})},
  }),
}))
const locations = computed(() => locationsQuery.data.value?.results ?? [])

const equipmentQuery = useQuery(() => ({
  ...equipmentEquipmentListOptions({
    query: {page: 1, ...(isCustomer.value ? {} : {customer: customerId.value})},
  }),
}))
const equipment = computed(() => equipmentQuery.data.value?.results ?? [])

// Insights: the four statistics reads fire when the tab opens, as the legacy
// tab's @click did — and not before.
const orderTypesStatsQuery = useQuery(() => ({
  ...orderOrderOrderTypesStatsRetrieveOptions({
    query: isCustomer.value ? {} : {customer: customerId.value},
  }),
  enabled: insightsOpened.value,
}))
const orderCountsStatsQuery = useQuery(() => ({
  ...orderOrderOrderCountsStatsRetrieveOptions({
    query: isCustomer.value ? {} : {customer: customerId.value},
  }),
  enabled: insightsOpened.value,
}))
const orderTypesMonthStatsQuery = useQuery(() => ({
  ...orderOrderOrderTypesMonthStatsRetrieveOptions({
    query: isCustomer.value ? {} : {customer: customerId.value},
  }),
  enabled: insightsOpened.value,
}))
const countsYearStatsQuery = useQuery(() => ({
  ...orderOrderCountsYearOrderTypeStatsRetrieveOptions({
    query: isCustomer.value ? {} : {customer: customerId.value},
  }),
  enabled: insightsOpened.value,
}))

const statsData = computed(() => ({
  orderTypeStatsData: orderTypesStatsQuery.data.value?.order_types_stats ?? {},
  monthsStatsData: orderCountsStatsQuery.data.value?.order_counts_stats ?? {},
  orderTypesMonthStatsData: orderTypesMonthStatsQuery.data.value?.order_types_month_stats ?? {},
  countsYearOrdertypeStats: countsYearStatsQuery.data.value?.counts_year_order_type_stats ?? {},
}))

// columns ----------------------------------------------------------------

// The legacy screen kept two identical column arrays (`locationFieldsCustomer`
// and `locationFieldsBranch`, same for equipment) behind a `hasBranches`
// if/else. Identical is identical; one array with the story here.
const locationFields = [
  {key: 'name', label: $trans('Name')},
  {key: 'created', label: $trans('Created')},
  {key: 'modified', label: $trans('Modified')},
  {key: 'icons', label: ''},
]
const equipmentFields = [
  {key: 'name', label: $trans('Equipment')},
  {key: 'brand', label: $trans('Brand')},
  {key: 'created', label: $trans('Created')},
  {key: 'icons', label: ''},
]
const maintenanceContractFields = [
  {key: 'contract', label: $trans('Contract')},
]

const isLoading = computed(() =>
  ordersQuery.isLoading.value ||
  maintenanceContractsQuery.isLoading.value ||
  detailQuery.isLoading.value ||
  locationsQuery.isLoading.value ||
  equipmentQuery.isLoading.value)

function goBack() {
  router.go(-1)
}
</script>

<style scoped>
table.totals tr:first-child td {
  border-top: none;
}
span.button-container {
  padding: 8px;
}
p {
  line-height: 1.7;
  padding-top: 0.5rem;
}
.flex-columns > .panel {
  max-width: unset;
}
</style>
