<template>
  <div ref="root" class="filter-editor filter-editor-number">
    <BFormRadioGroup
      v-model="mode"
      :options="modes"
      :name="`${columnId}-number-mode`"
      :aria-label="$trans('Kind of number filter')"
      buttons
      button-variant="outline-secondary"
      size="sm"
      class="filter-mode w-100"
    />

    <div v-if="mode === 'between'" class="filter-number-range">
      <BFormInput
        v-model="low"
        type="number"
        size="sm"
        inputmode="decimal"
        :aria-label="`Filter ${columnId} from`"
        :placeholder="$trans('from')"
        @keydown.enter.prevent="emit('close')"
      />
      <span class="filter-number-dash" aria-hidden="true">–</span>
      <BFormInput
        v-model="high"
        type="number"
        size="sm"
        inputmode="decimal"
        :aria-label="`Filter ${columnId} to`"
        :placeholder="$trans('to')"
        @keydown.enter.prevent="emit('close')"
      />
    </div>
    <BFormInput
      v-else
      v-model="single"
      type="number"
      size="sm"
      inputmode="decimal"
      :aria-label="`Filter ${columnId}`"
      :placeholder="singlePlaceholder"
      @keydown.enter.prevent="emit('close')"
    />

    <BFormCheckbox
      v-if="mode === 'between'"
      v-model="exclusive"
      switch
      class="filter-number-exclusive"
    >
      {{ $trans('Exclude the endpoints') }}
    </BFormCheckbox>
    <div v-else class="form-text">{{ hint }}</div>
  </div>
</template>

<script setup lang="ts">
import type { ColumnFilterSpec } from '../table'
import { formatNumberFilter, parseNumberFilter, type NumberFilterValue } from './filter-grammar'

/**
 * A number filter: an exact value, a one-sided bound, or a range — the four
 * ways `apps/core/filters.NumberFilter` reads `25`, `18...`, `...80` and
 * `18...80` (`18..80` with the endpoints excluded).
 */
const props = defineProps<{
  columnId: string
  spec: Extract<ColumnFilterSpec, {variant: 'number'}>
  /** The wire value. */
  modelValue: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
  (event: 'close'): void
}>()

type Mode = 'exact' | 'min' | 'max' | 'between'

const modes = [
  {value: 'exact', text: $trans('Exactly')},
  {value: 'min', text: $trans('At least')},
  {value: 'max', text: $trans('At most')},
  {value: 'between', text: $trans('Between')},
]

const root = useTemplateRef<HTMLElement>('root')

const mode = ref<Mode>('exact')
/** The one box of the exact, at-least and at-most modes. */
const single = ref('')
const low = ref('')
const high = ref('')
const exclusive = ref(false)

/** The editor's state for a wire value; an unparsable one starts blank. */
function read(raw: string) {
  const parsed = parseNumberFilter(raw)
  if (!parsed) {
    mode.value = 'exact'
    single.value = ''
    low.value = ''
    high.value = ''
    exclusive.value = false
    return
  }
  if (parsed.kind === 'exact') {
    mode.value = 'exact'
    single.value = parsed.value
    return
  }
  const {low: lowBound, high: highBound, inclusive} = parsed
  if (inclusive && lowBound !== null && highBound === null) {
    mode.value = 'min'
    single.value = lowBound
    return
  }
  if (inclusive && highBound !== null && lowBound === null) {
    mode.value = 'max'
    single.value = highBound
    return
  }
  mode.value = 'between'
  low.value = lowBound ?? ''
  high.value = highBound ?? ''
  exclusive.value = !inclusive
}

/** The wire value for the editor's state; `''` when nothing is filled in. */
function write(): string {
  const value = single.value.trim()
  let filter: NumberFilterValue
  switch (mode.value) {
    case 'exact':
      if (value === '') return ''
      filter = {kind: 'exact', value}
      break
    case 'min':
      if (value === '') return ''
      filter = {kind: 'range', low: value, high: null, inclusive: true}
      break
    case 'max':
      if (value === '') return ''
      filter = {kind: 'range', low: null, high: value, inclusive: true}
      break
    default:
      filter = {
        kind: 'range',
        low: low.value.trim() || null,
        high: high.value.trim() || null,
        inclusive: !exclusive.value,
      }
  }
  return formatNumberFilter(filter)
}

read(props.modelValue)

// Switching modes carries the number along: an exact 25 becomes "at least
// 25", and a one-sided bound becomes the matching end of a range.
watch(mode, (next, previous) => {
  if (next === 'between') {
    if (previous === 'min') low.value = single.value
    if (previous === 'max') high.value = single.value
    if (previous === 'exact') low.value = single.value
  } else if (previous === 'between') {
    single.value = next === 'max' ? high.value : low.value
  }
})

watch([mode, single, low, high, exclusive], () => {
  const next = write()
  if (next !== props.modelValue) emit('update:modelValue', next)
})

const singlePlaceholder = computed(() => (
  mode.value === 'exact' ? $trans('e.g. 25') : mode.value === 'min' ? $trans('minimum') : $trans('maximum')
))

const hint = computed(() => (
  mode.value === 'exact'
    ? $trans('Only rows with this number')
    : mode.value === 'min'
      ? $trans('This number and above')
      : $trans('This number and below')
))

defineExpose({
  /** Called by the chip once its popover is on screen: the number box, not the mode buttons before it. */
  focus: () => root.value?.querySelector<HTMLElement>('input[type="number"]')?.focus(),
})
</script>

<style scoped>
.filter-editor-number {
  min-width: 20rem;
}

.filter-mode {
  margin-bottom: 0.5rem;
}

.filter-number-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-number-dash {
  color: var(--bs-secondary-color);
}

.filter-number-exclusive {
  margin-top: 0.5rem;
}
</style>
