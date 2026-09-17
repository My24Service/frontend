<template>
  <div class="save-collection text-right">
    <BButton
      @click="() => { buttonClicked() }"
      class="btn update-button"
      type="button"
    >
      {{ $trans("Save costs") }}
    </BButton>
  </div>
</template>

<script setup lang="ts">
import { $trans } from '@/services/i18n'

const emit = defineEmits<{ buttonClicked: [] }>()
function buttonClicked() {
  emit('buttonClicked')
}
</script>

<style scoped>
.save-collection {
  padding-top: 10px;
}
</style>
