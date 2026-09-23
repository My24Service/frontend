<template>
  <BPopover
    v-model="open"
    click
    lazy
    unmount-lazy
    :delay="{show: 0, hide: 0}"
    no-hide
    placement="bottom-start"
    class="column-filter-popover"
    @shown="onShown"
    @hidden="onHidden"
  >
    <template #target>
      <div
        class="filter-chip"
        :class="{'filter-chip-empty': value === ''}"
      >
        <button
          ref="chipButton"
          type="button"
          class="filter-chip-main"
          :aria-expanded="open"
          :title="value === '' ? $trans('Set a value') : summary"
        >
          <span class="filter-chip-label">{{ label }}</span>
          <span class="filter-chip-value">{{ value === '' ? '…' : summary }}</span>
        </button>
        <button
          type="button"
          class="filter-chip-remove"
          :aria-label="`${$trans('Remove')} ${label} ${$trans('filter')}`"
          @click.stop="emit('remove')"
        >
          <IBiX />
        </button>
      </div>
    </template>

    <div
      class="filter-chip-editor"
      @keydown.esc.stop.prevent="closeByKey"
    >
      <TextFilterEditor
        v-if="spec.variant === 'text'"
        ref="editorRef"
        :column-id="columnId"
        :spec="spec"
        :model-value="value"
        @update:model-value="emit('update:value', $event)"
        @close="closeByKey"
      />
      <NumberFilterEditor
        v-else-if="spec.variant === 'number'"
        ref="editorRef"
        :column-id="columnId"
        :spec="spec"
        :model-value="value"
        @update:model-value="emit('update:value', $event)"
        @close="closeByKey"
      />
      <DateFilterEditor
        v-else-if="spec.variant === 'date'"
        ref="editorRef"
        :column-id="columnId"
        :spec="spec"
        :model-value="value"
        @update:model-value="emit('update:value', $event)"
        @close="closeByKey"
      />
      <SelectFilterEditor
        v-else
        ref="editorRef"
        :column-id="columnId"
        :spec="spec"
        :model-value="value"
        @update:model-value="emit('update:value', $event)"
        @close="closeByKey"
        @options="emit('options', $event)"
      />
    </div>
  </BPopover>
</template>

<script setup lang="ts">
import type { ColumnFilterSpec, FilterOption } from '../table'
import { describeFilterValue } from './column-filter'
import DateFilterEditor from './DateFilterEditor.vue'
import NumberFilterEditor from './NumberFilterEditor.vue'
import SelectFilterEditor from './SelectFilterEditor.vue'
import TextFilterEditor from './TextFilterEditor.vue'

/**
 * One active column filter: a chip that reads `Label: value`, opening its
 * editor in a popover below. The editor applies as it goes — the chip's
 * words follow the wire value — so closing is only ever dismissal.
 */
const props = defineProps<{
  columnId: string
  label: string
  spec: ColumnFilterSpec
  /** The wire value; `''` for a chip just added and not yet filled in. */
  value: string
  /** Select labels the chips have learned, by value — see ColumnFilterChips. */
  labels?: ReadonlyMap<string, string>
  /** Open the editor as soon as the chip appears — the chip the "+ Filter" menu just added. */
  autoOpen?: boolean
}>()

const emit = defineEmits<{
  (event: 'update:value', value: string): void
  (event: 'remove'): void
  (event: 'opened'): void
  (event: 'closed'): void
  /** The select editor listed these options: their labels are worth remembering. */
  (event: 'options', options: FilterOption[]): void
}>()

const summary = computed(() => describeFilterValue(props.spec, props.value, props.labels))

const open = ref(false)
const chipButton = useTemplateRef<HTMLButtonElement>('chipButton')
const editorRef = useTemplateRef<{focus: () => void}>('editorRef')

/** Set by Escape/Enter, so the focus goes back to the chip; a click elsewhere keeps its own focus. */
const closedByKey = ref(false)

function closeByKey() {
  closedByKey.value = true
  open.value = false
}

// Focus moves into the editor only once the popover is on screen: earlier,
// the menu that added the chip is still closing and takes the focus back.
function onShown() {
  closedByKey.value = false
  nextTick(() => editorRef.value?.focus())
}

function onHidden() {
  if (closedByKey.value) chipButton.value?.focus()
  emit('closed')
}

watch(open, (isOpen) => {
  if (isOpen) emit('opened')
})

onMounted(() => {
  if (props.autoOpen) nextTick(() => { open.value = true })
})
</script>

<style scoped>
.filter-chip {
  display: inline-flex;
  align-items: stretch;
  height: 2rem;
  border: 1px solid color-mix(in srgb, var(--bs-primary) 35%, var(--shltr-slate-200, #e2e8f0));
  border-radius: 9999px;
  background: white;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.04);
  font-size: 0.8125rem;
  line-height: 1;
  overflow: hidden;
  transition: all 0.15s ease;
}

.filter-chip:hover {
  border-color: color-mix(in srgb, var(--bs-primary) 65%, var(--shltr-slate-300, #cbd5e1));
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.08);
}

.filter-chip-empty {
  border-color: var(--shltr-slate-300, #cbd5e1);
  border-style: dashed;
  background: white;
  box-shadow: none;
}

.filter-chip-main,
.filter-chip-remove {
  border: 0;
  background: transparent;
  color: var(--shltr-slate-700, #334155);
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-chip-main {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0 0.5rem 0 0.75rem;
}

.filter-chip-main:hover {
  background: var(--shltr-slate-50, #f8fafc);
}

.filter-chip-main:focus-visible,
.filter-chip-remove:focus-visible {
  outline: 2px solid var(--bs-primary);
  outline-offset: -2px;
}

.filter-chip-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--shltr-slate-500, #64748b);
}

.filter-chip-label::after {
  content: ':';
}

.filter-chip-value {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--shltr-slate-900, #0f172a);
  max-width: 18rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-chip-empty .filter-chip-value {
  font-weight: 400;
  color: var(--shltr-slate-400, #94a3b8);
}

.filter-chip-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.5rem;
  border-left: 1px solid var(--shltr-slate-200, #e2e8f0);
  color: var(--shltr-slate-400, #94a3b8);
}

.filter-chip-empty .filter-chip-remove {
  border-left-color: var(--shltr-slate-200, #e2e8f0);
}

.filter-chip-remove:hover {
  color: #e11d48;
  background: #fff1f2;
}
</style>

<style>
/* The popover is rendered by BPopover, outside this component's scope; the
   `.popover` qualifier outweighs Bootstrap's own max-width on that class. */
.popover.column-filter-popover {
  --bs-popover-max-width: 32rem;
  --bs-popover-body-padding-x: 0.75rem;
  --bs-popover-body-padding-y: 0.75rem;
  border: 1px solid var(--shltr-slate-200, #e2e8f0);
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.03);
  z-index: 1030;
}
</style>
