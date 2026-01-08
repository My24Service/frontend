<template>
  <div
    id="calendar"
  ></div>
</template>
<script>
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import {uuidv4} from "@/utils";
import BASE_URL from '@/services/base-url'
import client from "@/services/api";

import { Calendar } from '@fullcalendar/core'

export default {
  setup() {
    return {
    }
  },
  props: {
    start: {
      type: [String],
      default: null
    },
    end: {
      type: [String],
      default: null
    },
  },
  async mounted() {
    const calendarEl = document.getElementById('calendar')
    const calendar = new Calendar(calendarEl, {
      plugins: [
        dayGridPlugin,
        timeGridPlugin,
        interactionPlugin // needed for dateClick
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
      select: this.handleDateSelect,
      eventClick: this.handleEventClick,
    });
    this.calendar = calendar
    calendar.render()
  },
  name: "CustomerCalendar",
  methods: {
    async sourceChanged(fetchInfo, successCallback, failureCallback) {
      const start = fetchInfo.start
      const end = fetchInfo.end
      const eventUrl = `${BASE_URL}/api/order/order/month_events/?start=${start.getFullYear()}-${start.getMonth()+1}-${start.getDate()}&end=${end.getFullYear()}-${end.getMonth()+1}-${end.getDate()}`
      try {
        const eventsResponse = await client.get(eventUrl)
        const events = eventsResponse.data.events
        successCallback(events)
      } catch (e) {
        failureCallback(e)
      }
    },
    handleDateSelect(selectInfo) {
      let title = prompt('Please enter a new title for your event')
      let calendarApi = selectInfo.view.calendar

      calendarApi.unselect() // clear date selection

      if (title) {
        calendarApi.addEvent({
          id: uuidv4(),
          title,
          start: selectInfo.startStr,
          end: selectInfo.endStr,
          allDay: selectInfo.allDay
        })
      }
    },
    handleEventClick(clickInfo) {
      if (confirm(`Are you sure you want to delete the event '${clickInfo.event.title}'`)) {
        clickInfo.event.remove()
      }
    },
  }
}
</script>

<style scoped>
</style>
