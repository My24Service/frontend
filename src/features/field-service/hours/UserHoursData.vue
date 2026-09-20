<template>
  <div class="app-grid">
    <BRow>
      <BCol cols="2">
        <BLink
          v-bind:title="$trans('Week back')"
          @click.prevent="backWeek"
        >
          <IBiArrowLeft font-scale="1.8"></IBiArrowLeft>
        </BLink>
      </BCol>
      <BCol cols="8">
        {{ hoursTitle }} - {{ week }}/{{ today.format('Y') }}
      </BCol>
      <BCol cols="2">
        <div class="float-right">
          <BLink
            v-bind:title="$trans('Next week')"
            @click.prevent="nextWeek"
          >
            <IBiArrowRight font-scale="1.8"></IBiArrowRight>
          </BLink>
        </div>
      </BCol>
    </BRow>

    <BTable
      id="user-hours-table"
      small
      :fields="fields"
      :items="data"
      responsive="md"
      class="data-table"
      :sort-by="sortBy"
    >
      <template #table-busy>
        <div class="text-center text-danger my-2">
          <BSpinner class="align-middle"></BSpinner>&nbsp;&nbsp;
          <strong>{{ $trans('Loading...') }}</strong>
        </div>
      </template>
      <template #cell(full_name)="data">
        <router-link
          class="px-1"
          :to="{
            name: detail_route_name,
            params: {user_id: data.item.user_id},
            query: {date: startDate}}"
        >
          {{ data.item.full_name }}
        </router-link>
      </template>
    </BTable>
  </div>
</template>

<script setup lang="ts">
import moment from 'moment/min/moment-with-locales'
import type {Moment} from 'moment'

import type {ListTimesheetTotalsResponse} from '@/api/types.gen'
import {$trans} from '@/services/i18n'
import {useMainStore} from '@/stores/main'
import {displayDurationFromSeconds, translateHoursField} from './hours-fields'
import {useUserHoursPivot} from './useUserHoursPivot'

/**
 * The week grid: one row per user, one column per day, plus the week total.
 *
 * The screen is declarative. It fetches nothing of its own - the parent loads
 * the payload once and hands it over through the exposed `processData`, so the
 * header, the columns and the day-field names all come from the payload rather
 * than from a shape this component knows in advance.
 */

interface TableField {
  key: string
  label: string
  sortable?: boolean
}

interface SortBy {
  key: string
  order: 'asc' | 'desc'
}

withDefaults(defineProps<{
  /** The route the user names link to; the parent's router owns the name. */
  detail_route_name?: string
}>(), {
  detail_route_name: undefined,
})

const store = useMainStore()
const route = useRoute()
const router = useRouter()

const lang: string = store.getCurrentLanguage || 'nl'
// Which day the week starts on is the locale's first day of the week, so the
// index that lands on Monday is 1 in an English (Sunday-first) locale and 0 in
// every other one. The parent computes its `start_date` the same way.
const monday = lang === 'en' ? 1 : 0
moment.locale(lang)
// The week on screen is a plain date string, not a Moment: a Moment in a ref is
// moved by mutating it in place, which Vue cannot see, so the header would keep
// the week number it started on between two arrows. The legacy screens were
// spared that only by the layout rebuilding the screen on every change of the
// address (`:key="$route.fullPath"` in src/components/TheAppLayout.vue).
const dateQuery = typeof route.query.date === 'string' ? route.query.date : undefined
const startDate = ref(dateQuery ?? moment().weekday(monday).format('YYYY-MM-DD'))
const today = computed<Moment>(() => moment(startDate.value))
const week = computed(() => today.value.format('[week] W'))

const data = ref<Record<string, string | number>[]>([])
const fields = ref<TableField[]>([])
const day_fields = ref<string[]>([])
const day_field_types = ref<string[]>([])

const pivot = useUserHoursPivot(displayDurationFromSeconds)

const hoursTitle = computed(() => {
  const result: (string | undefined)[] = []
  if (day_fields.value) {
    for (let i = 0; i < day_fields.value.length; i++) {
      result.push(translateHoursField(day_fields.value[i]))
    }
  }
  return result.join(' / ')
})

// The sort rides the address like the week does, and is restored from it
// before the first payload arrives.
const sortField = typeof route.query.sort_field === 'string' ? route.query.sort_field : undefined
const sortDir = typeof route.query.sort_dir === 'string' ? route.query.sort_dir : undefined
const sortBy = ref<SortBy[]>([
  {key: sortField ?? 'full_name', order: sortDir === 'desc' ? 'desc' : 'asc'},
])

/**
 * Move the week through the address rather than in local state: the parent
 * reads the date from the address and refetches on it, and the browser's back
 * button walks the same steps. The duplicate-navigation rejection is swallowed,
 * as the legacy screens swallowed it.
 */
function goToWeek(days: number) {
  startDate.value = today.value.clone().add(days, 'days').format('YYYY-MM-DD')

  const query = {
    ...route.query,
    date: startDate.value,
  }
  router.push({query}).catch(() => {})
}

function nextWeek() {
  goToWeek(7)
}

function backWeek() {
  goToWeek(-7)
}

/**
 * Render a payload the parent fetched.
 *
 * Exposed because the payload is the parent's: this screen renders what it is
 * given and never asks for it, which is what keeps the two Timesheet screens on
 * one request.
 */
function processData(payload: ListTimesheetTotalsResponse) {
  day_fields.value = payload.day_fields
  day_field_types.value = payload.day_field_types
  const header_columns: TableField[] = []

  header_columns.push({
    key: 'full_name',
    label: $trans('User'),
    sortable: true,
  })

  for (let i = 0; i < payload.date_list.length; i++) {
    header_columns.push({
      key: `day${i}`,
      label: moment(payload.date_list[i]).format('ddd DD'),
      sortable: true,
    })
  }

  header_columns.push({
    key: 'total',
    label: $trans('Total'),
    sortable: true,
  })

  fields.value = header_columns

  const results: Record<string, string | number>[] = []

  for (let i = 0; i < payload.result.length; i++) {
    const obj: Record<string, string | number> = {
      'full_name': payload.result[i].full_name,
      'user_id': payload.result[i].user_id,
    }

    for (let j = 0; j < payload.result[i].day_totals.length; j++) {
      obj[`day${j}`] = pivot.formatDays(payload.result[i].day_totals[j], day_field_types.value)
    }

    // `formatDays` answers '' for a week with nothing in it, which is what the
    // total column shows then - the same empty string the legacy screen
    // assigned in its else branch.
    obj['total'] = pivot.formatDays(payload.result[i].week_totals, day_field_types.value)

    results.push(obj)
  }

  data.value = results
}

defineExpose({processData})
</script>

<style scoped>

</style>
