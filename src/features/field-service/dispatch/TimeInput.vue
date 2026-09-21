<template>
  <div>
    <BFormInput
      v-model="time"
      type="text"
      placeholder="HH:mm"
      class="time-input"
      @input="update"
    ></BFormInput>
    <VueDatePicker
      v-model="time"
      :placeholder="$trans('Set time')"
      time-picker
      arrow-navigation
      :formats="{ input: 'HH:mm' }"
    >
      <template #trigger>
        <p class="clock-icon">
          <IBiClock></IBiClock>
        </p>
      </template>
    </VueDatePicker>
  </div>
</template>

<script setup lang="ts">
import { $trans } from '@/services/i18n'
import { truncateTime } from '@/features/forms'

/**
 * A time of day, typed or picked.
 *
 * The input is a free-text field and the picker writes the same model, so the
 * only rule this component owns is the one that keeps a half-typed value from
 * clearing the field: nothing is handed to the parent until the text contains
 * a colon, and only the hour and minute survive.
 */
const props = defineProps<{
  timeIn?: string
}>()

const emit = defineEmits<{
  (event: 'timeChanged', value: string): void
}>()

const time = ref<string | null>(null)

function update(event: Event) {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) {
    return
  }

  const cleaned = truncateTime(target.value)
  if (cleaned === undefined) {
    return
  }

  time.value = cleaned
  emit('timeChanged', cleaned)
}

const initial = props.timeIn === undefined ? undefined : truncateTime(props.timeIn)
time.value = initial ?? null
</script>

<style scoped>
.time-input {
  width: 100px !important;
  float:left !important;
}
</style>
