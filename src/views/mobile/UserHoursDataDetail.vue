<template>
    <div class="app-detail">
      <BBreadcrumb class="mt-2" :items="breadcrumb"></BBreadcrumb>
      <BRow>
        <BCol cols="2">
          <BLink class="px-1" @click.prevent="backWeek" v-bind:title="$trans('Week back')">
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
            <BLink class="px-1" @click.prevent="nextWeek" v-bind:title="$trans('Next week') ">
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
import {computed, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'

import {$trans} from '@/services/i18n'
import {useMainStore} from '@/stores/main'
import {useUserHoursPivot} from './useUserHoursPivot'

interface TableField {
  key: string
  label: string
  sortable?: boolean
}

interface UserHoursDetailResultRow {
  full_name: string
  day_totals: number[][]
  week_totals: number[]
}

interface UserHoursDetailPayload {
  full_name: string
  day_fields: string[]
  day_field_types: string[]
  date_list: string[]
  result: UserHoursDetailResultRow[]
}

const props = withDefaults(defineProps<{
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
const dateQuery = typeof route.query.date === 'string' ? route.query.date : undefined
const today = ref<Moment>(dateQuery ? moment(dateQuery) : moment().weekday(monday))
const startDate = ref(today.value.format('YYYY-MM-DD'))
const week = ref(today.value.format('[week] W'))

const fullName = ref<string | null>(null)
const data = ref<Record<string, string | number | undefined>[]>([])
const fields = ref<TableField[]>([])
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

function setDate() {
  startDate.value = today.value.format('YYYY-MM-DD')
  week.value = today.value.format('[week] W')
}

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

function formatValue(val: number, index: number): string | number {
  const {formatValue: formatPivotValue} = useUserHoursPivot(displayDurationFromSeconds)
  return formatPivotValue(val, index, day_field_types.value)
}

function processData(payload: UserHoursDetailPayload) {
  fullName.value = payload.full_name
  day_fields.value = payload.day_fields
  day_field_types.value = payload.day_field_types
  fullName.value = payload.full_name

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

  const results: Record<string, string | number | undefined>[] = []

  if (payload.result.length) {
    for (let i = 0; i < day_fields.value.length; i++) {
      const field = day_fields.value[i]

      const row: Record<string, string | number | undefined> = {
        field: translateHoursField(field),
      }

      for (let j = 0; j < payload.result[0].day_totals.length; j++) {
        row[`day${j}`] = formatValue(payload.result[0].day_totals[j][i], i)
      }

      row['total'] = formatValue(payload.result[0].week_totals[i], i)

      results.push(row)
    }
  }

  data.value = results
}

setDate()

defineExpose({processData})
</script>

<style scoped>

</style>
