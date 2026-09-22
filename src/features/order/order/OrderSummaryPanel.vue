<template>
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
          @click.prevent="emit('show-workorder')"
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

    <OrderContactBlock :order="order" />
  </div>
</template>

<script lang="ts" setup>
import { useOrderViewer } from './use-order-viewer'
import { type OrderDetailRecord } from './use-order-detail'
import OrderContactBlock from './OrderContactBlock.vue'

/**
 * The order detail's first panel: what the order is, who it is assigned
 * to, its workorder and related orders, and the contact block.
 */
const props = defineProps<{
  order: OrderDetailRecord
}>()

const emit = defineEmits<{'show-workorder': []}>()

const {isCustomer, isPlanning, hasBranches} = useOrderViewer()

// The org-order extras exist on the pk detail only; the public (uuid)
// detail does not carry them.
const parentOrder = computed(() => props.order.parent_order_data ?? null)
const orgOrderWorkorder = computed(() => props.order.workorder_url_org_order ?? null)
const copiedOrders = computed(() => props.order.copied_order_data ?? [])
</script>
