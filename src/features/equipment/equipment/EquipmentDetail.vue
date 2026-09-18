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
        <QrPanel
          :qr-url="qrUrl"
          @download="download"
          @recreate="recreateQr"
        />
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
          kind="equipment"
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
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { BButtonToolbar } from 'bootstrap-vue-next'
import IBiTools from '~icons/bi/tools'
import moment from 'moment/min/moment-with-locales'
import {
  equipmentEquipmentRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { EquipmentTypeEnum } from '@/api/types.gen'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import OrderStats from '@/components/OrderStats.vue'
import OrdersTable from '@/components/OrdersTable.vue'
import OrderTypesPie from '@/components/OrderTypesPie.vue'
import SearchModal from '@/components/SearchModal.vue'
import WorkOrdersTable from '@/components/WorkOrdersTable.vue'
import { EQUIPMENT_TYPES } from '@/constants'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { $trans } from '@/services/i18n'
import { toDinero } from '@/services/money'
import { useMainStore } from '@/stores/main'
import DocumentsComponent from '../documents/DocumentsComponent.vue'
import DetailLayoutDefault from '../detail/DetailLayoutDefault.vue'
import DetailLayoutShltr from '../detail/DetailLayoutShltr.vue'
import QrPanel from '../detail/QrPanel.vue'
import { useQrCode } from '../detail/use-qr-code'
import type { DetailField } from '../detail/detail-fields'
import { useDetailChrome } from '../detail/use-detail-chrome'
import { useDetailOrders } from '../detail/use-detail-orders'

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
const mainStore = useMainStore()

const detailQuery = useQuery(equipmentEquipmentRetrieveOptions({path: {id}}))
useQueryErrorToast(detailQuery.error, $trans('Error fetching equipment detail'))
const equipment = computed(() => detailQuery.data.value)

const {orders, count, perPage, page, isLoading, statsData, renderStats, setSearch, refresh} =
  useDetailOrders({kind: 'equipment', pk: id})

const {hasQr, qrUrl, download, recreateQr} = useQrCode({kind: 'equipment', id, record: equipment})

const layout = computed(() => (mainStore.getProductFamily === 'default' ? DetailLayoutDefault : DetailLayoutShltr))
const isDefaultFamily = computed(() => mainStore.getProductFamily === 'default')

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

const {handleSearchOk, showSearchModal, refreshAll, goBack} = useDetailChrome({
  orders: {setSearch, refresh},
  detail: detailQuery,
})
</script>
