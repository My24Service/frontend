<template>
  <WorkorderModal
    v-if="order"
    ref="workorder-modal"
    :order-id="order.id"
    :uuid="order.uuid ?? ''"
    :pdf-url="order.workorder_pdf_url"
    :can-recreate="!past && !isCustomer && !isBranchEmployee"
    @recreated="refetch"
  />

  <div
    v-if="order"
    class="app-page"
  >
    <header>
      <div class="page-title">
        <h3>
          <IBiFileEarmarkTextFill />
          <router-link :to="{name: 'order-list'}">{{ $trans("Orders") }}</router-link> /
          <span>#<strong>{{ order.order_id }}</strong></span>
        </h3>
        <div class="flex-columns">
          <router-link
            class="btn btn-primary"
            :to="{name: 'order-edit', params: {pk: order.id}}"
          >
            <IBiPencil font-scale="0.95" /> &nbsp; {{ $trans('Edit order') }}
          </router-link>
          <router-link
            v-if="order.customer_relation && order.uuid"
            class="btn"
            :title="$trans('Create invoice')"
            :to="{name: 'invoice-create', params: {uuid: order.uuid}}"
          >
            <IBiReceiptCutoff /> {{ $trans('Create invoice') }}
          </router-link>
        </div>
      </div>
    </header>

    <div class="page-detail">
      <div class="flex-columns wrap">
        <OrderSummaryPanel
          :order="order"
          @show-workorder="workorderModal?.show()"
        />
        <OrderInvoicesPanel :order="order" />
        <OrderContentsPanel :order="order" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useQueryErrorToast } from '@/features/forms'
import OrderContentsPanel from './OrderContentsPanel.vue'
import OrderInvoicesPanel from './OrderInvoicesPanel.vue'
import OrderSummaryPanel from './OrderSummaryPanel.vue'
import WorkorderModal from './WorkorderModal.vue'
import { useOrderDetail } from './use-order-detail'
import { useOrderViewer } from './use-order-viewer'

/**
 * The order detail, reached by pk (`order-view`) or by uuid (`order-detail`).
 * Three panels: the order and its contact, the invoices and workorder
 * documents, the documents / orderlines / infolines / status timeline.
 */
const props = withDefaults(defineProps<{
  pk?: string | number | null
  uuid?: string | null
  past?: boolean
}>(), {
  pk: null,
  uuid: null,
  past: false,
})

const {isCustomer, isBranchEmployee} = useOrderViewer()

const {order, error, refetch} = useOrderDetail(() => ({pk: props.pk, uuid: props.uuid}))
useQueryErrorToast(error, $trans('Error fetching order'))

const workorderModal = useTemplateRef<{show: () => void}>('workorder-modal')
</script>
