<template>
  <section :class="`dispatch-calendar ${mode}`">

    <ul :class="`listing calendar week ${isLoading ? 'loading': ''}`">
      <li class="planning-head">
        <div class="weekdays">
          <div><b-spinner v-if="isLoading" small></b-spinner>{{ $trans("week") }}<strong>{{ currentWeek }}</strong>({{ currentMonth }})</div>
          <span v-for="day of displayWeekdays" :key="day.date" :data-day="day.day">
            <h5>
              <strong v-if="day.date === todaysDate.date && day.month === todaysDate.month" class="today">{{ day.date }}</strong>
              <strong v-else>{{ day.date }}</strong>
              <small>{{ day.day }}</small>
            </h5>
          </span>
        </div>
      </li>

      <li
        v-for="item of rows"
        :key="item.user_id"
        class="planning-row"
        @click="userClick(item.user_id, item.full_name)"
      >
          <UserData
            v-if="item.assignedorders.length"
            :orders="item"
            :start-date="startDate"
            :is-assign-mode="isAssignMode"
            :mode="mode"
            :already-assigned="alreadyAssignedUsers.find(user => user.user_id === item.user_id)"
            :click-handler="handleOrderClick"
          />
          <div
            v-else-if="showUser(item)"
          >
            <span
              class="dimmed"
            >
              {{ item.full_name }}
            </span>
          </div>
        <div v-else></div>

      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import moment from 'moment/min/moment-with-locales'

import { $trans } from '@/services/i18n'
import UserData from './UserData.vue'
import { useDispatchWindow, type DispatchBoardAssignedOrder, type DispatchBoardUser } from './dispatch-window'
import type { AssignedUser } from '../assignment/assigned-user'

/**
 * The week board: one row per user, one box per assignment, laid out over the
 * seven days of `startDate`'s week.
 *
 * The week is one read (`useDispatchWindow`), so moving the start date moves
 * the query and the grid follows. Nothing here fetches on behalf of a child:
 * a box is drawn from the row it belongs to, which is what keeps a week to a
 * single request.
 */
const props = withDefaults(defineProps<{
  /** The day the week starts on. */
  startDate: Date
  /** `compact` or `wide` — how much of each order a box shows. */
  mode: string
  /** Called with the order a planner clicked. */
  orderClickHandler: (userId: number, orderId: number, assignedOrder: DispatchBoardAssignedOrder, isPartner: boolean) => void
  isAssignMode?: boolean
  alreadyAssignedUsers?: AssignedUser[]
  /** `active` hides the users with nothing on; `all` shows them. */
  showUsersMode?: string
}>(), {
  isAssignMode: false,
  alreadyAssignedUsers: () => [],
  showUsersMode: 'active',
})

const emit = defineEmits<{
  (event: 'addSelectedUser', user: AssignedUser): void
}>()

const week = useDispatchWindow(() => props.startDate)

const isLoading = computed(() => week.isLoading.value)

/**
 * The response rows are typed loosely by the schema (`assignedorders` is
 * `Array<unknown>` there); the board reads them as the rows it documents.
 */
const rows = computed(() => ((week.data.value as {data: DispatchBoardUser[]} | undefined)?.data ?? []))

const currentWeek = computed(() => moment(props.startDate).format('w'))
const currentMonth = computed(() => moment(props.startDate).format('MMM'))

const todaysDate = computed(() => {
  const today = new Date()
  return {date: moment(today).format('DD'), month: moment(today).format('MMM')}
})

/** The seven headings above the grid, from the week's own first day. */
const displayWeekdays = computed(() => {
  const days: {day: string; date: string; month: string}[] = []
  const current = moment(props.startDate)

  for (let i = 0; i < 7; i++) {
    days.push({
      day: current.format('ddd'),
      date: current.format('D'),
      month: current.format('MMM'),
    })
    current.add(1, 'd')
  }

  return days
})

/** A user with nothing on is drawn only when the filter says so, or while assigning. */
function showUser(data: DispatchBoardUser): boolean {
  return props.isAssignMode || (!data.assignedorders.length && props.showUsersMode === 'all')
}

/** Clicking a row picks the user, and only while the board is assigning. */
function userClick(user_id: number, full_name: string) {
  if (!props.isAssignMode) {
    return
  }

  emit('addSelectedUser', {user_id, full_name})
}

function handleOrderClick(userId: number, orderId: number, assignedOrder: DispatchBoardAssignedOrder, isPartner: boolean) {
  props.orderClickHandler(userId, orderId, assignedOrder, isPartner)
}
</script>
