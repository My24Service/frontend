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
import {displayDurationFromSeconds, translateHoursField} from './hours-fields'
import {buildDayHeaderColumns, useHoursWeekNav, type TableField} from './use-hours-week-nav'
import {useUserHoursPivot} from './useUserHoursPivot'

/**
 * One user's week, broken out per day field: the row behind a click in the
 * Timesheet grid.
 *
 * Declarative, like its list sibling: the parent fetches the payload and hands
 * it over through the exposed `processData`. The API answers one result row for
 * this endpoint (a user and a week), which is why the rows below are built from
 * the first one. The week it shows and the arrows that move it live in
 * `useHoursWeekNav`.
 */

const props = withDefaults(defineProps<{
  /** The route the breadcrumb links back to; the parent's router owns the name. */
  main_grid_router_name?: RouteName
  breadcrumb_main_grid_title?: string
  breadcrumb_grid_title?: string
}>(), {
  main_grid_router_name: undefined,
  breadcrumb_main_grid_title: '',
  breadcrumb_grid_title: '',
})

const {startDate, today, week, nextWeek, backWeek} = useHoursWeekNav()

const fullName = ref<string | null>(null)
const data = ref<Record<string, string | number | null | undefined>[]>([])
const fields = ref<TableField[]>([])
const day_fields = ref<string[]>([])
const day_field_types = ref<string[]>([])

const pivot = useUserHoursPivot(displayDurationFromSeconds)

const breadcrumb = computed(() => [
  {
    text: props.breadcrumb_main_grid_title,
    to: props.main_grid_router_name
      ? toRoute(props.main_grid_router_name, undefined, {date: startDate.value})
      : undefined,
  },
  {
    text: props.breadcrumb_grid_title,
    active: true,
  },
])

/**
 * Render a payload the parent fetched: one row per day field, one column per
 * day of the week, plus the field's own week total. The day columns come from
 * `useHoursWeekNav`.
 */
function processData(payload: Api.ListTimesheetTotalsResponse) {
  fullName.value = payload.full_name
  day_fields.value = payload.day_fields
  day_field_types.value = payload.day_field_types

  const header_columns: TableField[] = [
    {label: $trans('Field'), key: 'field'},
    ...buildDayHeaderColumns(payload.date_list),
  ]

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
