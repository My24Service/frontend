<template>
  <svg :class="['bi', customClass]" :width="size"
    :height="size"  fill="currentColor">
    <use :xlink:href="`${iconPath}#${name}`" />
  </svg>
</template>
<script setup>
import iconPath from 'bootstrap-icons/bootstrap-icons.svg';

defineProps({
  name: {
    type: String,
    required: true // e.g., 'speedometer', 'gear', 'check-circle'
  },
  size: {
    type: [String, Number],
    default: 16
  },
  customClass: {
    type: String,
    default: ''
  }
});
</script>
<style scoped>
svg {
  width: 18px;
  height: 18px;
  display: inline-block;
  vertical-align: -0.125em;
}
</style>
