<template>
  <div class="d-flex align-items-center">
    <DashboardBlockIcon
      v-if="iconName"
      :name="iconName"
      :size="iconSize"
      customClass="me-2"
    />
    <h5 class="m-0"><span>{{ title }}</span></h5>
    <slot/>
  </div>
</template>

<script setup>
import DashboardBlockIcon from "./DashboardBlockIcon.vue";

defineProps({
  iconName: {
    type: String,
    required: true
  },
  iconSize: {
    type: Number,
    default: 20,
    required: false,
  },
  title: {
    type: String,
    required: true
  }
});
</script>
