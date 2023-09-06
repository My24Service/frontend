<template>

</template>

<script>
export default {
  name: "CostTypeTable",
  props: {
    costs: {
      type: [Array],
      default: null
    },
  },
  data() {
    return {
      fieldsHour: [
        {key: 'user_full_name', label: this.$trans('User')},
        {key: 'description', label: this.$trans('Description')},
        {key: 'file', label: this.$trans('File')},
        {key: 'icons', value: this.orderPk},
      ]
    }
  }
}
</script>

<style scoped>

</style>
