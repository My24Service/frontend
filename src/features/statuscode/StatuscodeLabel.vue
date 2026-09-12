<template>
  <small
    class="statuscode-preview"
    :style="`--bg-color: ${color ?? ''}; --text-color: ${textColor || 'black'}`"
  >
    {{ text }}
  </small>
</template>

<script lang="ts" setup>
/**
 * A statuscode as the dispatch screens draw it: its text on its own
 * background and text colour. The list's preview column and the form's live
 * preview are the same element, so it is one component.
 */
defineProps<{
  text: string
  color?: string | null
  textColor?: string | null
}>()
</script>
