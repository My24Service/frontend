<template>
  <b-overlay
    v-if="building"
    :show="isLoading"
    rounded="sm"
  >
    <div class="app-detail">
      <b-breadcrumb
        class="mt-2"
        :items="breadcrumb"
      />
      <b-row align-h="center">
        <h2>{{ building.name }}</h2>
      </b-row>
      <b-row>
        <b-col cols="6">
          <b-table-simple>
            <b-tr>
              <b-td><strong>{{ $trans('Name') }}:</strong></b-td>
              <b-td>{{ building.name }}</b-td>
            </b-tr>
          </b-table-simple>
        </b-col>
        <b-col cols="6" />
      </b-row>

      <OrderStats :data-in="statsData" />

      <div class="spacer" />

      <div>
        <b-row align-h="center">
          <h3>{{ $trans('Orders') }}</h3>
        </b-row>
        <SearchModal
          id="search-modal"
          ref="searchModal"
          @do-search="handleSearchOk"
        />

        <b-pagination
          v-if="count > perPage"
          v-model="page"
          class="pt-4"
          :total-rows="count"
          :per-page="perPage"
          aria-controls="customer-past-table"
        />

        <OrdersTable
          :orders="orders"
          :busy="isLoading"
        >
          <template #head-actions>
            <BButton-toolbar>
              <BButton-group class="mr-1">
                <ActionButton icon="refresh"
                  :method="refreshAll"
                  :title="$trans('Refresh')"
                />
                <ActionButton icon="search" :method="showSearchModal" />
              </BButton-group>
            </BButton-toolbar>
          </template>
        </OrdersTable>
      </div>

      <footer class="modal-footer">
        <BButton
          class="btn btn-info"
          type="button"
          variant="primary"
          @click="goBack"
        >
          {{ $trans('Back') }}
        </BButton>
      </footer>
    </div>
  </b-overlay>
</template>

<script setup lang="ts">
import { equipmentBuildingRetrieveOptions } from '@/api/@tanstack/vue-query.gen'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { $trans } from '@/services/i18n'
import { useMainStore } from '@/stores/main'
import { useDetailChrome } from '@/features/shared/detail/use-detail-chrome'
import { useDetailOrders } from '@/features/shared/detail/use-detail-orders'

/**
 * The building detail page.
 *
 * Unlike equipment and location this page has no product-family frame - it is
 * one layout for both families - so it keeps its own markup. The reads are the
 * same shape though: `useDetailOrders` for the orders block and the four
 * Insights payloads, plus one generated detail query here.
 */
const props = withDefaults(defineProps<{
  /** The route's `:pk`, passed through by the layout. */
  pk?: string | number
}>(), {
  pk: '',
})

const id = Number(props.pk)
const mainStore = useMainStore()

const detailQuery = useQuery(equipmentBuildingRetrieveOptions({path: {id}}))
useQueryErrorToast(detailQuery.error, $trans('Error fetching building detail'))
const building = computed(() => detailQuery.data.value)

const {orders, count, perPage, page, isLoading, statsData, setSearch, refresh} =
  useDetailOrders({kind: 'building', pk: id})

// One name stem, because there is one mount: only `router/equipment.js` renders
// this screen. The legacy breadcrumb branched to an undefined
// `customers-building-list` for a member without branches.
const breadcrumb = computed(() => [
  {text: $trans('Buildings'), to: {name: 'equipment-building-list'}},
  {text: $trans('Detail'), active: true},
])

const {handleSearchOk, showSearchModal, refreshAll, goBack} = useDetailChrome({
  orders: {setSearch, refresh},
  detail: detailQuery,
})
</script>

<style scoped>
div.spacer {
  margin: 10px;
}
</style>
