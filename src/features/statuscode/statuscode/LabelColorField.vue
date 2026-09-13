<template>
  <div class="label-palette" role="group" :aria-label="$trans('Label color')">
    <div v-for="row in rows" :key="row.name" class="label-palette-row">
      <button
        v-for="hex in row.colors"
        :key="hex"
        type="button"
        class="label-palette-swatch"
        :class="{selected: isSelected(hex)}"
        :style="swatchStyle(hex)"
        :aria-label="hex"
        :aria-pressed="isSelected(hex)"
        @click="model = hex"
      >
        <IBiCheck v-if="isSelected(hex)" />
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, type CSSProperties } from 'vue'

import { $trans } from '@/services/i18n'

import { LABEL_PALETTE, isPaletteColor, labelTextColor } from './palette'

/**
 * The palette as a picker: a row each of light, mid and dark swatches, and — for
 * a record coloured before the palette existed — its own colour as a third
 * row, selected, until the user picks one of the others.
 */
const model = defineModel<string | null | undefined>()

const legacy = computed(() => {
  const value = model.value
  return value && !isPaletteColor(value) ? value.toLowerCase() : null
})

const rows = computed(() => [
  {name: 'light', colors: LABEL_PALETTE.light},
  {name: 'mid', colors: LABEL_PALETTE.mid},
  {name: 'dark', colors: LABEL_PALETTE.dark},
  ...(legacy.value ? [{name: 'current', colors: [legacy.value]}] : []),
])

/** The two custom properties the swatch's CSS reads; Vue's style type has no slot for them. */
function swatchStyle(hex: string): CSSProperties {
  return {'--swatch-color': hex, '--swatch-text': labelTextColor(hex)} as CSSProperties
}

function isSelected(hex: string): boolean {
  return (model.value ?? '').toLowerCase() === hex
}
</script>

<style scoped>
.label-palette-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}
.label-palette-swatch {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 6px;
  background: var(--swatch-color);
  color: var(--swatch-text);
  cursor: pointer;
}
.label-palette-swatch:hover,
.label-palette-swatch:focus-visible {
  border-color: var(--swatch-text);
  outline: none;
}
.label-palette-swatch.selected {
  border-color: var(--swatch-text);
  box-shadow: 0 0 0 2px var(--swatch-color);
}
</style>
