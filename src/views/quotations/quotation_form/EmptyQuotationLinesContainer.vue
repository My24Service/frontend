<template>
  <div class="component-container">
    <h5><i>{{ $trans("Remove quotation lines to change items") }}</i></h5>

    <BButton
        @click="() => { buttonClicked() }"
        variant="danger"
        type="button"
        size="sm"
      >
        {{ $trans("Remove quotation lines") }}
      </BButton>
  </div>
</template>

<script>
export default {
  name: "EmptyQuotationLinesContainer",
  emits: [
    'buttonClicked',
  ],
  methods: {
    buttonClicked() {
      this.$emit('buttonClicked')
    }
  }
}
</script>

<style scoped>
.component-container {
  padding-top: 8px;
  padding-bottom: 8px;
}

</style>
