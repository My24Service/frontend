<template>
  <div
    id="calendar"
    v-if="events"
  ></div>
</template>
<script>
import FullCalendar from '@fullcalendar/vue3'
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
  async mounted() {
    // https://fullcalendar.io/api/demo-feeds/events.json?start=2025-12-28T00%3A00%3A00Z&end=2026-02-08T00%3A00%3A00Z&timeZone=UTC
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
      initialEvents: [],
      editable: true,
      selectable: true,
      selectMirror: true,
      dayMaxEvents: true,
      weekends: true,
      select: this.handleDateSelect,
      eventClick: this.handleEventClick,
      eventsSet: this.handleEvents
      /* you can update a remote database when these fire:
      eventAdd:
      eventChange:
      eventRemove:
      */
    });
    this.calendar = calendar
    calendar.render()
  },
  // components: {
  //   FullCalendar,
  // },
  data() {
    console.log('returning data', this.events)
    // const eventsString = '[{"title":"All Day Event","start":"2026-01-01"},{"title":"Long Event","start":"2026-01-07","end":"2026-01-10"},{"groupId":"999","title":"Repeating Event","start":"2026-01-09T16:00:00+00:00"},{"groupId":"999","title":"Repeating Event","start":"2026-01-16T16:00:00+00:00"},{"title":"Conference","start":"2026-01-06","end":"2026-01-08"},{"title":"Meeting","start":"2026-01-07T10:30:00+00:00","end":"2026-01-07T12:30:00+00:00"},{"title":"Lunch","start":"2026-01-07T12:00:00+00:00"},{"title":"Birthday Party","start":"2026-01-08T07:00:00+00:00"},{"url":"http:\\/\\/google.com\\/","title":"Click for Google","start":"2026-01-28"}]'
    // const events = JSON.parse(eventsString)
    return {
      events: [],
      calendar: null,
      calendarOptions: {
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
        initialEvents: this.events,
        editable: true,
        selectable: true,
        selectMirror: true,
        dayMaxEvents: true,
        weekends: true,
        select: this.handleDateSelect,
        eventClick: this.handleEventClick,
        eventsSet: this.handleEvents
        /* you can update a remote database when these fire:
        eventAdd:
        eventChange:
        eventRemove:
        */
      },
      currentEvents: [],
    }
  },
  name: "CustomerCalendar",
  computed: {
    getOptions() {
      return this.calendarOptions
    },
  },
  methods: {
    async fetchEvents() {
      const month= this.calendar.view.currentStart.getMonth() + 1
      const year= this.calendar.view.currentStart.getFullYear()
      const eventUrl = `${BASE_URL}/api/order/order/month_events/?month=${month}&year=${year}`
      const eventsResponse = await client.get(eventUrl)
      this.events = eventsResponse.data.events
      console.log('fetch done')
      this.calendar.setOption('initialEvents', this.events)
      this.calendar.render()
    },
    handleWeekendsToggle() {
      this.calendarOptions.weekends = !this.calendarOptions.weekends // update a property
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
    handleEvents(events) {
      console.log(events)
      this.currentEvents = events
      console.log(this.calendar.view.currentStart, this.calendar.view.currentEnd)
      this.fetchEvents()
    },
  }
}
</script>

<style scoped>
</style>


