<template>
  <div
    v-show="equipment"
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
          <IBiTools />
          <span
            class="backlink"
            @click="goBack"
          >{{ $trans('Equipment') }}</span> /
          <span v-if="equipment">{{ equipment.name }}</span>
        </h3>
        <!-- default: always, to the plain edit route; shltr: from settings
             only, to the typed edit route -->
        <BButton-toolbar v-if="isDefaultFamily || props.from_settings">
          <router-link
            :to="editRoute"
            :class="isDefaultFamily ? 'btn' : 'btn btn-primary'"
          >{{ `${$trans('Edit')} ${$trans('equipment')}` }}</router-link>
        </BButton-toolbar>
      </div>
    </header>

    <component
      :is="layout"
      v-if="equipment && !isLoading"
      :details-title="$trans('Equipment details')"
      :orders-title="$trans('Orders')"
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
        <h6>{{ $trans('Stats for') }} {{ equipment.name }}</h6>
        <OrderStats :data-in="statsData" />
      </template>

      <!-- shltr only: latest workorders and the order-type pie -->
      <template
        v-if="!isDefaultFamily"
        #workorders
      >
        <WorkOrdersTable
          :equipment-pk="id"
          :hide-columns="['equipment']"
        />
      </template>

      <template #documents>
        <DocumentsComponent
          :equipment="equipment"
          :is-view="true"
        />
      </template>

      <template
        v-if="!isDefaultFamily"
        #order-types
      >
        <OrderTypesPie :equipment-pk="id" />
      </template>
    </component>
  </div>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { BButton, BButtonToolbar, BLink, useToast } from 'bootstrap-vue-next'
import IBiTools from '~icons/bi/tools'
import moment from 'moment/min/moment-with-locales'
import {
  equipmentEquipmentCreateQrCreateMutation,
  equipmentEquipmentRetrieveOptions,
  equipmentEquipmentRetrieveQueryKey,
} from '@/api/@tanstack/vue-query.gen'
import type { EquipmentTypeEnum } from '@/api/types.gen'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import OrderStats from '@/components/OrderStats.vue'
import OrdersTable from '@/components/OrdersTable.vue'
import OrderTypesPie from '@/components/OrderTypesPie.vue'
import SearchModal from '@/components/SearchModal.vue'
import WorkOrdersTable from '@/components/WorkOrdersTable.vue'
import { EQUIPMENT_TYPES, NO_IMAGE_URL } from '@/constants'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { $trans, errorToast } from '@/services/i18n'
import my24 from '@/services/my24'
import { toDinero } from '@/services/money'
import { useMainStore } from '@/stores/main'
import DocumentsComponent from '../documents/DocumentsComponent.vue'
import DetailLayoutDefault from './DetailLayoutDefault.vue'
import DetailLayoutShltr from './DetailLayoutShltr.vue'
import type { DetailField } from './detail-fields'
import { useDetailOrders } from './use-detail-orders'

/**
 * The equipment detail page for both product families.
 *
 * The reads live in `useDetailOrders` (orders and the four Insights payloads)
 * and in one generated detail query here; the frame is a layout component per
 * family that this view fills through named slots. The family branches are the
 * edit toolbar and its route, the Insights tab (default), and the workorders
 * card and order-type pie (shltr).
 *
 * `OrdersTable`, `OrderStats`, `WorkOrdersTable` and `OrderTypesPie` are the
 * order Slice's and are mounted here un-rewritten, as the customer Slice
 * already does - see the module README.
 */
const props = withDefaults(defineProps<{
  /** The route's `:pk`, passed through by the layout. */
  pk?: string | number
  /** The route name stem this mount answers to. */
  route_prefix: string
  /** Set by the settings layout, which also shows the edit link on shltr. */
  from_settings?: boolean
  type?: EquipmentTypeEnum
}>(), {
  pk: '',
  from_settings: false,
  type: EQUIPMENT_TYPES.TECHNICAL,
})

const id = Number(props.pk)
const router = useRouter()
const mainStore = useMainStore()
const queryClient = useQueryClient()

const searchModal = useTemplateRef<{show: () => void, hide: () => void}>('searchModal')
const {create} = useToast()

const detailQuery = useQuery(equipmentEquipmentRetrieveOptions({path: {id}}))
useQueryErrorToast(detailQuery.error, $trans('Error fetching equipment detail'))
const equipment = computed(() => detailQuery.data.value)

const {orders, count, perPage, page, isLoading, statsData, renderStats, setSearch, refresh} =
  useDetailOrders({kind: 'equipment', pk: id})

const recreateQrMutation = useMutation(equipmentEquipmentCreateQrCreateMutation())

const layout = computed(() => (mainStore.getProductFamily === 'default' ? DetailLayoutDefault : DetailLayoutShltr))
const isDefaultFamily = computed(() => mainStore.getProductFamily === 'default')

/** The member's QR setting: `none` means this tenant has no QR codes at all. */
const hasQr = computed(() => mainStore.getEquipmentQrType !== 'none')
const qrUrl = computed(() => equipment.value?.qr_url ?? equipment.value?.qr_path ?? undefined)

const editRoute = computed(() => ({
  name: isDefaultFamily.value ? `${props.route_prefix}-edit` : `${props.route_prefix}-edit-${props.type}`,
  params: {pk: props.pk},
}))

moment.locale(String(mainStore.getCurrentLanguage))

function displayDate(value: string | null | undefined) {
  return value ? moment(value).format('DD-MM-YYYY') : ''
}

const detailFields = computed<DetailField[]>(() => {
  const record = equipment.value
  if (!record) return []
  const price = record.price ? toDinero(record.price, record.price_currency).toFormat('$0.00') : ''
  return [
    {label: $trans('Name'), value: record.name, col: 1},
    {label: $trans('Brand'), value: record.brand, col: 1},
    {label: $trans('Identifier'), value: record.identifier, col: 1},
    {label: $trans('Description'), value: record.description, col: 2},
    {label: $trans('Installation date'), value: displayDate(record.installation_date), col: 2},
    {label: $trans('Production date'), value: displayDate(record.production_date), col: 2},
    {label: $trans('Serial number'), value: record.serialnumber, col: 1},
    {label: $trans('Standard hours'), value: record.standard_hours, col: 1},
    {label: $trans('Lifespan (months)'), value: record.default_replace_months, col: 2},
    {label: $trans('Price'), value: price, col: 2},
  ]
})

function download() {
  const record = equipment.value
  if (!record?.qr_path) return
  my24.downloadItem(record.qr_path, `${record.name} ${record.uuid}.png`)
}

async function recreateQr() {
  try {
    const result = await recreateQrMutation.mutateAsync({path: {id}})
    // Written into the detail cache rather than a local copy, so the QR block
    // and anything else reading the record stay one source.
    queryClient.setQueryData(equipmentEquipmentRetrieveQueryKey({path: {id}}), (previous) =>
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
