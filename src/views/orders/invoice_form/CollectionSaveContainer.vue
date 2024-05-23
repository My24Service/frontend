<template>
  <div class="save-collection text-right">
    <b-button
      @click="() => { buttonClicked() }"
      class="btn update-button"
      type="button"
    >
      {{ $trans("Save costs") }}
    </b-button>
  </div>
</template>

<script>
export default {
  name: "CollectionSaveContainer",
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
.save-collection {
  padding-top: 10px;
}
</style>
