<template>
  <div>
    <div
      id="calendar"
    ></div>
    <ScheduleOrderModal :selected-order="selectedOrder" ref="order-info-modal" />
  </div>
</template>
<script>
import { Calendar } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import bootstrap5Plugin from '@fullcalendar/bootstrap5';
import 'bootstrap-icons/font/bootstrap-icons.css';
import locale from '@fullcalendar/core/locales/nl';
import scheduleMixin from './scheduleMixin'
import ScheduleOrderModal from './ScheduleOrderModal.vue'

export default {
  name: "OrdersScheduleDefault",
  components: {ScheduleOrderModal},
  setup(props, ctx) {
    return {
      ...scheduleMixin.setup(props, ctx),
    }
  },
  mixins: [scheduleMixin],
  async mounted() {
    const calendarEl = document.getElementById('calendar')
    const calendar = new Calendar(calendarEl, {
      plugins: [
        dayGridPlugin,
        timeGridPlugin,
        interactionPlugin, // needed for dateClick
        bootstrap5Plugin,
      ],
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      initialView: 'dayGridMonth',
      events: this.sourceChanged,
      editable: true,
      selectable: true,
      selectMirror: true,
      dayMaxEvents: true,
      weekends: true,
      eventClick: this.handleEventClick,
      defaultAllDay: true,
      themeSystem: 'bootstrap5',
      locale,
    });
    this.calendar = calendar
    calendar.render()
  },
}
</script>

<style scoped>
a.my24-event {
  overflow-wrap: break-word;
  white-space: wrap;
}
</style>
