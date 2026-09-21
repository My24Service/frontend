<template>
  <ValidatedForm
    :name="idPrefix"
    v-model="formValues"
    :errors="errors"
    :messages="fieldMessages"
    :labels="IDENTITY_FIELD_LABELS"
    :submitted="submitClicked"
  >
    <BFormGroup
      label-cols="4"
      :label="$trans('Username')"
      :label-for="`${idPrefix}_username`"
    >
      <BFormInput
        :id="`${idPrefix}_username`"
        size="sm"
        v-model="values.username"
        :state="usernameValidationState"
      ></BFormInput>
      <b-form-invalid-feedback
        :id="`${idPrefix}_username-required-feedback`"
        :state="false"
      >{{ errors.username }}</b-form-invalid-feedback>
      <b-form-invalid-feedback
        v-if="usernameTakenVisible"
        :id="`${idPrefix}_username-taken-feedback`"
        :state="false"
      >{{ takenMessage() }}</b-form-invalid-feedback>
    </BFormGroup>

    <ValidatedFormField
      name="password1"
      type="password"
      :label-cols="4"
      autocomplete="new-password"
    />

    <ValidatedFormField
      name="password2"
      :label="passwordAgainLabel"
      type="password"
      :label-cols="4"
      autocomplete="new-password"
    />

    <template v-if="withPersonal">
      <ValidatedFormField name="first_name" :label-cols="4" />
      <ValidatedFormField name="last_name" :label-cols="4" />
      <ValidatedFormField
        name="email"
        :label="emailLabel"
        :label-cols="4"
      />
    </template>
  </ValidatedForm>
</template>

<script setup lang="ts" generic="TValues extends UserIdentityPanelValues">
import {
  ValidatedForm,
  ValidatedFormField,
} from '@/features/forms'
import { $trans } from '@/services/i18n'
import { IDENTITY_FIELD_LABELS } from './user-form'

/**
 * The identity block: the username and the two passwords every user form
 * carries, plus the three personal fields the API-user form leaves out.
 *
 * A field's id is the panel's `idPrefix` and the field's name — apiuser_email.
 */
export interface UserIdentityPanelValues {
  username: string
  password1: string
  password2: string
  first_name?: string
  last_name?: string
  email?: string
}

/**
 * The copy the panel needs of its own: the two password lines, which the
 * shared password rule raises outside the schema. The personal rows read
 * their placeholder from the labels, like any field without copy.
 */
export interface IdentityPanelMessages {
  password1: () => string
  password2: () => string
}

const values = defineModel<TValues>('values', { required: true })

/**
 * The model the kit is handed: the same ref, named under this panel's own shape.
 * The kit keys its four lookups by a concrete key union, which a generic panel
 * cannot supply — TypeScript will not check a labels or errors map against
 * `keyof TValues & string` from inside one — so the shape is named here.
 */
const formValues: Ref<UserIdentityPanelValues> = values

const props = withDefaults(defineProps<{
  idPrefix: string
  errors: Record<string, string | undefined>
  submitClicked: boolean
  probeState: 'idle' | 'checking' | 'available' | 'taken'
  takenMessage: () => string
  passwordAgainLabel?: string
  emailLabel?: string
  fieldMessages: IdentityPanelMessages
  /** False for the API-user form, which has no personal rows. */
  withPersonal?: boolean
}>(), {
  // Spelled out because the six personal forms never pass it: an absent
  // Boolean prop would cast to `false` and silently drop their rows.
  withPersonal: true,
})

const probeValidationState = computed(() => {
  if (props.probeState === 'taken') return false
  if (props.probeState === 'available') return true
  return undefined
})

const usernameTakenVisible = computed(() =>
  props.probeState === 'taken' && !props.errors.username,
)

const usernameValidationState = computed(() => {
  if (!props.submitClicked) return probeValidationState.value ?? null
  if (props.errors.username) return false
  return probeValidationState.value ?? true
})
</script>
