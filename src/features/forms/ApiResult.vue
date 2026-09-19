<template>
  <div>
    <BAlert v-if="error" variant="danger" :model-value="true" role="alert">
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
    </BAlert>
    <BAlert v-else variant="success" :model-value="true">
      {{ successMessage }}
    </BAlert>
  </div>
</template>
<script setup lang="ts">
import { $trans } from '@/services/i18n'

/** The little of an axios failure this reports on. */
interface ApiError {
  response?: {
    status?: number
    data?: Record<string, string[]>
  }
}

const props = withDefaults(defineProps<{
  successMessage?: string
  error?: ApiError | null
}>(), {
  error: null,
})

const isValidationError = computed(() => props.error?.response?.status === 400)
const isInternalServerError = computed(() => props.error?.response?.status === 500)
const validationErrors = computed<Record<string, string[]>>(() =>
  isValidationError.value ? props.error?.response?.data ?? {} : {})
</script>
<style scoped>

</style>
