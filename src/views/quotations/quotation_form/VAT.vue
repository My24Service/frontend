<template>
  <b-form-select
    @change="update"
    :value="defaultVat"
    v-model="vatType"
    :options="vatTypes"
    size="sm"
  ></b-form-select>
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

</style>
