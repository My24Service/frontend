<template>
  <b-container fluid>
    <b-row role="group">
      <b-col size="6">
        <BFormGroup
          v-bind:label="$trans('Start date')"
          :label-for="`${idPrefix}-start-date`"
        >
          <VueDatePicker
            :id="`${idPrefix}-start-date`"
            size="sm"
            class="p-sm-0"
            v-model="altStartDate"
            :placeholder="$trans('Choose a date')"
            :locale="nl"
            auto-apply
            arrow-navigation
            :formats="{ input: 'dd/MM/yyyy' }"
          ></VueDatePicker>
        </BFormGroup>
      </b-col>
      <b-col size="6">
        <BFormGroup
          v-bind:label="$trans('Start time')"
          :label-for="`${idPrefix}-start-time`"
        >
          <TimeInput
            :id="`${idPrefix}-start-time`"
            :time-in="modelValue.start_time ?? undefined"
            @time-changed="(val) => update('alt_start_time', val)"
          />
        </BFormGroup>
      </b-col>
    </b-row>
    <b-row>
      <b-col size="6">
        <BFormGroup
          v-bind:label="$trans('End date')"
          :label-for="`${idPrefix}-end-date`"
        >
          <VueDatePicker
            :id="`${idPrefix}-end-date`"
            size="sm"
            class="p-sm-0"
            v-model="altEndDate"
            :placeholder="$trans('Choose a date')"
            :locale="nl"
            auto-apply
            arrow-navigation
            :min="minDate"
            :max="maxDate"
            :formats="{ input: 'dd/MM/yyyy' }"
          ></VueDatePicker>
        </BFormGroup>
      </b-col>
      <b-col size="6">
        <BFormGroup
          v-bind:label="$trans('End time')"
          :label-for="`${idPrefix}-end-time`"
        >
          <TimeInput
            :id="`${idPrefix}-end-time`"
            :time-in="modelValue.end_time ?? undefined"
            @time-changed="(val) => update('alt_end_time', val)"
          />
        </BFormGroup>
      </b-col>
    </b-row>
    <b-row>
      <b-col size="6"></b-col>
      <b-col size="6" class="text-right">
        <BLink class="px-1" :title="$trans('clear')" v-on:click="emit('clear')">
          {{ $trans('clear') }}
        </BLink>
      </b-col>
    </b-row>
  </b-container>
</template>

<script setup lang="ts">
import { nl } from 'date-fns/locale'

import { $trans } from '@/services/i18n'

import TimeInput from './TimeInput.vue'

/**
 * The dates being edited, for the change-date and split modals.
 *
 * `start_time`/`end_time` are the assignment's own times, which the two time
 * fields are seeded from; `alt_*` are the four values the request carries, and
 * they are the only four the endpoint's serializer declares.
 */
export interface AssignedOrderDates {
  order?: number
  alt_start_date: Date | string | null
  alt_start_time: string | null
  alt_end_date: Date | string | null
  alt_end_time: string | null
  start_time: string | null
  end_time: string | null
}

defineOptions({name: 'AssignedOrderDatesForm'})

const props = withDefaults(defineProps<{
  /** The dates the modal edits; the parent seeds and submits it. */
  modelValue: AssignedOrderDates
  /** Prefix for the picker ids, so the two modals keep unique label targets. */
  idPrefix: string
  /** The split modal's window; null lifts the constraint. */
  minDate?: Date | null
  maxDate?: Date | null
}>(), {
  minDate: null,
  maxDate: null,
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: AssignedOrderDates): void
  (event: 'clear'): void
}>()

function update<Key extends keyof AssignedOrderDates>(key: Key, value: AssignedOrderDates[Key]) {
  emit('update:modelValue', {...props.modelValue, [key]: value})
}

const altStartDate = computed({
  get: () => props.modelValue.alt_start_date,
  set: (value) => update('alt_start_date', value),
})

const altEndDate = computed({
  get: () => props.modelValue.alt_end_date,
  set: (value) => update('alt_end_date', value),
})
</script>
