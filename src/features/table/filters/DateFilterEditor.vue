<template>
  <div ref="root" class="filter-editor filter-editor-date">
    <BFormRadioGroup
      v-model="mode"
      :options="modes"
      :name="`${columnId}-date-mode`"
      :aria-label="$trans('Kind of date filter')"
      buttons
      button-variant="outline-secondary"
      size="sm"
      class="filter-mode w-100"
    />

    <div class="filter-date-presets" role="group" :aria-label="$trans('Quick picks')">
      <button
        v-for="preset in presets"
        :key="preset.label"
        type="button"
        class="btn btn-sm btn-light filter-date-preset"
        @click="applyPreset(preset)"
      >{{ preset.label }}</button>
    </div>

    <VueDatePicker
      :key="mode"
      :model-value="pickerValue"
      inline
      auto-apply
      arrow-navigation
      :locale="nl"
      :week-start="1"
      :time-config="{enableTimePicker: false}"
      :month-picker="mode === 'month'"
      :year-picker="mode === 'year'"
      :range="mode === 'between'"
      :six-weeks="mode !== 'month' && mode !== 'year'"
      :aria-labels="{calendarWrap: `Filter ${columnId}`}"
      @update:model-value="onPick"
    />

    <div class="form-text">{{ hint }}</div>
  </div>
</template>

<script setup lang="ts">
import { VueDatePicker } from '@vuepic/vue-datepicker'
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from 'date-fns'
import { nl } from 'date-fns/locale'
import type { ColumnFilterSpec } from '../table'
import {
  formatDateFilter,
  parseDateFilter,
  periodEnd,
  periodFromDate,
  periodStart,
  type DateFilterValue,
  type DatePrecision,
} from './filter-grammar'

/**
 * A date filter over one inline calendar. The mode is the shape of the
 * wire value `apps/core/filters.DateFilter` reads: a whole day, month or
 * year (`2026-09-15`, `2026-09`, `2026`), one open-ended bound
 * (`2026-09-15...`, `...2026-09-15`) or a range of days
 * (`2026-09-01...2026-09-30`).
 *
 * Switching modes keeps the pick and re-expresses it: a day becomes its
 * month, a month the range of its days. A shared URL's exclusive range
 * (`..`) opens as the inclusive day range that means the same.
 */
const props = defineProps<{
  columnId: string
  spec: Extract<ColumnFilterSpec, {variant: 'date'}>
  /** The wire value. */
  modelValue: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
  (event: 'close'): void
}>()

type Mode = 'day' | 'month' | 'year' | 'from' | 'until' | 'between'

interface Preset {
  label: string
  start: Date
  end: Date
}

const modes = [
  {value: 'day', text: $trans('Day')},
  {value: 'month', text: $trans('Month')},
  {value: 'year', text: $trans('Year')},
  {value: 'from', text: $trans('From')},
  {value: 'until', text: $trans('Until')},
  {value: 'between', text: $trans('Between')},
]

const root = useTemplateRef<HTMLElement>('root')

const mode = ref<Mode>('day')
/** The picked day, or the first day of the picked period or range. */
const start = ref<Date | null>(null)
/** The last day of a range; unused outside `between`. */
const end = ref<Date | null>(null)

function read(raw: string) {
  const parsed = parseDateFilter(raw)
  if (!parsed) {
    mode.value = 'day'
    start.value = null
    end.value = null
    return
  }
  if (parsed.kind === 'period') {
    mode.value = parsed.period.precision
    start.value = periodStart(parsed.period)
    end.value = periodEnd(parsed.period)
    return
  }
  const {low, high, inclusive} = parsed
  // An exclusive bound is the day after / before its period.
  const from = low ? (inclusive ? periodStart(low) : addDays(periodEnd(low), 1)) : null
  const until = high ? (inclusive ? periodEnd(high) : subDays(periodStart(high), 1)) : null
  if (from && until) {
    mode.value = 'between'
    start.value = from
    end.value = until
  } else if (from) {
    mode.value = 'from'
    start.value = from
    end.value = from
  } else {
    mode.value = 'until'
    start.value = until
    end.value = until
  }
}

function write(): string {
  if (!start.value) return ''
  let filter: DateFilterValue
  switch (mode.value) {
    case 'day':
    case 'month':
    case 'year':
      filter = {kind: 'period', period: periodFromDate(start.value, mode.value)}
      break
    case 'from':
      filter = {kind: 'range', low: periodFromDate(start.value, 'day'), high: null, inclusive: true}
      break
    case 'until':
      filter = {kind: 'range', low: null, high: periodFromDate(start.value, 'day'), inclusive: true}
      break
    default:
      if (!end.value) return props.modelValue
      filter = {
        kind: 'range',
        low: periodFromDate(start.value, 'day'),
        high: periodFromDate(end.value, 'day'),
        inclusive: true,
      }
  }
  return formatDateFilter(filter)
}

read(props.modelValue)

/** What the calendar shows for the mode: a Date, a `{month, year}`, a year or a pair. */
const pickerValue = computed(() => {
  if (!start.value) return null
  switch (mode.value) {
    case 'month':
      return {month: start.value.getMonth(), year: start.value.getFullYear()}
    case 'year':
      return start.value.getFullYear()
    case 'between':
      return end.value ? [start.value, end.value] : [start.value]
    default:
      return start.value
  }
})

function onPick(value: unknown) {
  if (value == null) {
    start.value = null
    end.value = null
  } else if (mode.value === 'month') {
    const picked = value as {month: number; year: number}
    start.value = new Date(picked.year, picked.month, 1)
    end.value = endOfMonth(start.value)
  } else if (mode.value === 'year') {
    start.value = new Date(Number(value), 0, 1)
    end.value = endOfYear(start.value)
  } else if (mode.value === 'between') {
    const [from, until] = value as [Date, Date | null | undefined]
    start.value = from
    end.value = until ?? null
  } else {
    start.value = value as Date
    end.value = start.value
  }
  commit()
}

function commit() {
  const next = write()
  if (next !== props.modelValue) emit('update:modelValue', next)
}

// A mode switch keeps the pick: the calendar re-mounts on the mode (its
// `key`) with the same start, snapped to the period the new mode names.
watch(mode, (next) => {
  if (!start.value) return
  const precision: DatePrecision = next === 'month' ? 'month' : next === 'year' ? 'year' : 'day'
  const period = periodFromDate(start.value, precision)
  start.value = periodStart(period)
  end.value = next === 'between' ? (end.value ?? periodEnd(period)) : periodEnd(period)
  commit()
})

function applyPreset(preset: Preset) {
  start.value = preset.start
  end.value = preset.end
  commit()
}

const presets = computed<Preset[]>(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const week = {weekStartsOn: 1} as const
  switch (mode.value) {
    case 'day':
    case 'from':
    case 'until':
      return [
        {label: $trans('Today'), start: today, end: today},
        {label: $trans('Yesterday'), start: subDays(today, 1), end: subDays(today, 1)},
        {label: $trans('Tomorrow'), start: addDays(today, 1), end: addDays(today, 1)},
      ]
    case 'month':
      return [
        {label: $trans('This month'), start: startOfMonth(today), end: endOfMonth(today)},
        {label: $trans('Last month'), start: startOfMonth(subMonths(today, 1)), end: endOfMonth(subMonths(today, 1))},
        {label: $trans('Next month'), start: startOfMonth(addMonths(today, 1)), end: endOfMonth(addMonths(today, 1))},
      ]
    case 'year':
      return [
        {label: $trans('This year'), start: startOfYear(today), end: endOfYear(today)},
        {label: $trans('Last year'), start: startOfYear(subYears(today, 1)), end: endOfYear(subYears(today, 1))},
      ]
    default:
      return [
        {label: $trans('This week'), start: startOfWeek(today, week), end: endOfWeek(today, week)},
        {label: $trans('Last week'), start: startOfWeek(subDays(today, 7), week), end: endOfWeek(subDays(today, 7), week)},
        {label: $trans('Next 7 days'), start: today, end: addDays(today, 6)},
        {label: $trans('This month'), start: startOfMonth(today), end: endOfMonth(today)},
        {label: $trans('Last 30 days'), start: subDays(today, 29), end: today},
      ]
  }
})

const hint = computed(() => {
  switch (mode.value) {
    case 'day':
      return $trans('Rows on this day')
    case 'month':
      return $trans('Rows anywhere in this month')
    case 'year':
      return $trans('Rows anywhere in this year')
    case 'from':
      return $trans('Rows on this day or later')
    case 'until':
      return $trans('Rows on this day or earlier')
    default:
      return $trans('Pick the first and the last day')
  }
})

defineExpose({
  /** Called by the chip once its popover is on screen: the calendar, not the mode buttons, so the arrow keys move the day. */
  focus: () => root.value?.querySelector<HTMLElement>('.dp__calendar_item[tabindex="0"], .dp__overlay_cell_active, .dp__cell_inner')?.focus(),
})
</script>

<style scoped>
.filter-editor-date {
  min-width: 20rem;
}

.filter-mode {
  margin-bottom: 0.5rem;
}

.filter-date-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.filter-date-preset {
  padding: 0.1rem 0.5rem;
  font-size: 0.8rem;
}

.filter-editor-date :deep(.dp__menu) {
  border: 0;
  box-shadow: none;
}
</style>
