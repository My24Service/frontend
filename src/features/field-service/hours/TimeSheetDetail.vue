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
import moment from 'moment/min/moment-with-locales'

import {mobileAssignedorderListTimesheetTotalsRetrieveOptions} from '@/api/@tanstack/vue-query.gen'
import type {ListTimesheetTotalsResponse} from '@/api/types.gen'
import {useQueryErrorToast} from '@/features/forms/use-query-error-toast'
import {$trans} from '@/services/i18n'
import {useMainStore} from '@/stores/main'
import UserHoursDataDetail from './UserHoursDataDetail.vue'

/**
 * One user's week: the totals the Timesheet grid shows for a row, broken out
 * per day field, with the materials booked that week underneath.
 *
 * One request feeds both, as on the list screen: the breakdown is a declarative
 * child, so the payload is fetched here and handed over through its
 * `processData`. This screen owns its own query, keyed on the user and the
 * week - the shared model it used to write `user_id` into was the reason the
 * list screen could ask for a single user's hours.
 */

interface UserHoursDataDetailHandle {
  processData: (payload: ListTimesheetTotalsResponse) => void
}

const props = withDefaults(defineProps<{
  /** The user whose week this is - the route param, passed down by the router. */
  user_id?: string | number | null
}>(), {
  user_id: null,
})

const store = useMainStore()
const route = useRoute()

const lang: string = store.getCurrentLanguage || 'nl'
const monday = lang === 'en' ? 1 : 0
moment.locale(lang)

/** The week the screen shows; see TimeSheet.vue for why it is reactive. */
const startDate = computed(() => {
  const dateQuery = typeof route.query.date === 'string' ? route.query.date : undefined
  return (dateQuery ? moment(dateQuery) : moment().weekday(monday)).format('YYYY-MM-DD')
})

/**
 * The user's week. Both parameters the screen sends are declared: `user_id`,
 * which the route hands over as text while the endpoint's type is an integer,
 * and the `start_date` anchor of the window.
 */
const timesheet = useQuery(() => mobileAssignedorderListTimesheetTotalsRetrieveOptions({
  query: {
    user_id: Number(props.user_id),
    start_date: startDate.value,
  },
}))

const isLoading = computed(() => timesheet.isLoading.value)

const materials = ref<ListTimesheetTotalsResponse['materials']>([])

const userHoursDetailData = useTemplateRef<UserHoursDataDetailHandle>('user-hours-detail-data')

useQueryErrorToast(timesheet.error, $trans('Error fetching timesheet details'))

watchEffect(() => {
  const payload = timesheet.data.value
  const child = userHoursDetailData.value

  if (!payload) return

  materials.value = payload.materials

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
