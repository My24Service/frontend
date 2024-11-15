<template>
  <summary class="flex-columns space-between">
    <h6>
      {{ title }}
      <b-icon-check-circle v-if="parentHasQuotationLines"></b-icon-check-circle>
    </h6>
    <span :id="sectionHeader(section)" class="section-header"></span>
    <b-icon-chevron-down></b-icon-chevron-down>
  </summary>
</template>
<script>
import quotationMixin from "@/views/quotations/quotation_form/mixin";

export default {
  name: "SectionHeader",
  mixins: [quotationMixin],
  props: {
    section: {
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
