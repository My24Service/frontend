<template>
  <b-table
    class="data-table orders-table"
    :id="tableId"
    small
    responsive="md"
    :busy="busy"
    :fields="visibleFields"
    :items="orders"
  >
    <!-- lists that used to hang their toolbar off a column header keep doing so -->
    <template #head(actions)="">
      <div class="float-right">
        <slot name="head-actions" />
      </div>
    </template>

    <template #table-busy>
      <div class="text-center text-danger my-2">
        <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
        <strong>{{ $trans('Loading...') }}</strong>
      </div>
    </template>

    <template #cell(order_id)="data">
      <BLink :to="{name: 'order-view', params: {pk: data.item.id}}">
        #{{ data.item.order_id }}<span
          v-if="includeReference && data.item.order_reference && data.item.order_reference.length > 0"
        > / {{ data.item.order_reference }}</span>
      </BLink>
    </template>

    <template #cell(order_type)="data">
      <BLink :to="{name: 'order-view', params: {pk: data.item.id}}">
        <strong>{{ data.item.order_type }}</strong>
      </BLink>
    </template>

    <template #cell(start_date)="data">
      <span :title="`${data.item.start_date}${data.item.start_time ? ' ' + data.item.start_time : ''}`">
        {{ data.item.start_date }}
        <b v-if="data.item.start_time" :title="data.item.start_time">
          <IBiClock></IBiClock>
        </b>
      </span>
    </template>

    <template #cell(assignees)="data">
      <span v-if="memberType === 'temps'">
        <span v-if="data.item.assigned_count" :title="`assignees: ${data.item.required_assigned}`">
          {{ $trans('Assigned to') }} {{ data.item.assigned_count }}
          <span v-if="data.item.assigned_count > 1">
            <span v-if="data.item.required_users"> / {{ data.item.required_users }}</span>
            {{ $trans("people") }}
          </span>
          <span v-else>{{ $trans("person") }}</span>
        </span>
        <span v-else :title="$trans('Not assigned to anyone')">&ndash;</span>
      </span>
      <span v-else>
        <span
          v-if="assignedUsers(data.item).length"
          :title="`assignees: ${assignedUsers(data.item).join(', ')}`"
        >
          <strong>{{ assignedUsers(data.item).join(', ') }}</strong>
        </span>
        <span v-else :title="$trans('Not assigned to anyone')">&ndash;</span>
      </span>
    </template>

    <template #cell(status)="data">
      <TableStatusInfo
        v-if="statuscodes.length"
        :model="data.item"
        model-name="order"
        :status-service="statusService"
        :statuscodes="statuscodes"
      />
    </template>

    <template #cell(actions)="data">
      <div class="orders-table-actions">
        <slot name="row-actions" :order="data.item" />
      </div>
    </template>
  </b-table>
</template>

<script>
import {StatusService} from '@/models/orders/Status.js'
import TableStatusInfo from './TableStatusInfo.vue'
import componentMixin from '@/mixins/common'
import {useMainStore} from '@/stores/main'

let instances = 0

// The orders list, everywhere it appears: the Orders page itself and the
// order blocks embedded in the equipment, location, building, branch,
// customer and maintenance-contract views.
//
// This replaces OrderTableInfo, which rendered a row as a CSS-grid <div>
// inside a <ul class="listing">. Two of its callers then nested that whole
// grid inside a single cell of a two-column <b-table>, so the same list was
// a table in some places and a list-pretending-to-be-a-table in others.
//
// Row actions are a slot rather than props: every caller wants a different
// set of icons, and passing seven booleans down was what made the old
// component hard to follow.
export default {
  name: 'OrdersTable',
  mixins: [componentMixin],
  components: {
    TableStatusInfo,
  },
  props: {
    orders: {
      type: Array,
      required: true,
    },
    busy: {
      type: Boolean,
      default: false,
    },
    // Column keys to leave out, for the embedded blocks that already show the
    // customer or the equipment in their own header.
    hideColumns: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      statusService: new StatusService(),
      tableId: `orders-table-${++instances}`,
    }
  },
  computed: {
    mainStore() {
      return useMainStore()
    },
    memberType() {
      return this.mainStore.getMemberType
    },
    statuscodes() {
      return this.mainStore.getStatuscodes || []
    },
    includeReference() {
      return this.mainStore.getOrderListMustIncludeReference
    },
    // The column set and order of the mockup's /opdrachten screen:
    // Nr. | Klant | Project | Monteur | Status | Datum. `order_type` sits in
    // the Project slot — the mockup's values there are free-text job
    // descriptions and Order has no such field, so the order's type is the
    // closest thing we hold. The mockup has no document column.
    visibleFields() {
      const fields = [
        {key: 'order_id', label: this.$trans('order id')},
        {key: 'order_name', label: this.$trans('company')},
        {key: 'order_type', label: this.$trans('type')},
        {key: 'assignees', label: this.$trans('people')},
        {key: 'status', label: this.$trans('status')},
        {key: 'start_date', label: this.$trans('start date')},
        {key: 'actions', label: ''},
      ]

      return fields.filter((field) => !this.hideColumns.includes(field.key))
    },
  },
  methods: {
    assignedUsers(order) {
      return (order.assigned_user_info || []).map((userInfo) => (
        userInfo.license_plate
          ? `${userInfo.full_name} (${userInfo.license_plate})`
          : userInfo.full_name
      ))
    },
  },
}
</script>

<style scoped>
/* the action icons used to sit in a `h2 float-right` div per caller */
.orders-table-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: .25rem;
  white-space: nowrap;
}
</style>
