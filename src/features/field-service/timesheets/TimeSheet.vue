<template>
  <div class="app-page">
    <header>
      <h3>{{ $trans('Timesheets') }}</h3>
    </header>
    <div class="panel">
      <UserHoursData
        ref="user-hours-data"
        detail_route_name="mobile-timesheet-detail"
      />

      <b-table
        id="timesheet-material-table"
        small
        :busy="isLoading"
        :fields="materialFields"
        :items="materials"
        responsive="md"
        class="data-table"
      >
      </b-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import {useQueryErrorToast} from '@/features/forms'
import UserHoursData from './UserHoursData.vue'
import {useTimesheetWeek, type TimesheetChildHandle} from './use-timesheet-week'

/**
 * The Timesheet console: the week's totals per user, and the materials booked
 * against that week.
 *
 * The week's query lives in `useTimesheetWeek`; this screen owns the list form
 * of it (everybody's week), while the detail screen owns the single-user form.
 * The grid is a child that renders what it is given - it is declarative and
 * therefore cannot fetch - so the payload is loaded once and handed over
 * through the child's `processData`.
 */

const userHoursData = useTemplateRef<TimesheetChildHandle>('user-hours-data')

const {timesheet, isLoading, materials, materialFields} = useTimesheetWeek(() => userHoursData.value)

useQueryErrorToast(timesheet.error, $trans('Error loading orders'))
</script>

<style scoped>
</style>
