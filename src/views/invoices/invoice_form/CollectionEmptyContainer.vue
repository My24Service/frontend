<template>
  <div class="save-collection text-right">
      <BButton
        @click="() => { buttonClicked() }"
        class="btn update-button"
        type="button"
        size="sm"
      >
        {{ $trans("Remove saved costs") }}
      </BButton>
  </div>
</template>

<script>
export default {
  name: "CollectionEmptyContainer",
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
