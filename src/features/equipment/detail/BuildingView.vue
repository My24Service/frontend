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
                <ButtonLinkRefresh
                  :method="refreshAll"
                  :title="$trans('Refresh')"
                />
                <ButtonLinkSearch :method="showSearchModal" />
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
import { computed, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { BButton, BButtonGroup, BButtonToolbar } from 'bootstrap-vue-next'
import { equipmentBuildingRetrieveOptions } from '@/api/@tanstack/vue-query.gen'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import OrderStats from '@/components/OrderStats.vue'
import OrdersTable from '@/components/OrdersTable.vue'
import SearchModal from '@/components/SearchModal.vue'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { $trans } from '@/services/i18n'
import { useMainStore } from '@/stores/main'
import { useDetailOrders } from './use-detail-orders'

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
const router = useRouter()
const mainStore = useMainStore()

const searchModal = useTemplateRef<{show: () => void, hide: () => void}>('searchModal')

const detailQuery = useQuery(equipmentBuildingRetrieveOptions({path: {id}}))
useQueryErrorToast(detailQuery.error, $trans('Error fetching building detail'))
const building = computed(() => detailQuery.data.value)

const {orders, count, perPage, page, isLoading, statsData, setSearch, refresh} =
  useDetailOrders({kind: 'building', pk: id})

// This screen has one mount - the equipment router - and takes no
// `route_prefix`; the legacy screen hardcoded both name stems. The
// `customers-building-*` arm is what it asked for when the member has no
// branches, and no router defines those names: preserved as-is, see the
// module README's preserved-defects list.
const breadcrumb = computed(() => [
  {
    text: $trans('Buildings'),
    to: {name: mainStore.getMemberHasBranches ? 'equipment-building-list' : 'customers-building-list'},
  },
  {text: $trans('Detail'), active: true},
])

function handleSearchOk(value: string) {
  searchModal.value?.hide()
  setSearch(value)
}

function showSearchModal() {
  searchModal.value?.show()
}

function refreshAll() {
  refresh()
  detailQuery.refetch()
}

function goBack() {
  router.go(-1)
}
</script>

<style scoped>
div.spacer {
  margin: 10px;
}
</style>
