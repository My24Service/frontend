<template>
  <div>
    <div v-if="error" class="alert alert-danger" role="alert">
      <div v-if="isValidationError">
        <h4>{{ $trans("Validation error") }}</h4>
        <ul>
          <li v-for="(messages, field) of validationErrors" :key="field">
            {{ field }}: {{ messages.join(", ") }}
          </li>
        </ul>
      </div>
      <div v-if="isInternalServerError">
        <h4>{{ $trans("Internal server error") }}</h4>
        {{ $trans("Admins have been notified") }}
      </div>
    </div>
    <div v-else class="alert alert-success">
      {{ successMessage }}
    </div>
  </div>
</template>
<script>

export default {
  name: "ApiResult",
  props: {
    successMessage: {
      type: String,
    },
    error: {
      type: Object,
      default: null
    }
  },
  computed: {
    isValidationError: function() {
      return this.error && this.error.response.status === 400
    },
    isInternalServerError: function() {
      return this.error && this.error.response.status === 500
    },
    validationErrors: function() {
      return this.isValidationError ? this.error.response.data : []
    }
  }
}
</script>
<style scoped>

</style>
