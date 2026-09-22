<template>
  <div ref="root" class="filter-editor filter-editor-text">
    <BFormInput
      :model-value="modelValue"
      size="sm"
      type="search"
      autocomplete="off"
      :aria-label="`Filter ${columnId}`"
      :placeholder="placeholder"
      @update:model-value="emit('update:modelValue', String($event ?? ''))"
      @keydown.enter.prevent="emit('close')"
    />
    <div class="form-text">{{ $trans('Matches anywhere in the text') }}</div>
  </div>
</template>

<script setup lang="ts">
import type { ColumnFilterSpec } from '../table'
import { focusFirstControl } from './focus-first-control'

/** A substring filter: one box, applied as it is typed. */
const props = defineProps<{
  columnId: string
  spec: Extract<ColumnFilterSpec, {variant: 'text'}>
  /** The wire value. */
  modelValue: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
  (event: 'close'): void
}>()

const root = useTemplateRef<HTMLElement>('root')
const placeholder = computed(() => props.spec.placeholder ?? $trans('Type to filter'))

defineExpose({
  /** Called by the chip once its popover is on screen. */
  focus: () => focusFirstControl(root.value),
})
</script>

<style scoped>
.filter-editor-text {
  min-width: 16rem;
}
</style>
