<template>
  <b-overlay
    :show="isLoading"
    rounded="sm"
  >
    <div class="app-detail">
      <UserHoursDataDetail
        ref="user-hours-detail-data"
        main_grid_router_name="mobile-timesheet"
        :breadcrumb_main_grid_title="$trans('Timesheet')"
        :breadcrumb_grid_title="$trans('Timesheet detail')"
      />

      <b-table
        id="timesheet-detail-material-table"
        small
        :busy="isLoading"
        :fields="materialFields"
        :items="materials"
        responsive="md"
        class="data-table"
      >
      </b-table>
    </div>
  </b-overlay>
</template>

<script setup lang="ts">
import {useQueryErrorToast} from '@/features/forms'
import UserHoursDataDetail from './UserHoursDataDetail.vue'
import {useTimesheetWeek, type TimesheetChildHandle} from './use-timesheet-week'

/**
 * One user's week: the totals the Timesheet grid shows for a row, broken out
 * per day field, with the materials booked that week underneath.
 *
 * The week's query lives in `useTimesheetWeek`; this screen owns the
 * single-user form of it, keyed on the user and the week - the shared model it
 * used to write `user_id` into was the reason the list screen could ask for a
 * single user's hours. The breakdown is a declarative child, so the payload is
 * fetched once and handed over through its `processData`.
 */

const props = withDefaults(defineProps<{
  /** The user whose week this is - the route param, passed down by the router. */
  user_id?: string | number | null
}>(), {
  user_id: null,
})

const userHoursDetailData = useTemplateRef<TimesheetChildHandle>('user-hours-detail-data')

const {timesheet, isLoading, materials, materialFields} = useTimesheetWeek(
  () => userHoursDetailData.value,
  () => props.user_id,
)

useQueryErrorToast(timesheet.error, $trans('Error fetching timesheet details'))
</script>

<style scoped>
</style>
