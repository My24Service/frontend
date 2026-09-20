<template>
  <div class="app-detail">
    <BBreadcrumb
      class="mt-2"
      :items="breadcrumb"
    ></BBreadcrumb>
    <BRow>
      <BCol cols="2">
        <BLink
          class="px-1"
          v-bind:title="$trans('Week back')"
          @click.prevent="backWeek"
        >
          <IBiArrowLeft font-scale="1.8"></IBiArrowLeft>
        </BLink>
      </BCol>
      <BCol cols="8">
        {{ $trans('Totals in') }}
        {{ week }}/{{ today.format('Y') }}
        {{ $trans('for') }} {{ fullName }}
      </BCol>
      <BCol cols="2">
        <div class="float-right">
          <BLink
            class="px-1"
            v-bind:title="$trans('Next week')"
            @click.prevent="nextWeek"
          >
            <IBiArrowRight font-scale="1.8"></IBiArrowRight>
          </BLink>
        </div>
      </BCol>
    </BRow>

    <BTable
      id="user-hours-detail-table"
      small
      :fields="fields"
      :items="data"
      responsive="md"
      class="data-table"
    >
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
 * One user's week, broken out per day field: the row behind a click in the
 * Timesheet grid.
 *
 * Declarative, like its list sibling: the parent fetches the payload and hands
 * it over through the exposed `processData`. The API answers one result row for
 * this endpoint (a user and a week), which is why the rows below are built from
 * the first one.
 */

interface TableField {
  key: string
  label: string
  sortable?: boolean
}

const props = withDefaults(defineProps<{
  /** The route the breadcrumb links back to; the parent's router owns the name. */
  main_grid_router_name?: string
  breadcrumb_main_grid_title?: string
  breadcrumb_grid_title?: string
}>(), {
  main_grid_router_name: '',
  breadcrumb_main_grid_title: '',
  breadcrumb_grid_title: '',
})

const store = useMainStore()
const route = useRoute()
const router = useRouter()

const lang: string = store.getCurrentLanguage || 'nl'
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

const fullName = ref<string | null>(null)
const data = ref<Record<string, string | number | null | undefined>[]>([])
const fields = ref<TableField[]>([])
const day_fields = ref<string[]>([])
const day_field_types = ref<string[]>([])

const pivot = useUserHoursPivot(displayDurationFromSeconds)

const breadcrumb = computed(() => [
  {
    text: props.breadcrumb_main_grid_title,
    to: {name: props.main_grid_router_name, query: {date: startDate.value}},
  },
  {
    text: props.breadcrumb_grid_title,
    active: true,
  },
])

/** Move the week through the address, as UserHoursData does. */
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
 * Render a payload the parent fetched: one row per day field, one column per
 * day of the week, plus the field's own week total.
 */
function processData(payload: ListTimesheetTotalsResponse) {
  fullName.value = payload.full_name
  day_fields.value = payload.day_fields
  day_field_types.value = payload.day_field_types

  const header_columns: TableField[] = [{label: $trans('Field'), key: 'field'}]

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

  const results: Record<string, string | number | null | undefined>[] = []

  if (payload.result.length) {
    for (let i = 0; i < day_fields.value.length; i++) {
      const field = day_fields.value[i]

      const row: Record<string, string | number | null | undefined> = {
        field: translateHoursField(field),
      }

      for (let j = 0; j < payload.result[0].day_totals.length; j++) {
        row[`day${j}`] = pivot.formatValue(payload.result[0].day_totals[j][i], i, day_field_types.value)
      }

      row['total'] = pivot.formatValue(payload.result[0].week_totals[i], i, day_field_types.value)

      results.push(row)
    }
  }

  data.value = results
}

defineExpose({processData})
</script>

<style scoped>

</style>
