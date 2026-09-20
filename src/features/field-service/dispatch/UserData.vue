<template>
  <div :class="containerDivClass">
    <strong>{{ orders.full_name }}</strong>
    <div
      v-for="userData of personOrders"
      :key="userData.order.order_id"
      :style="`grid-column: calc(${userData.layout.slot} + 2) / span ${userData.layout.days}; --status-color: ${userData.order_color}; --text-color: ${userData.order_textColor};`"
      :class="orderClass"
      @click="clickHandler(orders.user_id, userData.order.id, userData.assignedOrder, orders.is_partner)"
    >
      <span class="order-summary">
        <p>
          <strong class="dimmed">{{ userData.order.order_id }}</strong>{{ getTimeText(userData.assignedOrder) }}
        </p>
        <p><strong>{{ userData.order.order_name.substring(0, 16) }}</strong></p>
        <p><strong>{{ (userData.order.order_city ?? '').substring(0, 16) }}</strong></p>
        <p class="order-type"><strong>{{ userData.order.order_type.substring(0, 16) }}</strong></p>
        <p v-if="userData.order.order_reference"><strong>{{ userData.order.order_reference.substring(0, 16) }}</strong></p>
        <p v-else><i>{{ $trans("No reference") }}</i></p>

      </span>
      <OrderInfo
        :order="userData.order"
        :order_start="userData.order_start"
        :order_end="userData.order_end"
        :assigned-order="userData.assignedOrder"
        :grid-slot="userData.layout.slot"
      />

    </div>
  </div>
</template>

<script setup lang="ts">
import moment from 'moment/min/moment-with-locales'

import my24 from '@/services/my24'
import { $trans } from '@/services/i18n'
import { useMainStore } from '@/stores/main'
import OrderInfo from './OrderInfo.vue'
import type { AssignedUser } from '../assignment/assigned-user'
import type { DispatchBoardAssignedOrder, DispatchBoardOrder, DispatchBoardUser } from './dispatch-window'

/**
 * One planner row of the week board: a user's name, and a box per assignment
 * placed on the day it starts and spanning the days it covers.
 *
 * The boxes are derived state, not stored: the row's assignments, the week it
 * sits in and the tenant's statuscodes all arrive as props or from the store,
 * so a box is recomputed rather than pushed onto an array when any of them
 * changes.
 */
const props = defineProps<{
  orders: DispatchBoardUser
  startDate: Date
  clickHandler: (userId: number, orderId: number, assignedOrder: DispatchBoardAssignedOrder, isPartner: boolean) => void
  isAssignMode: boolean
  /** Who is already on the orders being assigned; an object or nothing. */
  alreadyAssigned?: AssignedUser
  mode: string
}>()

interface PlacedOrder {
  assignedOrder: DispatchBoardAssignedOrder
  order: DispatchBoardOrder & {assignedorder_status: string}
  person: string
  order_start: string | null
  order_end: string | null
  order_color: string
  order_textColor: string
  layout: {slot: number; days: number; d: string}
}

const store = useMainStore()

const statuscodes = computed(() => store.getStatuscodes)

const containerDivClass = computed(() => {
  if (props.alreadyAssigned) {
    return 'already-assigned'
  }
  if (props.orders.is_partner) {
    return 'is-partner'
  }

  return ''
})

const orderClass = computed(() =>
  props.isAssignMode || props.mode === 'compact' ? 'order-compact' : 'order-wide')

/**
 * The row's assignments, placed on the grid.
 *
 * `slot` is the box's first column and `days` how many it spans. An
 * assignment that started before the week does not vanish and does not start
 * on day zero with its full length: the days it lost are subtracted from the
 * span, so a job that ran from Monday the 7th to Wednesday the 16th on a week
 * that starts on the 14th is two days wide and flush left.
 */
const personOrders = computed<PlacedOrder[]>(() => {
  const placed: PlacedOrder[] = []

  for (const assignedOrder of props.orders.assignedorders) {
    if (Object.keys(assignedOrder.order).length === 0) {
      continue
    }

    const orderObj = {
      ...assignedOrder.order,
      assignedorder_status: assignedOrder.last_status,
    }

    const start = moment(assignedOrder.start_date)
    const end = moment(assignedOrder.end_date)
    let days = end.diff(start, 'days') + 1

    // Only the date part is compared: the two assignments' times of day are
    // irrelevant to which column a box starts in.
    const weekStart = moment(props.startDate)
    const diff = moment([start.year(), start.month(), start.date()])
      .diff([weekStart.year(), weekStart.month(), weekStart.date()], 'days')
    let gridSlot = parseInt(String(diff))

    if (gridSlot < 1) {
      days += gridSlot
      gridSlot = 0
    }

    const statuscode = my24.getStatuscodeForOrder(statuscodes.value, orderObj)

    placed.push({
      assignedOrder,
      order: orderObj,
      person: props.orders.full_name,
      order_start: assignedOrder.start_date,
      order_end: assignedOrder.end_date,
      order_color: my24.getStatuscodeColor(statuscode),
      order_textColor: my24.getStatuscodeColor(statuscode, true),
      layout: {
        slot: gridSlot,
        days,
        d: start.format('MMM DD') + '-' + end.format('MMM DD'),
      },
    })
  }

  return placed
})

function cleanTime(value: string | null): string | undefined {
  if (!value) {
    return undefined
  }

  const parts = value.split(':')
  return `${parts[0]}:${parts[1]}`
}

/** The assignment's hours as a cell shows them: `08:00-12:30`, or one end of it. */
function getTimeText(assignedOrder: DispatchBoardAssignedOrder): string | undefined {
  const startTime = cleanTime(assignedOrder.start_time)
  const endTime = cleanTime(assignedOrder.end_time)

  if (startTime && endTime) {
    return ` ${startTime}-${endTime}`
  }

  if (startTime) {
    return ` ${startTime}`
  }

  if (endTime) {
    return ` ${endTime}`
  }

  return undefined
}
</script>

<style></style>
