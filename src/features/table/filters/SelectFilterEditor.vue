<template>
  <div ref="root" class="filter-editor filter-editor-select">
    <BFormInput
      v-if="searchable"
      v-model="term"
      size="sm"
      type="search"
      autocomplete="off"
      :aria-label="`Filter ${columnId}`"
      :placeholder="placeholder"
      role="combobox"
      :aria-expanded="true"
      :aria-controls="listId"
      :aria-activedescendant="highlighted >= 0 ? optionId(highlighted) : undefined"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter.prevent="pickHighlighted"
    />

    <ul
      :id="listId"
      class="filter-select-options"
      role="listbox"
      :aria-label="`Filter ${columnId} ${$trans('options')}`"
      aria-multiselectable="true"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
    >
      <li
        v-for="(option, index) in visible"
        :key="option.value"
      >
        <button
          :id="optionId(index)"
          type="button"
          role="option"
          :aria-selected="isSelected(option.value)"
          class="filter-select-option"
          :class="{highlighted: index === highlighted, selected: isSelected(option.value)}"
          :tabindex="searchable ? -1 : 0"
          @mousemove="highlighted = index"
          @click="pick(option)"
        >
          <span class="filter-select-check" aria-hidden="true">
            <IBiCheck2 v-if="isSelected(option.value)" />
          </span>
          <span class="filter-select-label">{{ option.label }}</span>
        </button>
      </li>
    </ul>

    <div v-if="loading" class="form-text"><BSpinner small /> {{ $trans('Searching...') }}</div>
    <div v-else-if="visible.length === 0" class="form-text">{{ emptyText }}</div>
    <div v-else class="form-text">{{ $trans('Pick as many as apply') }}</div>
  </div>
</template>

<script setup lang="ts">
import type { ColumnFilterSpec, FilterOption } from '../table'
import { joinArrayItems, splitArrayItems } from './filter-grammar'
import { focusFirstControl } from './focus-first-control'

/**
 * Any of several picks from a list: the column's own options, or — when
 * there are too many to list — whatever `loadOptions` finds for the typed
 * term. Each pick toggles and applies at once; the picks ride the wire
 * comma-joined, the way `apps/core/filters.ArrayFilter` reads them, and
 * the editor stays open until dismissed.
 */
const props = defineProps<{
  columnId: string
  spec: Extract<ColumnFilterSpec, {variant: 'select'}>
  /** The wire value. */
  modelValue: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
  (event: 'close'): void
  /** The options just listed — the chip needs their labels once a pick outlives this editor. */
  (event: 'options', options: FilterOption[]): void
}>()

/** Fewer options than this need no search box. */
const SEARCH_THRESHOLD = 8

const root = useTemplateRef<HTMLElement>('root')
const listId = useId()
const term = ref('')
const highlighted = ref(-1)
const loaded = ref<FilterOption[]>([])
const loading = ref(false)

const isAsync = computed(() => typeof props.spec.loadOptions === 'function')
const searchable = computed(() => isAsync.value || (props.spec.options?.length ?? 0) > SEARCH_THRESHOLD)
const placeholder = computed(() => props.spec.placeholder ?? (isAsync.value ? $trans('Type to search') : $trans('Type to narrow the list')))

const selected = computed<string[]>(() => splitArrayItems(props.modelValue))

function isSelected(value: string): boolean {
  return selected.value.includes(value)
}

const visible = computed<FilterOption[]>(() => {
  if (isAsync.value) return loaded.value
  const options = props.spec.options ?? []
  const needle = term.value.trim().toLowerCase()
  return needle === '' ? options : options.filter((option) => option.label.toLowerCase().includes(needle))
})

const emptyText = computed(() => (
  isAsync.value && term.value.trim() === '' ? $trans('Type to search') : $trans('No matches')
))

function optionId(index: number): string {
  return `${listId}-option-${index}`
}

/**
 * Arrow through the list. With a search box the focus stays in it and the
 * highlight moves (a combobox); without one the option buttons themselves
 * take the focus.
 */
function move(step: number) {
  const count = visible.value.length
  if (count === 0) return
  highlighted.value = (highlighted.value + step + count) % count
  void nextTick(() => {
    const option = root.value?.querySelector<HTMLElement>(`#${CSS.escape(optionId(highlighted.value))}`)
    if (searchable.value) option?.scrollIntoView?.({block: 'nearest'})
    else option?.focus()
  })
}

function pickHighlighted() {
  const option = visible.value[highlighted.value]
  if (option) pick(option)
}

function pick(option: FilterOption) {
  const next = isSelected(option.value)
    ? selected.value.filter((value) => value !== option.value)
    : [...selected.value, option.value]
  emit('update:modelValue', joinArrayItems(next))
}

let request = 0

async function load(search: string) {
  const load = props.spec.loadOptions
  if (!load) return
  const id = ++request
  loading.value = true
  try {
    const options = await load(search)
    // A slower earlier search must not overwrite a newer one's result.
    if (id === request) {
      loaded.value = options
      emit('options', options)
    }
  } catch (error) {
    // Fired from a debounced watcher, so nothing upstream catches this: a
    // failed search lists nothing rather than the previous term's matches.
    console.error('error loading filter options', error)
    if (id === request) loaded.value = []
  } finally {
    if (id === request) loading.value = false
  }
}

watchDebounced(term, (value) => {
  highlighted.value = -1
  if (isAsync.value) void load(value)
}, {debounce: 250})

onMounted(() => {
  if (isAsync.value) void load('')
})

defineExpose({
  /** Called by the chip once its popover is on screen: the search box, else the first option. */
  focus: () => focusFirstControl(root.value),
})
</script>

<style scoped>
.filter-editor-select {
  min-width: 16rem;
}

.filter-select-options {
  list-style: none;
  margin: 0.5rem 0 0;
  padding: 0;
  max-height: 16rem;
  overflow-y: auto;
}

.filter-select-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.3rem 0.5rem;
  border: 0;
  border-radius: var(--bs-border-radius-sm);
  background: transparent;
  color: var(--bs-body-color);
  text-align: left;
  cursor: pointer;
}

.filter-select-option.highlighted,
.filter-select-option:focus-visible {
  background: var(--bs-tertiary-bg);
  outline: none;
}

.filter-select-option.selected {
  font-weight: 600;
}

.filter-select-check {
  display: inline-flex;
  width: 1em;
  justify-content: center;
  color: var(--bs-primary);
}

.filter-select-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
