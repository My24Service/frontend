<template>
  <div class="save-collection">
    <b-container>
      <b-row>
        <b-col cols="8"></b-col>
        <b-col cols="4">
          <div class="float-right">
            <b-button
              @click="() => { buttonClicked() }"
              class="btn btn-danger update-button"
              type="button"
              variant="danger"
            >
              {{ $trans("Save costs") }}
            </b-button><br/>
          </div>
        </b-col>
      </b-row>
    </b-container>
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
