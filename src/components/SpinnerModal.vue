<template>
  <div>
    <b-modal
      id="spinner-modal"
      ref="spinner-modal"
      v-bind:title="$trans('Preparing download file')"
      :cancel-disabled="true"
      :ok-disabled="true"
    >
      <p>
        <square></square>
      </p>
    </b-modal>
  </div>
</template>

<script>
export default {
  data() {
    return {
    }
  },
  methods: {
    show() {
      this.$refs['spinner-modal'].show()
    },
    hide() {
      this.$refs['spinner-modal'].hide()
    }
  },
}
</script>

<style scoped>
</style>
