<template>
  <BFormSelect
    @change="update"
    :value="defaultVat"
    v-model="vatType"
    :options="vatTypes"
    size="sm"
  ></BFormSelect>
</template>

<script>
import {useMainStore} from "@/stores/main";

export default {
  setup() {
    const mainStore = useMainStore()

    // expose to template and other options API hooks
    return {
      mainStore
    }
  },
  name: "VAT",
  emits: ['vatChanged'],
  data() {
    return {
      vatType: null,
      vatTypes: this.mainStore.getVATTypes,
      defaultVat: this.mainStore.getInvoiceDefaultVat,
    }
  },
  created() {
    this.vatType = this.defaultVat
  },
  methods: {
    update() {
      this.$emit('vatChanged', this.vatType)
    }
  }
}
</script>

<style scoped>

</style>
