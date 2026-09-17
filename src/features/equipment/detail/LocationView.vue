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
        <div
          v-if="qrUrl"
          class="qr-container mb-3"
        >
          <BLink
            class="btn btn-sm btn-outline mb-2"
            :href="qrUrl"
            target="_blank"
            :title="$trans('Open QR in new tab')"
          >
            <img
              :alt="$trans('QR code')"
              class="qr-code-image img-fluid"
              :src="qrUrl"
            >
          </BLink>
          <p class="mb-0">
            <a
              href="javascript:"
              @click="download()"
            >{{ $trans('Download') }}</a>
          </p>
        </div>
        <img
          v-else
          :alt="$trans('No QR yet')"
          class="qr-code-image img-fluid mb-3"
          :src="NO_IMAGE_URL"
        >
        <p>
          <BButton
            variant="primary"
            size="sm"
            @click="recreateQr"
          >
            {{ $trans('Recreate') }}
          </BButton>
        </p>
      </template>

      <template #orders-actions>
        <ButtonLinkRefresh
          :method="refreshAll"
          :title="$trans('Refresh')"
        />
        <ButtonLinkSearch :method="showSearchModal" />
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
import { computed, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { BButton, BButtonToolbar, BLink, useToast } from 'bootstrap-vue-next'
import IBiShopWindow from '~icons/bi/shop-window'
import {
  equipmentLocationCreateQrCreateMutation,
  equipmentLocationRetrieveOptions,
  equipmentLocationRetrieveQueryKey,
} from '@/api/@tanstack/vue-query.gen'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import OrderStats from '@/components/OrderStats.vue'
import OrdersTable from '@/components/OrdersTable.vue'
import SearchModal from '@/components/SearchModal.vue'
import { NO_IMAGE_URL } from '@/constants'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { $trans, errorToast } from '@/services/i18n'
import my24 from '@/services/my24'
import { useMainStore } from '@/stores/main'
import DocumentsComponent from '../documents/DocumentsComponent.vue'
import DetailLayoutDefault from './DetailLayoutDefault.vue'
import DetailLayoutShltr from './DetailLayoutShltr.vue'
import EquipmentAtLocationTable from './EquipmentAtLocationTable.vue'
import type { DetailField } from './detail-fields'
import { useDetailOrders } from './use-detail-orders'

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
const router = useRouter()
const mainStore = useMainStore()
const queryClient = useQueryClient()

const searchModal = useTemplateRef<{show: () => void, hide: () => void}>('searchModal')
const {create} = useToast()

const detailQuery = useQuery(equipmentLocationRetrieveOptions({path: {id}}))
useQueryErrorToast(detailQuery.error, $trans('Error fetching location detail'))
const location = computed(() => detailQuery.data.value)

const {orders, count, perPage, page, isLoading, statsData, renderStats, setSearch, refresh} =
  useDetailOrders({kind: 'location', pk: id})

const recreateQrMutation = useMutation(equipmentLocationCreateQrCreateMutation())

const isDefaultFamily = computed(() => mainStore.getProductFamily === 'default')
const layout = computed(() => (isDefaultFamily.value ? DetailLayoutDefault : DetailLayoutShltr))

const hasQr = computed(() => mainStore.getEquipmentQrType !== 'none')
const qrUrl = computed(() => location.value?.qr_url ?? location.value?.qr_path ?? undefined)

const detailFields = computed<DetailField[]>(() =>
  location.value ? [{label: $trans('Name'), value: location.value.name, col: 1}] : [])

/**
 * Where a row in the equipment-at-this-location table links: the same route
 * stem with `location` swapped for `equipment`. Kept as the legacy screen
 * built it, including the mount where the name it produces is not registered -
 * see the module README's preserved-defects list.
 */
const equipmentViewRoute = computed(() => `${props.route_prefix.replace('location', 'equipment')}-view`)

function download() {
  const record = location.value
  if (!record?.qr_path) return
  // The location serializer exposes no uuid, so the file is named from the
  // name alone - the legacy screen interpolated an undefined there.
  my24.downloadItem(record.qr_path, `${record.name}.png`)
}

async function recreateQr() {
  try {
    const result = await recreateQrMutation.mutateAsync({path: {id}})
    queryClient.setQueryData(equipmentLocationRetrieveQueryKey({path: {id}}), (previous) =>
      previous ? {...previous, ...result} : previous)
  } catch {
    errorToast(create, $trans('Error recreating QR code'))
  }
}

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
.qr-code-image {
  width: 250px;
  height: 250px;
}
.qr-container {
  text-align: center;
}
</style>
