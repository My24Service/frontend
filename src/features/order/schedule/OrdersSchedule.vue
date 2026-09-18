<template>
  <div :class="isDefaultFamily ? '' : 'app-page schedule-shltr'">
    <header v-if="!isDefaultFamily"></header>

    <div :class="isDefaultFamily ? '' : 'tw:mx-auto tw:max-w-[1400px] tw:p-6'">
      <div :class="isDefaultFamily ? '' : 'tw:overflow-hidden tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white'">
        <!-- the shltr card header: title, how many orders are in view, the
             controls that drive the calendar (its own toolbar is off), the
             period and the order-type legend. The default family keeps
             FullCalendar's own toolbar instead. -->
        <template v-if="!isDefaultFamily">
          <div class="tw:flex tw:flex-col tw:gap-3 tw:bg-teal-500 tw:px-6 tw:py-4 tw:text-white tw:sm:flex-row tw:sm:items-center">
            <div class="tw:flex tw:items-center tw:gap-3">
              <IBiCalendar3 class="tw:text-xl"></IBiCalendar3>
              <h2 class="tw:m-0 tw:text-xl tw:font-semibold">{{ $trans('Planning') }}</h2>
              <span class="tw:rounded-full tw:bg-white/20 tw:px-2.5 tw:py-0.5 tw:text-xs tw:font-medium">
                {{ eventCount }} {{ eventCount === 1 ? $trans('appointment') : $trans('appointments') }}
              </span>
            </div>

            <div class="tw:flex tw:items-center tw:gap-2 tw:sm:ml-auto">
              <button
                type="button"
                class="schedule-shltr-btn tw:rounded-md tw:border tw:border-solid tw:border-white/30 tw:bg-white/15 tw:px-3 tw:py-1.5 tw:text-sm tw:text-white tw:hover:bg-white/25"
                :title="$trans('Previous')"
                @click="goPrev"
              ><IBiChevronLeft></IBiChevronLeft></button>
              <button
                type="button"
                class="schedule-shltr-btn tw:rounded-md tw:border tw:border-solid tw:border-white/30 tw:bg-white/15 tw:px-3 tw:py-1.5 tw:text-sm tw:text-white tw:hover:bg-white/25"
                :title="$trans('Next')"
                @click="goNext"
              ><IBiChevronRight></IBiChevronRight></button>
              <button
                type="button"
                class="schedule-shltr-btn tw:rounded-md tw:border tw:border-solid tw:border-white/30 tw:bg-white/15 tw:px-3 tw:py-1.5 tw:text-sm tw:text-white tw:hover:bg-white/25"
                @click="goToday"
              >{{ $trans('Today') }}</button>

              <div class="tw:ml-2 tw:flex tw:overflow-hidden tw:rounded-md tw:border tw:border-solid tw:border-white/30">
                <button
                  v-for="view in views"
                  :key="view.name"
                  type="button"
                  class="schedule-shltr-btn tw:border-0 tw:px-3 tw:py-1.5 tw:text-sm"
                  :class="activeView === view.name
                    ? 'tw:bg-white tw:font-medium tw:text-teal-700'
                    : 'tw:bg-white/15 tw:text-white tw:hover:bg-white/25'"
                  @click="changeView(view.name)"
                >{{ view.label }}</button>
              </div>
            </div>
          </div>

          <!-- period + the order-type legend -->
          <div class="tw:flex tw:flex-wrap tw:items-center tw:gap-2 tw:border-b tw:border-slate-200 tw:bg-white tw:px-6 tw:py-3">
            <span class="tw:text-sm tw:font-semibold tw:text-slate-900">{{ calendarTitle }}</span>
            <div v-if="orderTypes.length" class="tw:ml-auto tw:flex tw:flex-wrap tw:items-center tw:gap-2">
              <button
                v-if="selectedOrderTypes.length"
                type="button"
                class="schedule-shltr-btn tw:border-0 tw:bg-transparent tw:px-1 tw:text-xs tw:text-slate-500 tw:underline tw:hover:text-slate-900"
                @click="selectedOrderTypes = []"
              >{{ $trans('Clear') }}</button>
              <!-- doubles as the filter: with nothing picked every type shows,
                   which is the legend the mockup draws -->
              <button
                v-for="orderType in orderTypes"
                :key="orderType"
                type="button"
                class="schedule-shltr-btn tw:rounded-full tw:border-0 tw:px-2.5 tw:py-0.5 tw:text-xs tw:font-medium"
                :class="[
                  `my24-event-type-${orderTypeColorIndex(orderType)}`,
                  selectedOrderTypes.length && !selectedOrderTypes.includes(orderType)
                    ? 'tw:opacity-40'
                    : '',
                ]"
                :aria-pressed="selectedOrderTypes.includes(orderType)"
                @click="toggleOrderType(orderType)"
              >{{ orderType }}</button>
            </div>
          </div>
        </template>

        <div
          id="calendar"
          ref="calendar-element"
          :class="isDefaultFamily ? '' : 'schedule-shltr-calendar'"
        />
      </div>
    </div>

    <ScheduleOrderModal
      ref="order-modal"
      :order="selectedOrder"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue'
import type { CalendarOptions } from '@fullcalendar/core'
import bootstrap5Plugin from '@fullcalendar/bootstrap5'
import 'bootstrap-icons/font/bootstrap-icons.css'

import { $trans } from '@/services/i18n'
import { useMainStore } from '@/stores/main'
import ScheduleOrderModal from './ScheduleOrderModal.vue'
import { useSchedule } from './use-schedule'

/**
 * The orders schedule for both product families.
 *
 * shltr: the mockup puts the period and the view switch in the card's own
 * header, so FullCalendar's toolbar is off and the buttons here drive the
 * calendar; `themeSystem` stays at the default, since the bootstrap5 theme
 * would pull in exactly the chrome the card replaces. The order-type legend
 * doubles as a filter over the range already loaded.
 *
 * default: FullCalendar's own toolbar, bootstrap-styled, no card chrome.
 *
 * Family accounting: the `isDefaultFamily` class bindings are the CSS
 * mechanism (the root carries the `schedule-shltr` family class the
 * stylesheet hangs off), leaving two structural family decisions — the
 * card header above and the calendar options below — in the one screen,
 * with the data in `useSchedule`. No family pair, no picker.
 *
 * The `start`/`end` route params the legacy declared were never read by
 * either design and are not taken here.
 */
const mainStore = useMainStore()
const isDefaultFamily = computed(() => mainStore.getProductFamily === 'default')

const {
  orderTypes,
  orderTypeColorIndex,
  selectedOrderTypes,
  toggleOrderType,
  eventCount,
  selectedOrder,
  orderModal,
  calendar,
  mountCalendar,
  applyLegendFilter,
} = useSchedule()

const element = useTemplateRef<HTMLElement>('calendar-element')
const modal = useTemplateRef<{show: () => void}>('order-modal')

const calendarTitle = ref('')
const activeView = ref('dayGridMonth')

const views = computed(() => [
  {name: 'dayGridMonth', label: $trans('Month')},
  {name: 'timeGridWeek', label: $trans('Week')},
  {name: 'timeGridDay', label: $trans('Day')},
])

const familyOptions = (): CalendarOptions => isDefaultFamily.value
  ? {
    plugins: [bootstrap5Plugin],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay',
    },
    themeSystem: 'bootstrap5',
  }
  : {
    headerToolbar: false,
    initialView: activeView.value,
    dayHeaderFormat: {weekday: 'short'},
    datesSet: (info) => {
      calendarTitle.value = info.view.title
      activeView.value = info.view.type
    },
  }

onMounted(() => {
  orderModal.value = modal.value
  if (!element.value) return
  mountCalendar(element.value, familyOptions())
})

watch(selectedOrderTypes, applyLegendFilter)

const goPrev = () => calendar.value?.prev()
const goNext = () => calendar.value?.next()
const goToday = () => calendar.value?.today()
const changeView = (name: string) => calendar.value?.changeView(name)
</script>

<style scoped>
a.my24-event {
  overflow-wrap: break-word;
  white-space: wrap;
}
</style>
