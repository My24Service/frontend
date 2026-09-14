<template>
  <WorkorderModal
    v-if="order"
    ref="workorder-modal"
    :order-id="orderId"
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
            v-if="orderId !== null"
            class="btn btn-primary"
            :to="{name: 'order-edit', params: {pk: orderId}}"
          >
            <IBiPencil font-scale="0.95" /> &nbsp; {{ $trans('Edit order') }}
          </router-link>
          <router-link
            v-if="order.customer_relation"
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
        <div class="panel col-1-3">
          <h3>
            <span><strong>{{ order.order_type }}</strong> <br><small>
              <router-link :to="{name: 'customer-view', params: {pk: order.customer_relation ?? 0}}">
                {{ order.order_name }}
              </router-link>
            </small></span>
          </h3>
          <dl>
            <dt>
              <span v-if="order.assigned_user_info.length">{{ $trans('Assigned to') }}</span>
            </dt>
            <dd>
              <span
                v-if="!order.assigned_user_info.length"
                class="dimmed"
              >{{ $trans('Not assigned') }}</span>
              <span
                v-for="(person, index) in order.assigned_user_info"
                :key="person.full_name"
                class="order-assignee"
              >
                <span v-if="index > 0"> - </span>
                {{ person.full_name }}
              </span>
            </dd>
            <dt>{{ $trans("Status") }}</dt>
            <dd>{{ order.last_status }}</dd>
            <dt>{{ $trans("Dates") }}</dt>
            <dd>{{ order.order_date }}</dd>
            <dt>{{ $trans("Customer reference") }}</dt>
            <dd>{{ order.customer_reference }}</dd>
            <dt>{{ $trans("Reference") }}</dt>
            <dd>{{ order.order_reference }}</dd>
            <dt>{{ $trans("Remarks") }}</dt>
            <dd>{{ order.remarks }}</dd>
            <template v-if="isPlanning">
              <dt>{{ $trans("Planning remarks") }}</dt>
              <dd>{{ order.planning_remarks }}</dd>
            </template>
            <template v-if="!isCustomer">
              <dt>{{ $trans("Customer remarks") }}</dt>
              <dd>{{ order.customer_remarks }}</dd>
            </template>
            <dt v-if="!hasBranches">{{ $trans("Workorder") }}</dt>
            <dd class="flex-columns">
              <BLink
                class="btn btn-sm btn-primary"
                @click.prevent="workorderModal?.show()"
              >
                <IBiFileEarmark />
                {{ $trans('View workorder') }}
              </BLink>
            </dd>
            <dd
              v-if="!hasBranches"
              class="flex-columns"
            >
              <BLink
                v-if="order.workorder_pdf_url"
                class="btn btn-sm btn-outline"
                :href="order.workorder_pdf_url"
                target="_blank"
                :title="`${$trans('Download PDF')} (${order.workorder_pdf_url})`"
              >
                <IBiFileEarmarkPdf />{{ $trans('Download PDF') }}
              </BLink>
            </dd>
            <dt>{{ $trans("Original order ID") }}</dt>
            <dd class="flex-columns">
              <div v-if="parentOrder?.companycode">
                {{ parentOrder.companycode }} - {{ parentOrder.order_id }}
              </div>
            </dd>
            <template v-if="hasBranches">
              <dt>{{ $trans("Workorder original order ") }}</dt>
              <dd class="flex-columns">
                <div v-if="orgOrderWorkorder?.url">
                  <BLink
                    class="btn btn-sm btn-outline"
                    :href="orgOrderWorkorder.url"
                    target="_blank"
                    :title="`${$trans('Download PDF')}(${orgOrderWorkorder.url}`"
                  >
                    <IBiFileEarmarkPdf />{{ $trans('Download PDF') }}
                  </BLink>
                </div>
              </dd>
            </template>
            <dt>{{ $trans("Partner order ID(s)") }}</dt>
            <dd>
              <div
                v-for="data in copiedOrders"
                :key="data.companycode"
              >
                {{ data.companycode }} - {{ data.order_id }}
              </div>
            </dd>

            <dt>{{ $trans("Workorders partners") }}</dt>
            <dd class="flex-columns">
              <div
                v-for="workorder in order.workorder_pdf_url_partner"
                :key="workorder.companycode"
              >
                <span v-if="workorder.url">{{ workorder.companycode }}</span>
                <BLink
                  v-if="workorder.url"
                  class="btn btn-sm btn-outline"
                  :href="workorder.url"
                  target="_blank"
                  :title="`${$trans('Download PDF')} (${workorder.url})`"
                >
                  <IBiFileEarmarkPdf />
                  {{ $trans('Download PDF') }}
                </BLink>
              </div>
            </dd>
            <template v-if="isPlanning">
              <dt>{{ $trans("Order email extra") }}</dt>
              <dd>{{ (order.order_email_extra ?? []).join(", ") }}</dd>
            </template>
          </dl>
          <hr>

          <h6><IBiPerson />{{ $trans("Contact") }}</h6>
          <div
            class="flex-columns space-between"
            style="max-width: 60ch; margin-inline: auto"
          >
            <p>
              {{ order.order_contact }}<br>
              <BLink :href="`mailto:${order.order_email}`">{{ order.order_email }}</BLink><br>
              {{ order.order_tel }}<br>
              {{ order.order_mobile }}<br>
            </p>
            <address>
              <strong>{{ order.order_name }}</strong><br>
              {{ order.order_address }}<br>
              {{ order.order_postal }}<br>
              {{ order.order_city }}, {{ order.order_country_code }}
            </address>
          </div>
        </div>

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
            v-if="hasBranches && orderId !== null"
            :order-id="orderId"
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

        <div class="panel col-1-3">
          <div class="documents section">
            <h6>{{ $trans('Documents') }}</h6>
            <table
              v-if="order.documents.length"
              class="table table-sm data-table"
            >
              <thead>
                <tr><th>{{ $trans('Name') }}</th></tr>
              </thead>
              <tbody>
                <tr
                  v-for="document in order.documents"
                  :key="document.id"
                >
                  <td>
                    <BLink
                      :href="document.url"
                      target="_blank"
                    >{{ document.name }}</BLink>
                  </td>
                </tr>
              </tbody>
            </table>
            <small
              v-else
              class="dimmed"
            >{{ $trans('No documents') }}</small>
          </div>

          <h6 v-if="orderlines.length">{{ $trans('Orderlines') }}</h6>
          <table
            id="orderlines-table"
            class="table table-sm data-table"
          >
            <thead v-if="orderlines.length">
              <tr>
                <th style="width: 30%">{{ $trans('Product') }}</th>
                <th style="width: 30%">{{ $trans('Location') }}</th>
                <th style="width: 40%">{{ $trans('Remarks') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="line in orderlines"
                :key="line.id"
              >
                <td>{{ line.product }}</td>
                <td>{{ line.location }}</td>
                <td>{{ line.remarks }}</td>
              </tr>
            </tbody>
          </table>
          <h6
            v-if="!orderlines.length"
            class="dimmed"
          >
            {{ $trans('No orderlines') }}
          </h6>

          <ul
            v-if="showInfolines"
            class="listing full-size"
          >
            <h6>{{ $trans('Info lines') }}</h6>
            <li
              v-for="item of order.infolines"
              :key="item.id"
            >
              {{ item.info }}
            </li>
          </ul>
          <h6
            v-else
            class="dimmed"
          >{{ $trans('Info lines') }}</h6>

          <div v-if="order.statuses">
            <hr>
            <StatusesComponent :statuses="order.statuses" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, h, useTemplateRef } from 'vue'
import { BLink } from 'bootstrap-vue-next'

import type { OrderDetail, WorkorderDocument } from '@/api/types.gen'
import StatusesComponent from '@/components/StatusesComponent.vue'
import { useAuthStore } from '@/features/auth'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { $trans } from '@/services/i18n'
import { useMainStore } from '@/stores/main'
import PurchaseInvoicesPanel from './PurchaseInvoicesPanel.vue'
import WorkorderModal from './WorkorderModal.vue'
import { displayOrderlines, orderIdOf, useOrderDetail } from './use-order-detail'

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

const authStore = useAuthStore()
const mainStore = useMainStore()
const isCustomer = computed(() => authStore.isCustomer)
const isPlanning = computed(() => authStore.isPlanning)
const isBranchEmployee = computed(() => authStore.isBranchEmployee)
const hasBranches = computed(() => mainStore.getMemberHasBranches)
const usesEquipment = computed(() => mainStore.getMemberUsesEquipment)

const {order, error, refetch} = useOrderDetail(() => ({pk: props.pk, uuid: props.uuid}))
useQueryErrorToast(error, $trans('Error fetching order'))

const orderId = computed(() => orderIdOf(order.value))

const workorderModal = useTemplateRef<{show: () => void}>('workorder-modal')

const orderlines = computed(() => displayOrderlines(order.value?.orderlines ?? [], usesEquipment.value))

const showInfolines = computed(
  () => !isCustomer.value && !hasBranches.value && (order.value?.infolines.length ?? 0) > 0,
)

// The org-order extras exist on the pk detail only; the public (uuid) detail
// does not carry them, so each reads through the union with a guard.
const asFull = computed(() => (order.value && 'copied_order_data' in order.value ? (order.value as OrderDetail) : null))
const parentOrder = computed(() => asFull.value?.parent_order_data ?? null)
const orgOrderWorkorder = computed(() => asFull.value?.workorder_url_org_order ?? null)
const copiedOrders = computed(() => asFull.value?.copied_order_data ?? [])
const orgOrderDocuments = computed(() => asFull.value?.workorder_documents_org_order ?? [])

/**
 * One of the "Workorder documents" blocks: a heading and a borderless list
 * of PDF links, or the heading dimmed when there is nothing to list.
 */
const WorkorderDocumentList = (props: {title: string; orderId: string | null; documents: WorkorderDocument[]}) =>
  props.documents.length
    ? h('div', [
        h('h6', props.title),
        h('table', {class: 'table table-borderless table-sm'}, [
          h('tbody', props.documents.map((document) =>
            h('tr', {key: document.url}, [
              h('td', [
                h(BLink, {href: document.url, target: '_blank', class: 'flex-columns'}, () => [
                  `${$trans('Order')} ${props.orderId ?? ''} `,
                  h('small', {class: 'dimmed'}, document.name),
                ]),
              ]),
            ]),
          )),
        ]),
      ])
    : h('h6', {class: 'dimmed'}, props.title)
</script>
