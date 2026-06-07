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
  },
  height: {
    type: String,
    default: "22rem"
  }
});
</script>

<style scoped>
.section_block {
  --head-height: 3.5rem;
  --margin-bottom: 1.5rem;

  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
  border: 1px solid #eef2f5;
  background-color: #fff;

  height: v-bind(height);
  margin-bottom: var(--margin-bottom);
  max-height: calc(100% - var(--margin-bottom));

  /* Card header - clean, transparent, center-aligned layout */
  .section_head {
    height: var(--head-height);
    display: flex;
    align-items: center;
    justify-content: flex-start; /* Left-aligned to support vertical line layout */
    padding-top: 1.25rem;
    padding-left: 1.25rem;
  }
  
  .section_content {
    height: calc(100% - var(--head-height));
    overflow-y: scroll;
    margin-bottom: 1.25rem;

    &:deep(th) {
      position: sticky;
      top: 0;
    }
  }
}
</style>