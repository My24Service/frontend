<template>
  <div class="app-grid">
    <BRow>
      <BCol cols="2">
        <BLink @click.prevent="backWeek" v-bind:title="$trans('Week back')">
          <IBiArrowLeft font-scale="1.8"></IBiArrowLeft>
        </BLink>
      </BCol>
      <BCol cols="8">
        {{ hoursTitle }} - {{ week }}/{{ today.format('Y') }}
      </BCol>
      <BCol cols="2">
        <div class="float-right">
          <BLink @click.prevent="nextWeek" v-bind:title="$trans('Next week') ">
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
        <router-link class="px-1" :to="{
          name: detail_route_name,
          params: {user_id: data.item.user_id},
          query: {date: startDate}}">
          {{ data.item.full_name }}
        </router-link>
      </template>
    </BTable>
  </div>
</template>

<script setup lang="ts">
import moment from 'moment/min/moment-with-locales'
import type {Moment} from 'moment'
import {$trans} from '@/services/i18n'
import {useMainStore} from '@/stores/main'
import {useUserHoursPivot} from './useUserHoursPivot'

interface TableField {
  key: string
  label: string
  sortable?: boolean
}

type SortOrder = 'asc' | 'desc'

interface SortBy {
  key: string
  order: SortOrder
}

interface UserHoursResultRow {
  full_name: string
  user_id: number
  day_totals: (number | null)[][]
  week_totals: (number | null)[]
}

interface UserHoursPayload {
  day_fields: string[]
  day_field_types: string[]
  date_list: string[]
  result: UserHoursResultRow[]
}

withDefaults(defineProps<{
  detail_route_name?: string
}>(), {
  detail_route_name: undefined,
})

const store = useMainStore()
const route = useRoute()
const router = useRouter()

const lang: string = store.getCurrentLanguage || 'nl'
const monday = lang === 'en' ? 1 : 0
moment.locale(lang)
const dateQuery = typeof route.query.date === 'string' ? route.query.date : undefined
const today = ref<Moment>(dateQuery ? moment(dateQuery) : moment().weekday(monday))
const startDate = ref(today.value.format('YYYY-MM-DD'))
const week = ref(today.value.format('[week] W'))

const data = ref<Record<string, string | number>[]>([])
const fields = ref<TableField[]>([])
const sortBy = ref<SortBy[]>([{key: 'full_name', order: 'asc'}])
const day_fields = ref<string[]>([])
const day_field_types = ref<string[]>([])

function translateHoursField(field: string): string | undefined {
  const allFields: Record<string, string> = {
    'work_total': $trans("Work total"),
    'break_total': $trans('Breaks total'),
    'travel_total': $trans('Travel total'),
    'distance_total': $trans('Distance total'),
    'extra_work': $trans('Total extra work'),
    'actual_work': $trans('Total actual work'),
    'unforeseen_work': $trans('Total unforeseen work'),
    'distance_fixed_rate_amount': $trans('Total trips'),
  }

  return allFields[field]
}

function displayDurationFromSeconds(seconds: number, excludeSeconds: boolean): string {
  const totalMilliseconds = seconds * 1000
  const hours = parseInt(String(moment.duration(totalMilliseconds).asHours()))
  const format = excludeSeconds ? 'mm' : 'mm:ss'
  return `${hours}:${moment.utc(totalMilliseconds).format(format)}`
}

const hoursTitle = computed(() => {
  const result: (string | undefined)[] = []
  if (day_fields.value) {
    for (let i = 0; i < day_fields.value.length; i++) {
      result.push(translateHoursField(day_fields.value[i]))
    }
  }
  return result.join(' / ')
})

const sortField = typeof route.query.sort_field === 'string' ? route.query.sort_field : undefined
const sortDir = typeof route.query.sort_dir === 'string' ? route.query.sort_dir : undefined
const sortOrder: SortOrder = sortDir === 'desc' ? 'desc' : 'asc'
sortBy.value = [{key: sortField ?? 'full_name', order: sortOrder}]

function nextWeek() {
  today.value.add(7, 'days')
  const query = {
    ...route.query,
    date: today.value.format('YYYY-MM-DD'),
  }
  router.push({query}).catch(() => {})
}

function backWeek() {
  today.value.subtract(7, 'days')
  const query = {
    ...route.query,
    date: today.value.format('YYYY-MM-DD'),
  }
  router.push({query}).catch(() => {})
}

function formatDays(dayData: (number | null)[]): string {
  const {formatDays: formatPivotDays} = useUserHoursPivot(displayDurationFromSeconds)
  return formatPivotDays(dayData, day_field_types.value)
}

function processData(payload: UserHoursPayload) {
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
      obj[`day${j}`] = formatDays(payload.result[i].day_totals[j])
    }

    const week_totals = formatDays(payload.result[i].week_totals)
    if (week_totals) {
      obj['total'] = week_totals
    } else {
      obj['total'] = ''
    }

    results.push(obj)
  }

  data.value = results
}

defineExpose({processData})
</script>

<style scoped>

</style>
