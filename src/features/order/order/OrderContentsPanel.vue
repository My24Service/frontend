<template>
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

    <OrderlinesTable :lines="orderlines" />

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
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import StatusesComponent from '@/features/shared/StatusesComponent.vue'
import { $trans } from '@/services/i18n'
import { useOrderViewer } from './use-order-viewer'
import { displayOrderlines, type OrderDetailRecord } from './use-order-detail'
import OrderlinesTable from './OrderlinesTable.vue'

/**
 * The order detail's third panel: its documents, orderlines, infolines and
 * status timeline.
 */
const props = defineProps<{
  order: OrderDetailRecord
}>()

const {isCustomer, hasBranches, usesEquipment} = useOrderViewer()

const orderlines = computed(() => displayOrderlines(props.order.orderlines, usesEquipment.value))

const showInfolines = computed(
  () => !isCustomer.value && !hasBranches.value && props.order.infolines.length > 0,
)
</script>
