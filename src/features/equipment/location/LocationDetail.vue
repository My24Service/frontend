<template>
  <div
    v-show="location"
    class="app-page"
  >
    <SearchModal
      id="search-modal"
      ref="searchModal"
      @do-search="handleSearchOk"
    />

    <header>
      <div class="page-title">
        <h3>
          <IBiShopWindow />
          <span
            class="backlink"
            @click="goBack"
          >{{ $trans('Locations') }}</span> /
          <span v-if="location">{{ location.name }}</span>
        </h3>
        <BButton-toolbar>
          <router-link
            :to="{name: `${props.route_prefix}-edit`, params: {pk: props.pk}}"
            :class="isDefaultFamily ? 'btn btn-primary' : 'btn'"
          >{{ `${$trans('Edit')} ${$trans('location')}` }}</router-link>
        </BButton-toolbar>
      </div>
    </header>

    <component
      :is="layout"
      v-if="location && !isLoading"
      :details-title="$trans('Location details')"
      :orders-title="isDefaultFamily ? $trans('Past orders') : $trans('Orders')"
      :fields="detailFields"
      @render-stats="renderStats"
    >
      <template
        v-if="hasQr"
        #qr
      >
        <QrPanel
          :qr-url="qrUrl"
          @download="download"
          @recreate="recreateQr"
        />
      </template>

      <template #orders-actions>
        <ActionButton icon="refresh"
          :method="refreshAll"
          :title="$trans('Refresh')"
        />
        <ActionButton icon="search" :method="showSearchModal" />
      </template>

      <template #orders>
        <OrdersTable :orders="orders" />
        <b-pagination
          v-if="count > perPage"
          v-model="page"
          class="pt-4"
          :total-rows="count"
          :per-page="perPage"
          aria-controls="customer-past-table"
        />
      </template>

      <!-- default only: the Insights tab -->
      <template
        v-if="isDefaultFamily"
        #stats
      >
        <OrderStats :data-in="statsData" />
      </template>

      <template #documents>
        <DocumentsComponent
          kind="location"
          :location="location"
          :is-view="true"
        />
      </template>

      <template #equipment>
        <EquipmentAtLocationTable
          :location-id="id"
          :view-route="equipmentViewRoute"
          :is-loading="isLoading"
        />
      </template>
    </component>
  </div>
</template>

<script setup lang="ts">
import {
  equipmentLocationRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import { useQueryErrorToast } from '@/features/forms'
import { $trans } from '@/services/i18n'
import { useMainStore } from '@/stores/main'
import { DocumentsComponent } from '@/features/equipment/documents'
import {
  DetailLayoutSidebar,
  DetailLayoutCards,
  QrPanel,
  useQrCode,
  type DetailField,
  useDetailChrome,
  useDetailOrders,
} from '@/features/shared'
import EquipmentAtLocationTable from './EquipmentAtLocationTable.vue'

/**
 * The location detail page for both product families.
 *
 * The reads live in `useDetailOrders` and one generated detail query; the
 * frame is a layout component per family filled through named slots. The
 * family branches are the edit link's class, the orders title, and the
 * Insights tab (default).
 */
const props = withDefaults(defineProps<{
  /** The route's `:pk`, passed through by the layout. */
  pk?: string | number
  /** The route name stem this mount answers to. */
  route_prefix: string
}>(), {
  pk: '',
})

const id = Number(props.pk)
const mainStore = useMainStore()

const detailQuery = useQuery(equipmentLocationRetrieveOptions({path: {id}}))
useQueryErrorToast(detailQuery.error, $trans('Error fetching location detail'))
const location = computed(() => detailQuery.data.value)

const {orders, count, perPage, page, isLoading, statsData, renderStats, setSearch, refresh} =
  useDetailOrders({kind: 'location', pk: id})

const {hasQr, qrUrl, download, recreateQr} = useQrCode({kind: 'location', id, record: location})

const isDefaultFamily = computed(() => mainStore.getProductFamily === 'default')
const layout = computed(() => (isDefaultFamily.value ? DetailLayoutSidebar : DetailLayoutCards))

const detailFields = computed<DetailField[]>(() =>
  location.value ? [{label: $trans('Name'), value: location.value.name, col: 1}] : [])

/**
 * Where a row in the equipment-at-this-location table links: the same route
 * stem with `location` swapped for `equipment`. Kept as the legacy screen
 * built it, including the mount where the name it produces is not registered -
 * see the module README's preserved-defects list.
 */
const equipmentViewRoute = computed(() => `${props.route_prefix.replace('location', 'equipment')}-view`)

const {handleSearchOk, showSearchModal, refreshAll, goBack} = useDetailChrome({
  orders: {setSearch, refresh},
  detail: detailQuery,
})
</script>
