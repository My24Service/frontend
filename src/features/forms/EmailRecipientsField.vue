<template>
  <BFormGroup
    :label="$trans('Email recipients')"
    label-for="tags-validation"
    :state="state"
  >
    <b-form-tags
      input-id="tags-validation"
      v-model="recipients"
      :tag-validator="tagValidator"
      :state="state"
      :placeholder="$trans('Input the email address and press space')"
      :invalid-tag-text="$trans('Invalid email address')"
      :duplicate-tag-text="$trans('Duplicate email')"
      tag-variant="primary"
      separator=" "
    ></b-form-tags>
    <template #invalid-feedback>
      {{ $trans('You must provide at least 1 email recipient') }}
    </template>
  </BFormGroup>
</template>

<script setup lang="ts">
import { tagValidator } from './email-recipients'

/**
 * The recipients of a "send by e-mail" form as address tags. Its error shows
 * once the form was submitted, like a `ValidatedFormField`'s.
 */
const props = defineProps<{
  invalid: boolean
  submitted: boolean
}>()
const recipients = defineModel<string[]>({required: true})

const state = computed(() => props.submitted ? !props.invalid : null)
</script>
