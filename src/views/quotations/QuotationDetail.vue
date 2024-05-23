<template>
  <QuotationForm
    :pk="pk"
    :is-view="true"
  />
</template>
<script>
import QuotationForm from "@/views/quotations/QuotationForm.vue";

export default {
  name: "QuotationDetail",
  components: {
    QuotationForm
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    }
  }
}
</script>
<style scoped>

</style>
