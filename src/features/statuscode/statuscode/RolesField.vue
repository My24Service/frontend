<template>
  <BFormGroup
    label-cols="3"
    :label="$trans('Roles')"
    :description="$trans('The settings this status is used for.')"
  >
    <BFormCheckboxGroup
      :model-value="modelValue"
      @update:model-value="emit('update:modelValue', $event as string[])"
      class="statuscode-roles"
      stacked
    >
      <BFormCheckbox
        v-for="key in roleKeys"
        :key="key"
        :id="`statuscode_role_${key}`"
        :value="key"
      >
        {{ roleLabel(key) }}
      </BFormCheckbox>
    </BFormCheckboxGroup>
    <span v-if="rolesQuery.isLoading.value" class="dimmed">{{ $trans('Loading') }}</span>
    <b-form-invalid-feedback :state="error ? false : null">
      {{ error }}
    </b-form-invalid-feedback>
  </BFormGroup>
</template>

<script lang="ts" setup>
import { statuscodeStatuscodeRolesRetrieveOptions } from '@/api/@tanstack/vue-query.gen'
import { $trans } from '@/services/i18n'

import type { CodeType } from '../code-types'
import { roleLabel } from './roles'

const props = defineProps<{
  codeType: CodeType
  modelValue: string[]
  error?: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const rolesQuery = useQuery(() => statuscodeStatuscodeRolesRetrieveOptions({query: {code_type: props.codeType}}))

/** The keys the API offers, plus any the record carries that the API no longer lists. */
const roleKeys = computed(() => {
  const offered = rolesQuery.data.value ?? []
  const extra = props.modelValue.filter((key) => !offered.includes(key))
  return [...offered, ...extra]
})
</script>
