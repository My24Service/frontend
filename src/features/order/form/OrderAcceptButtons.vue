<template>
  <template v-if="canAccept">
    <BButton
      type="button"
      variant="danger"
      :disabled="buttonDisabled"
      @click="$emit('reject')"
    >{{ $trans('Reject') }}</BButton>
    <BButton
      name="order-done-next"
      type="button"
      variant="primary"
      :disabled="buttonDisabled"
      @click="$emit('accept')"
    >{{ $trans('Save &amp; accept') }}</BButton>
  </template>
</template>

<script setup lang="ts">
/**
 * The Reject / Save & accept pair both order forms show for a
 * customer-placed order awaiting confirmation. Whether it shows is the
 * caller's read (the guards differ per form); what the buttons say and
 * emit is identical.
 */
defineProps<{
  canAccept: boolean
  buttonDisabled: boolean
}>()

defineEmits<{
  reject: []
  accept: []
}>()
</script>
