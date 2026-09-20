<template>
  <div class="app-page">
    <ServerTable
      v-model:search-draft="searchDraft"
      :table="table"
      :pagination="pagination"
      :count="count"
      :is-loading="isLoading"
      :is-fetching="isFetching"
      :title="$trans('Events')"
      :search-label="$trans('Search events')"
      :label="$trans('Event')"
      :refresh="refresh"
      :empty-text="$trans('No events found')"
      :searchable="false"
      :page-size-options="PAGE_SIZES"
    >
      <template #subnav><EngineerPills /></template>
      <template #icon><IBiFileEarmarkCheckFill /></template>
      <template #toolbar-extra>
        <ActionButton
          icon="download"
          :method="downloadList"
          :title="$trans('Download events')"
        />
      </template>
    </ServerTable>

    <EngineerEventOrderForm
      id="attach-order-modal"
      ref="attach-order-modal"
      @assigned="assignedOk"
    />
  </div>
</template>

<script lang="ts" setup>
import moment from 'moment'

import IBiFileEarmarkCheckFill from '~icons/bi/file-earmark-check-fill'

import { companyEngineereventListOptions } from '@/api/@tanstack/vue-query.gen'
import type { PaginatedEngineerEventList } from '@/api/types.gen'
import ActionButton from '@/components/ActionButton.vue'
import { NEW_DATA_EVENTS } from '@/constants'
import {
  ServerTable,
  createAppColumnHelper,
  useServerTable,
  type ListRow,
} from '@/features/table'
import { infoToast, $trans } from '@/services/i18n'
import my24 from '@/services/my24'
import MemberNewDataSocket from '@/services/websocket/MemberNewDataSocket'

import { displayDurationFromSeconds } from '../hours/hours-fields'
import EngineerPills from './EngineerPills.vue'
import EngineerEventOrderForm from './EngineerEventOrderForm.vue'

/**
 * The engineer events: what the engineers' devices reported (a door opening, a
 * measurement) and, for the ones that need it, the order that was made for
 * them.
 *
 * Three things differ from the legacy screen, all of them in the Slice README's
 * ledger:
 *
 *  - the read is `page` and nothing else. `/api/company/engineerevent/` is a
 *    plain `ListCreateAPIView` on DRF's own `PageNumberPagination`
 *    (`DEFAULT_PAGINATION_CLASS`, my24service
 *    `source/settings/default_settings.py:357`), whose `page_size_query_param`
 *    is unset — which is why the document declares `page` alone and why the
 *    seam refuses a `page_size`. Its page is the project's `PAGE_SIZE`, 50.
 *  - there is no search field. The same viewset is the one place in this Slice
 *    that does not go through `BaseMy24ViewSet`, so it carries no
 *    `SearchFilter` and declare no `q`; a field that sends a parameter the
 *    backend ignores is worse than no field.
 *  - there is no delete. The view has no detail route at all (my24service
 *    `apps/user/urls.py:62-67`), and the legacy action threw before it could
 *    have called one.
 */
type EventRow = ListRow<PaginatedEngineerEventList>

/** The page size the endpoint pages by: DRF's `PAGE_SIZE`, and not a parameter. */
const PAGE_SIZE = 50
const PAGE_SIZES = [PAGE_SIZE]

const {create: toast} = useToast()

const columnHelper = createAppColumnHelper<EventRow>()
const orderModal = useTemplateRef<{show: (eventId: number, engineerUserId: number) => void}>('attach-order-modal')

const columns = columnHelper.columns([
  columnHelper.accessor('engineer_name', {
    header: $trans('Engineer'),
    enableSorting: false,
  }),
  columnHelper.display({
    id: 'event_dts',
    header: $trans('Date'),
    cell: (info) => moment(info.row.original.event_dts).format('YYYY-MM-DD HH:mm:ss'),
  }),
  columnHelper.accessor('event_type', {
    header: $trans('Type'),
    enableSorting: false,
  }),
  columnHelper.accessor('measure_last_event_type', {
    header: $trans('Last event'),
    enableSorting: false,
  }),
  columnHelper.display({
    id: 'secs_since_last_measure_event_type',
    header: $trans('Last event duration'),
    cell: (info) => info.row.original.secs_since_last_measure_event_type
      ? displayDurationFromSeconds(info.row.original.secs_since_last_measure_event_type, false)
      : '',
  }),
  columnHelper.display({
    id: 'assigned_order',
    header: $trans('Order'),
    cell: (info) => {
      const row = info.row.original
      if (row.assigned_order) {
        const order = row.assigned_order as {order_name?: string; order_city?: string}
        return `${order.order_name}, ${order.order_city}`
      }
      if (!row.last_measure_event) return ''
      return h('button', {
        type: 'button',
        class: 'btn btn-info',
        onClick: () => showOrderModal(row.id, row.user_id),
      }, $trans('No order, create one'))
    },
  }),
  columnHelper.accessor('created', {
    header: $trans('Created'),
    enableSorting: false,
  }),
])

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<EventRow>({
  key: 'engineer-event-table',
  columns,
  enableSorting: false,
  pageSize: PAGE_SIZE,
  listOptions: (query) => companyEngineereventListOptions({query: {page: query.page}}),
  urlSync: true,
  loadError: $trans('Error loading events'),
})

// the order modal -----------------------------------------------------------

function showOrderModal(eventId: number, engineerUserId: number) {
  orderModal.value?.show(eventId, engineerUserId)
}

function assignedOk() {
  infoToast(toast, $trans('Assigned'), $trans('Order created and assigned'))
}

/** The events as a spreadsheet, through the endpoint that renders one. */
function downloadList() {
  if (confirm($trans('Are you sure you want to export all events?'))) {
    my24.downloadItem('/company/events-export-xls/', 'events.xlsx')
  }
}

// the websocket -------------------------------------------------------------

/**
 * The list follows the member's new-data socket: the engineer's device
 * reporting an event is what makes this list worth watching, and the message
 * is a plain "re-read" — the row is not in the payload.
 */
const socket = new MemberNewDataSocket()

function onNewData(data: {type: string}) {
  if (data.type === NEW_DATA_EVENTS.ENGINEER_EVENT) refresh()
}

onMounted(async () => {
  await socket.init(NEW_DATA_EVENTS.ENGINEER_EVENT)
  socket.setOnmessageHandler(onNewData)
  socket.getSocket()
})

onBeforeUnmount(() => {
  socket.removeOnmessageHandler()
})
</script>
