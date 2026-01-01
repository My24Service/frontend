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
export default {
  name: "VAT",
  emits: ['vatChanged'],
  data() {
    return {
      vatType: null,
      vatTypes: this.$store.getters.getVATTypes,
      defaultVat: this.$store.getters.getInvoiceDefaultVat,
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
select {
  width: 8ch;
}
</style>
