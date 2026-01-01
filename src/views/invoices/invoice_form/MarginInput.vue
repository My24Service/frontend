<template>
  <p class="flex">
    <BFormInput
      @blur="inputChanged"
      v-model="margin_perc"
      size="sm"
      class="input-margin"
    ></BFormInput>
    <span class="percentage-container">%</span>
  </p>
</template>

<script>
export default {
  name: "MarginInput",
  emits: [
    'inputChanged',
  ],
  props: {
    margin: {
      type: [Number, String],
      default: null
    },
  },
  created() {
    this.margin_perc = this.margin
  },
  data() {
    return {
      margin_perc: null,
    }
  },
  methods: {
    inputChanged() {
      this.$emit('inputChanged', this.margin_perc)
    },
  }
}
</script>

<style scoped>
.flex {
  display : flex;
  margin-top: auto;
}
.input-margin {
  width: 40px;
  padding: 1px;
  margin: 1px;
  text-align: center;
}
.percentage-container {
  padding-top: 4px;
  padding-left: 4px;
}
</style>
