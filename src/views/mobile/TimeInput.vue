<template>
  <div
  >
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
import {$trans} from '@/services/i18n'

const props = defineProps<{
  timeIn?: string
}>()

const emit = defineEmits<{
  (event: 'timeChanged', value: string): void
}>()

const time = ref<string | null>(null)

function cleanTime(time: string): string | undefined {
  if (time.indexOf(':') === -1) {
    return undefined
  }
  const p = time.split(':')
  return `${p[0]}:${p[1]}`
}

function update(event: Event) {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) {
    return
  }
  const cleaned = cleanTime(target.value)
  if (cleaned === undefined) {
    return
  }
  time.value = cleaned
  emit('timeChanged', cleaned)
}

const initial = props.timeIn === undefined ? undefined : cleanTime(props.timeIn)
time.value = initial ?? null
</script>
<style scoped>
.time-input {
  width: 100px !important;
  float:left !important;
}
</style>
