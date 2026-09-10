<template>
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
    :id="`${idPrefix}_password`"
    :label="$trans('Password')"
    v-model="values.password1"
    type="password"
    :error="errors.password1"
    :placeholder="fieldMessages.password1()"
    :submitted="submitClicked"
    :label-cols="4"
  />

  <ValidatedFormField
    :id="`${idPrefix}_password_again`"
    :label="passwordAgainLabel ?? $trans('Password again')"
    v-model="values.password2"
    type="password"
    :error="errors.password2"
    :placeholder="fieldMessages.password2()"
    :submitted="submitClicked"
    :label-cols="4"
  />

  <template v-if="personal">
    <ValidatedFormField
      :id="`${idPrefix}_first_name`"
      :label="$trans('First name')"
      v-model="values.first_name"
      :error="errors.first_name"
      :placeholder="personal.first_name()"
      :submitted="submitClicked"
      :label-cols="4"
    />

    <ValidatedFormField
      :id="`${idPrefix}_last_name`"
      :label="$trans('Last name')"
      v-model="values.last_name"
      :error="errors.last_name"
      :placeholder="personal.last_name()"
      :submitted="submitClicked"
      :label-cols="4"
    />

    <ValidatedFormField
      :id="`${idPrefix}_email`"
      :label="emailLabel ?? $trans('Email')"
      v-model="values.email"
      :error="errors.email"
      :placeholder="personal.email()"
      :submitted="submitClicked"
      :label-cols="4"
    />
  </template>
</template>

<script setup lang="ts" generic="TValues extends UserIdentityPanelValues">
import { computed } from 'vue'

import ValidatedFormField from '@/features/forms/ValidatedFormField.vue'
import { $trans } from '@/services/i18n'

/**
 * The identity block all 7 user forms copy-paste: username + probe feedback,
 * the password pair, first/last name and email. Built on `ValidatedFormField`
 * + the probe verdict, driven by props so migrated forms keep exact input ids
 * via `idPrefix` (specs target `#salesuser_username` etc.).
 *
 * The username row stays hand-written: its two-line feedback (required error
 * always rendered, taken verdict conditional) and its probe-derived `:state`
 * have no counterpart in `ValidatedFormField`. The other five rows are the
 * `error / placeholder / submitted` contract exactly (`errors.x` or the
 * `FIELD_MESSAGES.x()` hint, `null` state before submit).
 *
 * Labels: `Password again` and `Email` by default. Sales says
 * `Confirm password` and `Email address` — pass `passwordAgainLabel` /
 * `emailLabel` when migrating it.
 *
 * Generic over the form values so a form hands the panel its own state type
 * rather than an index-signature copy of it: the panel only ever reads and
 * writes the rows it renders. Api users carry no personal fields — pass
 * `:with-personal="false"`, and neither the personal rows nor their copy are
 * then required (the props type pairs the two).
 */

/** The rows the panel edits. The personal half is optional: api users have none. */
export interface UserIdentityPanelValues {
  username: string
  password1: string
  password2: string
  first_name?: string
  last_name?: string
  email?: string
}

/** The username + password rows' copy — the half every user form has. */
export interface IdentityPanelMessages {
  password1: () => string
  password2: () => string
}

/** The personal rows' copy; required exactly when those rows render. */
export interface PersonalPanelMessages {
  first_name: () => string
  last_name: () => string
  email: () => string
}

const values = defineModel<TValues>('values', { required: true })

const props = withDefaults(defineProps<{
  /** Id stem keeping migrated inputs exact (e.g. `salesuser`, `engineer`). */
  idPrefix: string
  errors: Record<string, string | undefined>
  submitClicked: boolean
  /** The probe verdict (`probe.state.value`); panel derives visibility + state. */
  probeState: 'idle' | 'checking' | 'available' | 'taken'
  /** Per-type `USERNAME_TAKEN_MESSAGE`. */
  takenMessage: () => string
  passwordAgainLabel?: string
  emailLabel?: string
} & (
  | { /** Api users hide the personal rows, and with them their copy. */ withPersonal: false; fieldMessages: IdentityPanelMessages }
  | { withPersonal?: true; fieldMessages: IdentityPanelMessages & PersonalPanelMessages }
)>(), {
  // Spelled out because the six personal forms never pass it: an absent
  // Boolean prop would cast to `false` and silently drop their rows.
  withPersonal: true,
})

/**
 * The personal rows' copy, or `null` when the panel does not render them.
 * Pairing it with `withPersonal` in the props type is what lets the api form
 * pass its own `FIELD_MESSAGES` instead of stubbing three thunks the rows
 * would never have read.
 */
const personal = computed<PersonalPanelMessages | null>(() => {
  if (props.withPersonal === false) return null
  return props.fieldMessages
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
