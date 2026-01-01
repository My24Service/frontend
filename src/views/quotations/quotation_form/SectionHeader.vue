<template>
  <summary class="flex-columns space-between">
    <h6>
      {{ title }}
      <IBiCheckCircle v-if="parentHasQuotationLines"></IBiCheckCircle>
    </h6>
    <span :id="sectionHeader" class="section-header"></span>
    <IBiChevronDown></IBiChevronDown>
  </summary>
</template>
<script>
export default {
  name: "SectionHeader",
  props: {
    sectionHeader: {
      type: String
    },
    parentHasQuotationLines: {
      type: Boolean
    },
    title: {
      type: String
    },
  }
}
</script>

<style scoped>
.section-header {
}
</style>
