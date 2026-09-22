<template>
  <b-container>
    <b-row>
      <BFormGroup
        :label="dateLabel"
        :label-for="dateId"
        label-cols="3"
      >
        <VueDatePicker
          :id="dateId"
          v-model="date"
          :placeholder="$trans('Select date')"
          :locale="nl"
          auto-apply
          arrow-navigation
          :time-config="{enableTimePicker: false}"
          :formats="{ input: 'dd/MM/yyyy' }"
        />
        <b-form-invalid-feedback :state="showState ? !dateError : null">
          {{ dateError }}
        </b-form-invalid-feedback>
      </BFormGroup>
      <b-col cols="2" />
      <BFormGroup
        :label="timeLabel"
        :label-for="timeId"
        label-cols="3"
      >
        <BFormInput
          :id="timeId"
          v-model="time"
          type="text"
          placeholder="HH:mm"
          class="time-input"
          :state="showState ? !timeError : null"
        />
        <VueDatePicker
          :model-value="timePickerValue(time)"
          :placeholder="$trans('Set time')"
          time-picker
          arrow-navigation
          @update:model-value="(value: TimeValue) => (time = formatTime(value))"
        >
          <template #trigger>
            <p class="clock-icon"><IBiClock /></p>
          </template>
        </VueDatePicker>
        <b-form-invalid-feedback :state="showState ? !timeError : null">
          {{ timeError }}
        </b-form-invalid-feedback>
      </BFormGroup>
    </b-row>
  </b-container>
</template>

<script lang="ts" setup>
import { VueDatePicker } from '@vuepic/vue-datepicker'
import { nl } from 'date-fns/locale'

/**
 * One planning moment on the order: a date picker beside a free-typed
 * `HH:mm` with a clock picker that fills it. The start and the end are two
 * of these.
 */
defineProps<{
  dateId: string
  dateLabel: string
  timeId: string
  timeLabel: string
  dateError?: string
  timeError?: string
  /** Whether to colour the fields by their errors yet (after the first submit). */
  showState: boolean
}>()

const date = defineModel<Date | null>('date', {required: true})
const time = defineModel<string>('time', {required: true})

type TimeValue = {hours: number; minutes: number} | null

function formatTime(value: TimeValue): string {
  if (!value) return ''
  return `${String(value.hours).padStart(2, '0')}:${String(value.minutes).padStart(2, '0')}`
}

function timePickerValue(value: string): TimeValue {
  const match = /^(\d{1,2}):(\d{2})/.exec(value)
  return match ? {hours: Number(match[1]), minutes: Number(match[2])} : null
}
</script>

<style scoped>
.time-input {
  width: 100px !important;
  float: left !important;
}
.clock-icon {
  margin: .5em auto auto;
}
</style>
