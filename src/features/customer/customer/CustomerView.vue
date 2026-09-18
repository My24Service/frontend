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
                    {{ data.item.customer_branch_view?.name }} - {{ data.item.customer_branch_view?.city }}
                  </template>
                  <template #cell(branch)="data">
                    {{ data.item.customer_branch_view?.name }} - {{ data.item.customer_branch_view?.city }}
                  </template>
                  <template #cell(icons)="data">
                    <div class="h2 float-end">
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
                                <td>{{ formatContractValue(data.item) }}</td>
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
                          <div class="float-end">
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
                    {{ data.item.customer_branch_view?.name }} - {{ data.item.customer_branch_view?.city }}
                  </template>
                  <template #cell(branch)="data">
                    {{ data.item.customer_branch_view?.name }} - {{ data.item.customer_branch_view?.city }}
                  </template>
                  <template #cell(icons)="data">
                    <div class="h2 float-end">
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
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'

import type { Customer, MaintenanceContract } from '@/api/types.gen'
import {
  customerCustomerDashboardRetrieveOptions,
  customerMaintenanceContractListOptions,
  equipmentEquipmentListOptions,
  equipmentLocationListOptions,
} from '@/api/@tanstack/vue-query.gen'
import { useAuthStore } from '@/features/auth'
import { tryToDinero } from '../maintenance-contract/dinero-helpers'
import { useMainStore } from '@/stores/main'
import CustomerCard from '../CustomerCard.vue'
import OrdersTable from '@/components/OrdersTable.vue'
import OrderStats from '@/components/OrderStats.vue'
import { $trans } from '@/services/i18n'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { WHOLE_COLLECTION_PAGE_SIZE } from '@/features/table/server-paged-list'




const props = withDefaults(defineProps<{
  pk?: string | number | null
}>(), {
  pk: null,
})

const router = useRouter()


const customerId = computed(() => Number(props.pk))

const PER_PAGE = 20

// The contracts, locations and equipment tabs are embedded detail tables with
// no page control, so each asks for the whole collection in one read instead of
// its first page. 1000 is the API's own ceiling (`My24Pagination.max_page_size`,
// my24service `source/apps/core/rest.py:236`), which DRF clamps a larger value
// down to rather than rejecting it.

const authStore = useAuthStore()
const mainStore = useMainStore()
const isCustomer = computed(() => authStore.isCustomer)

function formatContractValue(contract: MaintenanceContract): string {
  const dinero = tryToDinero(contract.sum_tariffs, mainStore.getDefaultCurrency)
  return dinero ? dinero.toFormat('$0.00') : ''
}



const ordersPage = ref(1)
const insightsOpened = ref(false)

// One query for the customer head, its orders page and the four stats
// blocks the insights tab charts; the contracts, locations and equipment
// tabs keep their own whole-collection reads.
const dashboardQuery = useQuery(() => ({
  ...customerCustomerDashboardRetrieveOptions({
    path: {id: customerId.value},
    query: {orders_page: ordersPage.value},
  }),
  enabled: !isCustomer.value,
}))
useQueryErrorToast(dashboardQuery.error, $trans('Error loading customer'))

const orders = computed(() => dashboardQuery.data.value?.orders.results ?? [])
const orderCount = computed(() => dashboardQuery.data.value?.orders.count ?? 0)

function goToOrdersPage(page: number | string) {
  ordersPage.value = Number(page)
}

const maintenanceContractsQuery = useQuery(() => ({
  ...customerMaintenanceContractListOptions({
    query: {
      page: 1,
      page_size: WHOLE_COLLECTION_PAGE_SIZE,
      ...(isCustomer.value ? {} : {customer: customerId.value}),
    },
  }),
  enabled: !isCustomer.value,
}))
const maintenanceContracts = computed(() => maintenanceContractsQuery.data.value?.results ?? [])
useQueryErrorToast(maintenanceContractsQuery.error, $trans('Error loading maintenance contracts'))


const contractRows = computed(() => maintenanceContracts.value)


const locationRows = computed(() => locations.value)
const equipmentRows = computed(() => equipment.value)

const customer = computed<Customer>(() => dashboardQuery.data.value?.customer ?? ({} as Customer))

const locationsQuery = useQuery(() => ({
  ...equipmentLocationListOptions({
    query: {
      page: 1,
      page_size: WHOLE_COLLECTION_PAGE_SIZE,
      ...(isCustomer.value ? {} : {customer: customerId.value}),
    },
  }),
}))
const locations = computed(() => locationsQuery.data.value?.results ?? [])

const equipmentQuery = useQuery(() => ({
  ...equipmentEquipmentListOptions({
    query: {
      page: 1,
      page_size: WHOLE_COLLECTION_PAGE_SIZE,
      ...(isCustomer.value ? {} : {customer: customerId.value}),
    },
  }),
}))
const equipment = computed(() => equipmentQuery.data.value?.results ?? [])


const statsData = computed(() => ({
  orderTypeStatsData: dashboardQuery.data.value?.order_types_stats ?? {},
  monthsStatsData: dashboardQuery.data.value?.order_counts_stats ?? {},
  orderTypesMonthStatsData: dashboardQuery.data.value?.order_types_month_stats ?? {},
  countsYearOrdertypeStats: dashboardQuery.data.value?.counts_year_order_type_stats ?? {},
}))




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
  dashboardQuery.isLoading.value ||
  maintenanceContractsQuery.isLoading.value ||
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
