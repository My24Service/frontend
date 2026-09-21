<template>
  <small
    class="statuscode-preview"
    :style="`--bg-color: ${color ?? ''}; --text-color: ${textColor || labelTextColor(color) || 'black'}`"
  >
    {{ text }}
  </small>
</template>

<script lang="ts" setup>
import { labelTextColor } from '@/features/statuscode/statuscode'

/**
 * A statuscode as the dispatch screens draw it: its text on its own
 * background and text colour. The list's preview column and the form's live
 * preview are the same element, so it is one component. A record carries
 * its text colour; without one, the text colour is derived from the
 * background the way the form derives it.
 */
defineProps<{
  text: string
  color?: string | null
  textColor?: string | null
}>()
</script>
