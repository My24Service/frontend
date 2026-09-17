<template>
  <b-overlay
    :show="isRecordLoading"
    rounded="sm"
  >
    <div
      v-if="record"
      class="app-page"
    >
      <header>
        <div class="page-title">
          <h3>
            <IBiShop />
            <span
              class="backlink"
              @click="goBack"
            >{{ $trans('Branches') }}</span> /
            <strong>{{ record.name }}</strong>
          </h3>
          <router-link
            v-if="!isEmployee"
            :to="{name: editRoute, params: {pk: subjectId}}"
            class="btn"
          >{{ $trans('Edit branch') }}</router-link>
          <router-link
            v-else
            :to="{name: myRoute}"
            class="btn"
          >{{ $trans('Edit branch') }}</router-link>
        </div>
      </header>
      <div class="page-detail flex-columns">
        <div
          v-if="!isEmployee"
          class="branch-details panel col-1-3"
        >
          <div
            v-if="record.image"
            class="text-center mb-3"
          >
            <img
              :src="record.image"
              class="img-fluid branch-image"
              :alt="record.name"
            >
          </div>
          <BranchCard :branch="record" />
        </div>

        <div class="panel col-2-3">
          <b-tabs>
            <b-tab :title="$trans('Insights')">
              <OrderStats :data-in="statsData" />
            </b-tab>
            <b-tab :title="$trans('Equipment')">
              <b-table
                id="equipment-table"
                small
                :busy="ordersLoading"
                :fields="equipmentFields"
                :items="equipment"
                responsive="md"
                class="data-table"
              >
                <template #cell(icons)="data">
                  <div class="h2 float-right">
                    <span class="button-container">
                      <BButton
                        :to="{name: 'equipment-equipment-edit', params: {pk: data.item.id}}"
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
                    :to="{name: 'equipment-equipment-add'}"
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
                    :to="{name: 'equipment-equipment-list', params: {type: EQUIPMENT_TYPES.TECHNICAL}}"
                    size="sm"
                    type="button"
                    variant="outline-secondary"
                  >
                    {{ $trans('Manage >>') }}
                  </BButton>
                </span>
              </b-row>
            </b-tab>
            <b-tab :title="$trans('Locations')">
              <b-table
                id="branch-location-table"
                small
                :busy="ordersLoading"
                :fields="locationFields"
                :items="locations"
                responsive="md"
                class="data-table"
              >
                <template #cell(icons)="data">
                  <div class="h2 float-right">
                    <span class="button-container">
                      <BButton
                        :to="{name: 'equipment-location-edit', params: {pk: data.item.id}}"
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
              <span class="button-container">
                <BButton
                  class="btn btn-outline-secondary"
                  :to="{name: 'equipment-location-add'}"
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
                  :to="{name: 'equipment-location-list'}"
                  size="sm"
                  type="button"
                  variant="outline-secondary"
                >
                  {{ $trans('Manage >>') }}
                </BButton>
              </span>
            </b-tab>
            <b-tab :title="$trans('Past orders')">
              <div>
                <SearchModal
                  id="search-modal"
                  ref="searchModal"
                  @do-search="handleSearchOk"
                />

                <div
                  class="flex-columns"
                  style="justify-content: space-between;"
                >
                  <span />
                  <span>
                    <BButton-toolbar>
                      <BButton-group class="mr-1">
                        <ButtonLinkRefresh
                          :method="refreshAll"
                          :title="$trans('Refresh')"
                        />
                        <ButtonLinkSearch :method="showSearchModal" />
                      </BButton-group>
                    </BButton-toolbar>
                  </span>
                </div>
                <br>
                <OrdersTable :orders="orders" />
                <b-pagination
                  v-if="count > perPage"
                  v-model="page"
                  class="pt-4"
                  :total-rows="count"
                  :per-page="perPage"
                  aria-controls="orders-table"
                />
              </div>
            </b-tab>
            <template #tabs-end />
          </b-tabs>
        </div>
      </div>
    </div>
  </b-overlay>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import IBiShop from '~icons/bi/shop'
import {
  companyBranchMyRetrieveOptions,
  companyBranchRetrieveOptions,
  equipmentEquipmentListOptions,
  equipmentLocationListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { Branch, EquipmentEquipmentListResponse, EquipmentLocationListResponse } from '@/api/types.gen'
import BranchCard from '@/components/BranchCard.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import OrderStats from '@/components/OrderStats.vue'
import OrdersTable from '@/components/OrdersTable.vue'
import SearchModal from '@/components/SearchModal.vue'
import { EQUIPMENT_TYPES } from '@/constants'
import { useDetailOrders } from '@/features/equipment/detail/use-detail-orders'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { $trans } from '@/services/i18n'
import { useAuthStore } from '@/features/auth/store'

/**
 * The branch detail page, mounted by the company router, the settings layout
 * and the employee dashboard.
 *
 * The reads are the shared detail orders block (`useDetailOrders`, extended
 * with the branch kind) for the past orders and the four Insights payloads,
 * one generated branch read, and the branch's equipment and locations. The
 * three order-domain components mount un-rewritten - `OrdersTable`,
 * `OrderStats` and the stats behind them are their slice's to rewrite, the
 * same cross-slice import the customer and equipment slices document.
 *
 * One subject id for the record, the stats and the equipment and locations
 * tables: the route's `:pk` for planning, the employee's own branch for a
 * branch employee. The orders block is the exception - it narrows to the
 * route pk when the page has one, and reads unfiltered on the dashboard,
 * exactly the calls the legacy screen made (the server pins the employee's
 * scope itself).
 */
const props = withDefaults(defineProps<{
  /** The route's `:pk`, passed through by the layout. Absent on the dashboard. */
  pk?: string | number | null
  /** Mounted by the settings layout, which switches the route name family. */
  from_settings?: boolean
}>(), {
  pk: null,
  from_settings: false,
})

const router = useRouter()
const authStore = useAuthStore()
const isEmployee = computed(() => authStore.isBranchEmployee)
const ownId = computed(() => authStore.branchEmployeeBranch as number | null)

const subjectId = computed(() => (isEmployee.value ? ownId.value : (props.pk == null ? null : Number(props.pk))))
const hasSubject = computed(() => subjectId.value != null)

const editRoute = computed(() => (props.from_settings ? 'settings-branch-edit' : 'company-branch-edit'))
const myRoute = computed(() => (props.from_settings ? 'settings-my-branch' : 'company-my-branch'))

const searchModal = useTemplateRef<{ show: () => void, hide: () => void }>('searchModal')

// Two reads gated by role, not one ternary: a ternary between two generated
// `*Options` is a union `useQuery` rejects.
const detailQuery = useQuery(() => ({
  ...companyBranchRetrieveOptions({ path: { id: subjectId.value ?? 0 } }),
  enabled: !isEmployee.value && hasSubject.value,
}))
const myQuery = useQuery(() => ({
  ...companyBranchMyRetrieveOptions(),
  enabled: isEmployee.value,
}))
useQueryErrorToast(detailQuery.error, $trans('Error fetching branch detail'))
useQueryErrorToast(myQuery.error, $trans('Error fetching branch detail'))

const record = computed(() => (isEmployee.value
  ? myQuery.data.value as Branch | undefined
  : detailQuery.data.value as Branch | undefined))
const isRecordLoading = computed(() => (isEmployee.value ? myQuery.isLoading.value : detailQuery.isLoading.value))

const {
  orders,
  count,
  perPage,
  page,
  isLoading: ordersLoading,
  statsData,
  setSearch,
  refresh,
} = useDetailOrders({
  kind: 'branch',
  // The stats narrow to the viewed branch - the employee's own. The orders
  // block narrows to the route pk when the page has one; the dashboard has
  // none, and reads unfiltered like the legacy screen did.
  pk: subjectId.value ?? 0,
  ordersBranch: props.pk == null ? null : Number(props.pk),
  enabled: hasSubject.value,
})

// The branch's equipment and locations. Planning narrows both to the branch;
// an employee reads the unfiltered collections, whose pinning is the API's -
// exactly the calls the legacy screen made, down to the `page` the old model
// always sent.
const planningEquipmentQuery = useQuery(() => ({
  ...equipmentEquipmentListOptions({ query: { branch: subjectId.value ?? 0, page: 1 } }),
  enabled: !isEmployee.value && hasSubject.value,
}))
const employeeEquipmentQuery = useQuery(() => ({
  ...equipmentEquipmentListOptions({ query: { page: 1 } }),
  enabled: isEmployee.value,
}))
const planningLocationsQuery = useQuery(() => ({
  ...equipmentLocationListOptions({ query: { branch: subjectId.value ?? 0, page: 1 } }),
  enabled: !isEmployee.value && hasSubject.value,
}))
const employeeLocationsQuery = useQuery(() => ({
  ...equipmentLocationListOptions({ query: { page: 1 } }),
  enabled: isEmployee.value,
}))
useQueryErrorToast(planningEquipmentQuery.error, $trans('Error fetching equipment'))
useQueryErrorToast(employeeEquipmentQuery.error, $trans('Error fetching equipment'))
useQueryErrorToast(planningLocationsQuery.error, $trans('Error fetching locations'))
useQueryErrorToast(employeeLocationsQuery.error, $trans('Error fetching locations'))

const equipment = computed(() => ((isEmployee.value ? employeeEquipmentQuery : planningEquipmentQuery).data.value as EquipmentEquipmentListResponse | undefined)?.results ?? [])
const locations = computed(() => ((isEmployee.value ? employeeLocationsQuery : planningLocationsQuery).data.value as EquipmentLocationListResponse | undefined)?.results ?? [])

const equipmentFields = [
  { key: 'name', label: $trans('Equipment') },
  { key: 'brand', label: $trans('Brand') },
  { key: 'created', label: $trans('Created') },
  { key: 'icons', label: '' },
]
const locationFields = [
  { key: 'name', label: $trans('Name') },
  { key: 'created', label: $trans('Created') },
  { key: 'modified', label: $trans('Modified') },
  { key: 'icons', label: '' },
]

function handleSearchOk(value: string) {
  searchModal.value?.hide()
  setSearch(value)
}

function showSearchModal() {
  searchModal.value?.show()
}

function refreshAll() {
  refresh()
  if (isEmployee.value) myQuery.refetch()
  else detailQuery.refetch()
}

function goBack() {
  router.go(-1)
}
</script>

<style scoped>
span.button-container {
  padding: 8px;
}
span.spacer {
  width: 10px;
}
div.spacer {
  margin: 10px;
}
.branch-image {
  max-height: 200px;
  width: 100%;
  object-fit: cover;
  border-radius: 4px;
}
</style>
