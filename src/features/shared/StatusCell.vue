<template>
  <span class="status" :title="title ?? undefined" :style="{'--status-color': color}">
    <IBiCircleFill class="color-icon" :style="{color}" />
    <select
      v-if="statuscodes.length"
      :id="`${rowId}-change-status`"
      class="form-select form-select-sm"
      :aria-label="$trans('Change status')"
      :value="selected"
      :disabled="isPending"
      style="border-color: transparent;"
      @change="$emit('change', $event)"
    >
      <option v-if="showUnresolvedOption && !currentCode" :value="current" disabled>{{ current }}</option>
      <option
        v-for="code in statuscodes"
        :key="code.id ?? code.statuscode"
        :value="code.statuscode"
        :disabled="isDisabledOption?.(code)"
      >
        {{ code.statuscode }}
      </option>
    </select>
    <span v-else-if="emptyText">{{ emptyText }}</span>
  </span>
</template>

<script setup lang="ts">
import type { Statuscode } from '@/api/types.gen'
/**
 * The coloured status select the invoice and order lists share: the dot in
 * the row's colour and a select of the statuscodes, under the same element
 * ids and aria the two forked cells always had (`<id>-change-status`,
 * "Change status"), so a spec selecting by either does not care which list
 * it is looking at.
 */
defineProps<{
  /** The row's id; the select's id is `<id>-change-status`. */
  rowId: number | string
  /** The row's full status text, as the select's tooltip. */
  title?: string | null
  color: string
  statuscodes: Statuscode[]
  /** What the select shows: the row's status, or the attempted one in flight. */
  selected: string
  isPending: boolean
  /** The row's status, for the unresolved fallback option. */
  current: string
  currentCode: Statuscode | null
  /** Offer the row's raw status as a disabled option when no code resolved. */
  showUnresolvedOption?: boolean
  /** Codes the picker offers but refuses. */
  isDisabledOption?: (code: Statuscode) => boolean
  /** What a list with no statuscodes at all shows instead of a select. */
  emptyText?: string
}>()

defineEmits<{change: [event: Event]}>()
</script>

<style scoped>
.status { display: flex; align-items: center; width: 80%; }
.color-icon { margin-right: 10px; }
</style>
