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

<style scoped>
h5 {
  font-size: 1.1rem;
  font-weight: 600;
  text-align: left;
  padding-left: 0.5rem;
  border-left: 3px solid #179da0;
  line-height: 1.2;
}

.d-flex {
  justify-content: flex-start;
  width: 100%;
  color: #1b4f72;
}
</style>