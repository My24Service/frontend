<template>
  <div class="app-page schedule-shltr">
    <header></header>

    <div class="tw:mx-auto tw:max-w-[1400px] tw:p-6">
      <div class="tw:overflow-hidden tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white">
        <!-- the teal band: title, how many orders are in view, and the
             controls that drive the calendar (its own toolbar is off) -->
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

        <div ref="calendar" class="schedule-shltr-calendar"></div>
      </div>
    </div>

    <ScheduleOrderModal :selected-order="selectedOrder" ref="order-info-modal" />
  </div>
</template>

<script>
import { Calendar } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import 'bootstrap-icons/font/bootstrap-icons.css';
import locale from '@fullcalendar/core/locales/nl';
import scheduleMixin from './scheduleMixin'
import ScheduleOrderModal from './ScheduleOrderModal.vue'

export default {
  name: "OrdersScheduleShltr",
  components: {ScheduleOrderModal},
  setup(props, ctx) {
    return {
      ...scheduleMixin.setup(props, ctx),
    }
  },
  mixins: [scheduleMixin],
  data() {
    return {
      calendarTitle: '',
      activeView: 'dayGridMonth',
      selectedOrderTypes: [],
    }
  },
  computed: {
    // What the count pill shows: the events in view, after the legend
    // filter. Counting the loaded types rather than asking the calendar
    // keeps hidden events out without a second pass over its event objects.
    eventCount() {
      return this.loadedEventTypes.filter(
        (orderType) => this.isOrderTypeVisible(orderType)).length
    },
    views() {
      return [
        {name: 'dayGridMonth', label: this.$trans('Month')},
        {name: 'timeGridWeek', label: this.$trans('Week')},
        {name: 'timeGridDay', label: this.$trans('Day')},
      ]
    },
  },
  mounted() {
    // The mockup puts the period and the view switch in the card's own
    // header, so FullCalendar's toolbar is off and the buttons below drive
    // the calendar. `themeSystem` stays at the default: the bootstrap5 theme
    // would pull in Bootstrap's button and table chrome, which is exactly
    // what the card replaces.
    this.calendar = new Calendar(this.$refs.calendar, {
      plugins: [
        dayGridPlugin,
        timeGridPlugin,
        interactionPlugin, // needed for dateClick
      ],
      headerToolbar: false,
      initialView: this.activeView,
      events: this.sourceChanged,
      editable: true,
      selectable: true,
      selectMirror: true,
      dayMaxEvents: true,
      weekends: true,
      eventClick: this.handleEventClick,
      defaultAllDay: true,
      dayHeaderFormat: {weekday: 'short'},
      locale,
      datesSet: (info) => {
        this.calendarTitle = info.view.title
        this.activeView = info.view.type
      },
    });
    this.calendar.render()
  },
  unmounted() {
    if (this.calendar) {
      this.calendar.destroy()
    }
  },
  watch: {
    // Hiding rather than refetching: the filter is over the range already
    // loaded, so there is nothing to ask the server for.
    selectedOrderTypes() {
      this.calendar.getEvents().forEach((event) => {
        event.setProp(
          'display', this.isOrderTypeVisible(event.groupId) ? 'auto' : 'none')
      })
    },
  },
  methods: {
    isOrderTypeVisible(orderType) {
      return !this.selectedOrderTypes.length
        || this.selectedOrderTypes.includes(orderType)
    },
    toggleOrderType(orderType) {
      this.selectedOrderTypes = this.selectedOrderTypes.includes(orderType)
        ? this.selectedOrderTypes.filter((selected) => selected !== orderType)
        : [...this.selectedOrderTypes, orderType]
    },
    goPrev() {
      this.calendar.prev()
    },
    goNext() {
      this.calendar.next()
    },
    goToday() {
      this.calendar.today()
    },
    changeView(name) {
      this.calendar.changeView(name)
    },
  }
}
</script>
