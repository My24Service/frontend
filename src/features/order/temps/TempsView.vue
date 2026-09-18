<template>
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
        </div>
      </div>
    </header>

    <div class="page-detail">
      <div class="flex-columns wrap">
        <div class="panel col-1-3">
          <h3>
            <span><strong>{{ order.order_type }}</strong> <br><small>{{ order.order_name }}</small></span>
          </h3>
          <dl>
            <dt>{{ $trans("Customer ID") }}</dt>
            <dd>{{ order.customer_id }}</dd>
            <dt>{{ $trans("Date") }}</dt>
            <dd>{{ order.order_date }}</dd>
            <dt>{{ $trans("Reference") }}</dt>
            <dd>{{ order.order_reference }}</dd>
            <dt>{{ $trans("Required users") }}</dt>
            <dd>{{ order.required_users }}</dd>
            <dt>{{ $trans("Status") }}</dt>
            <dd>{{ order.last_status }}</dd>
            <dt>{{ $trans("Customer remarks") }}</dt>
            <dd>{{ order.customer_remarks }}</dd>
            <dt>{{ $trans("Workorder online") }}</dt>
            <dd class="flex-columns">
              <BLink
                class="btn btn-sm btn-primary"
                :href="order.workorder_url"
                target="_blank"
              >
                <IBiFileEarmark />
                {{ order.order_id }}
              </BLink>
            </dd>
            <dt v-if="order.workorder_pdf_url">{{ $trans("Download PDF") }}</dt>
            <dd
              v-if="order.workorder_pdf_url"
              class="flex-columns"
            >
              <BLink
                class="btn btn-sm btn-outline"
                :href="order.workorder_pdf_url"
                target="_blank"
                :title="`${$trans('Download PDF')} (${order.workorder_pdf_url})`"
              >
                <IBiFileEarmarkPdf />{{ $trans('Order') }} {{ order.order_id }}
              </BLink>
            </dd>
          </dl>
          <hr>

          <OrderContactBlock :order="order" />
        </div>

        <div class="panel col-1-3">
          <OrderlinesTable :lines="order.orderlines" />

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
import StatusesComponent from '@/components/StatusesComponent.vue'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { $trans } from '@/services/i18n'
import { useOrderDetail } from '../order/use-order-detail'
import OrderContactBlock from '../order/OrderContactBlock.vue'
import OrderlinesTable from '../order/OrderlinesTable.vue'

/**
 * The temps tenant's order detail, reached by pk (`order-view`) or by uuid
 * (`order-detail`): the order and how many people it needs, its contact
 * block, its orderlines and its status timeline. No workorder modal,
 * invoices, documents or partner orders — none of those exist for a
 * temps order.
 */
const props = withDefaults(defineProps<{
  pk?: string | number | null
  uuid?: string | null
}>(), {
  pk: null,
  uuid: null,
})

const {order, error} = useOrderDetail(() => ({pk: props.pk, uuid: props.uuid}))
useQueryErrorToast(error, $trans('Error fetching order'))
</script>
