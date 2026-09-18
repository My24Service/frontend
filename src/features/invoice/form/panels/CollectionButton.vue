<template>
  <div class="save-collection text-right">
    <BButton
      @click="$emit('buttonClicked')"
      class="btn update-button"
      type="button"
      :size="mode === 'remove' ? 'sm' : undefined"
    >
      {{ mode === 'remove' ? $trans("Remove saved costs") : $trans("Save costs") }}
    </BButton>
  </div>
</template>

<script setup lang="ts">
import { $trans } from '@/services/i18n'

/**
 * The one button a cost collection shows: saving the drafts, or removing
 * the stored rows. Two containers a line apart did this with the same
 * markup, differing only in label and size.
 */
defineProps<{
  mode: 'save' | 'remove'
}>()

defineEmits<{
  buttonClicked: []
}>()
</script>

<style scoped>
.save-collection {
  padding-top: 10px;
}
</style>
