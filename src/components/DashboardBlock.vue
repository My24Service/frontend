<template>
  <div :class="['section_block', customClass]">
    <div class="section_head">
      <DashboardBlockIconTitle :iconName="iconName" :title="title" />
    </div>
    <div class="section_content">
      <slot/>
    </div>
  </div>
</template>

<script setup>
import DashboardBlockIconTitle from "./DashboardBlockIconTitle.vue";

defineProps({
  title: {
    type: String,
    required: true,
  },
  customClass: {
    type: String,
  },
  iconName: {
    type: String,
    required: false,
  }
});
</script>
