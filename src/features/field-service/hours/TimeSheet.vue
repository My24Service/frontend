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
import moment from 'moment/min/moment-with-locales'

import {mobileAssignedorderListTimesheetTotalsRetrieveOptions} from '@/api/@tanstack/vue-query.gen'
import type {ListTimesheetTotalsResponse} from '@/api/types.gen'
import {useQueryErrorToast} from '@/features/forms/use-query-error-toast'
import {$trans} from '@/services/i18n'
import {useMainStore} from '@/stores/main'
import UserHoursData from './UserHoursData.vue'

/**
 * The Timesheet console: the week's totals per user, and the materials booked
 * against that week.
 *
 * One request feeds both. The grid is a child that renders what it is given -
 * it is declarative and therefore cannot fetch - so the payload is loaded here,
 * once, and handed over through the child's `processData`. Each Timesheet
 * screen owns its own query: the two used to share a module-level model whose
 * `setListArgs` the detail overwrote for the list and back again.
 */

interface UserHoursDataHandle {
  processData: (payload: ListTimesheetTotalsResponse) => void
}

const store = useMainStore()
const route = useRoute()

const lang: string = store.getCurrentLanguage || 'nl'
// See UserHoursData: the index that lands on Monday depends on whether the
// locale starts its week on Sunday.
const monday = lang === 'en' ? 1 : 0
moment.locale(lang)

/**
 * The week the screen shows, from the address.
 *
 * A date in the query string is the day itself and is used verbatim; only an
 * address without one falls back to the week the screen is in. It is read
 * reactively rather than once at creation: the layout renders the content view
 * with `:key="$route.fullPath"` (src/components/TheAppLayout.vue), so the
 * legacy screen was rebuilt - and refetched - on every change of the address,
 * and week navigation rides that query.
 */
const startDate = computed(() => {
  const dateQuery = typeof route.query.date === 'string' ? route.query.date : undefined
  return (dateQuery ? moment(dateQuery) : moment().weekday(monday)).format('YYYY-MM-DD')
})

/**
 * The week's totals, for the week on screen.
 *
 * The endpoint declares `start_date` as the anchor its window is computed
 * from; sending none asks for the endpoint's own default window.
 */
const timesheet = useQuery(() => mobileAssignedorderListTimesheetTotalsRetrieveOptions({
  query: {start_date: startDate.value},
}))

const isLoading = computed(() => timesheet.isLoading.value)

/**
 * The materials of the week on screen.
 *
 * Assigned only when a payload arrives, so a failed week leaves the last good
 * one standing - as the legacy screen did, which filled this in its try block
 * only. The grid behaves the same way, because the child keeps whatever
 * `processData` was last given.
 */
const materials = ref<ListTimesheetTotalsResponse['materials']>([])

const userHoursData = useTemplateRef<UserHoursDataHandle>('user-hours-data')

useQueryErrorToast(timesheet.error, $trans('Error loading orders'))

// A watcher rather than the request's own continuation, because either of the
// two facts it needs can arrive second: the payload (which vue-query hands
// over synchronously when the week is already cached) or the child (which
// mounts with this template and may be replaced later).
watchEffect(() => {
  const payload = timesheet.data.value
  const child = userHoursData.value

  if (!payload) return

  materials.value = payload.materials

  // The parent's call lands on a ref the child exposes; a child that is not
  // there (or is a stub) must not throw, so the handle is checked first.
  if (typeof child?.processData === 'function') {
    child.processData(payload)
  }
})

const materialFields = [
  {label: $trans('Material'), key: 'material_name', sortable: true},
  {label: $trans('Identifier'), key: 'material_identifier', sortable: true},
  {label: $trans('Amount'), key: 'amount', sortable: true},
]
</script>

<style scoped>
</style>
