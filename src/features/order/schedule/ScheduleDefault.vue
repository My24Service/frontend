<template>
  <div>
    <div
      id="calendar"
      ref="calendar-element"
    />
    <ScheduleOrderModal
      ref="order-modal"
      :order="selectedOrder"
    />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, useTemplateRef } from 'vue'
import bootstrap5Plugin from '@fullcalendar/bootstrap5'
import 'bootstrap-icons/font/bootstrap-icons.css'

import ScheduleOrderModal from './ScheduleOrderModal.vue'
import { useSchedule } from './use-schedule'

/** The schedule in the default theme: FullCalendar's own toolbar, bootstrap-styled. */
const {selectedOrder, orderModal, mountCalendar} = useSchedule()

const element = useTemplateRef<HTMLElement>('calendar-element')
const modal = useTemplateRef<{show: () => void}>('order-modal')

onMounted(() => {
  orderModal.value = modal.value
  if (!element.value) return
  mountCalendar(element.value, {
    plugins: [bootstrap5Plugin],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay',
    },
    themeSystem: 'bootstrap5',
  })
})
</script>

<style scoped>
a.my24-event {
  overflow-wrap: break-word;
  white-space: wrap;
}
</style>
