<template>
  <div class="panel col-1-3">
    <h6>
      <IBiReceiptCutoff />
      {{ $trans('Invoices') }}
    </h6>

    <div v-if="order.invoices.length">
      <ul class="listing">
        <li
          v-for="invoice of order.invoices"
          :key="invoice.uuid"
        >
          <router-link
            v-if="invoice.preliminary"
            :to="{name: 'invoice-edit', params: {pk: invoice.id, uuid: order.uuid}}"
            class="listing-item"
          >
            {{ $trans('Invoice') }} {{ invoice.invoice_id }}
          </router-link>
          <router-link
            v-else
            :to="{name: 'invoice-view', params: {uuid: invoice.uuid}}"
          >
            {{ $trans('Invoice') }} {{ invoice.invoice_id }}
          </router-link>
        </li>
      </ul>
    </div>
    <div
      v-else
      class="text-center p-3"
    >
      <small class="dimmed">{{ $trans('No invoice(s) for this order yet.') }}</small> <br><br>
      <router-link
        v-if="order.customer_relation"
        class="btn btn-primary"
        :title="$trans('Create invoice')"
        :to="{name: 'invoice-create', params: {uuid: order.uuid}}"
      >
        <IBiReceiptCutoff /> {{ $trans('Create invoice') }}
      </router-link>
    </div>

    <PurchaseInvoicesPanel
      v-if="hasBranches"
      :order-id="order.id"
    />
    <h6
      v-else
      class="dimmed"
    >{{ $trans('Purchase invoices') }}</h6>

    <WorkorderDocumentList
      :title="$trans('Workorder documents')"
      :order-id="order.order_id ?? null"
      :documents="order.workorder_documents"
    />
    <WorkorderDocumentList
      :title="$trans('Workorder documents partner')"
      :order-id="order.order_id ?? null"
      :documents="order.workorder_documents_partners"
    />
    <WorkorderDocumentList
      v-if="hasBranches && orgOrderDocuments.length"
      :title="$trans('Workorder documents original order')"
      :order-id="order.order_id ?? null"
      :documents="orgOrderDocuments"
    />

    <div v-if="order.reported_codes_extra_data.length">
      <h6>{{ $trans('Reported extra text') }}</h6>
      <table
        id="extra-data-table"
        class="table table-borderless table-sm"
      >
        <thead>
          <tr>
            <th>{{ $trans('Status') }}</th>
            <th>{{ $trans('Text') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in order.reported_codes_extra_data"
            :key="index"
          >
            <td>{{ row.statuscode }}</td>
            <td>{{ row.extra_data }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <h6
      v-else
      class="dimmed"
    >{{ $trans('Reported extra text') }}</h6>
  </div>
</template>

<script lang="ts" setup>
import PurchaseInvoicesPanel from './PurchaseInvoicesPanel.vue'
import WorkorderDocumentList from './WorkorderDocumentList.vue'
import { useOrderViewer } from './use-order-viewer'
import { type OrderDetailRecord } from './use-order-detail'

/**
 * The order detail's second panel: its invoices (purchase invoices too, for
 * a branch tenant), the workorder documents and the reported extra text.
 */
const props = defineProps<{
  order: OrderDetailRecord
}>()

const {hasBranches} = useOrderViewer()

const orgOrderDocuments = computed(() => props.order.workorder_documents_org_order ?? [])
</script>
