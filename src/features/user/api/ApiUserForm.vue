<template>
  <UserFormShell
    :username="apiUser.username"
    :is-create="isCreate"
    :is-loading="isLoading"
    :button-disabled="buttonDisabled"
    @cancel="cancelForm"
    @submit="submitForm"
  >

        <div class="flex-columns">
          <div class="panel">
            <h6>{{ $trans('User info')}}</h6>
            <UserIdentityPanel
              v-model:values="apiUser"
              id-prefix="apiuser"
              :errors="errors"
              :submit-clicked="submitClicked"
              :probe-state="probe.state.value"
              :taken-message="USERNAME_TAKEN_MESSAGE"
              :field-messages="FIELD_MESSAGES"
              :with-personal="false"
            />
          </div>

          <div class="panel">
            <h6>{{ $trans('API key')}}</h6>
            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Name')"
              label-for="apiuser_name"
            >
              <BFormInput
                id="apiuser_name"
                size="sm"
                v-model="apiUser.name"
                :state="submitClicked ? !errors['api_user.name'] : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="apiuser_name-feedback"
                :state="submitClicked ? !errors['api_user.name'] : null">
                {{ errors['api_user.name'] || PLACEHOLDERS['api_user.name']() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Valid from')"
              label-for="apiuser_expire_start_dt"
            >
              <BFormInput
                id="apiuser_expire_start_dt"
                size="sm"
                type="date"
                v-model="apiUser.expire_start_dt"
                :state="submitClicked ? !errors['api_user.expire_start_dt'] : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="apiuser_expire_start_dt-feedback"
                :state="submitClicked ? !errors['api_user.expire_start_dt'] : null">
                {{ errors['api_user.expire_start_dt'] || PLACEHOLDERS['api_user.expire_start_dt']() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Expire in days')"
              label-for="apiuser_expire_in_days"
            >
              <BFormInput
                id="apiuser_expire_in_days"
                size="sm"
                type="number"
                v-model.number="apiUser.expire_in_days"
                :state="submitClicked ? !errors['api_user.expire_in_days'] : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="apiuser_expire_in_days-feedback"
                :state="submitClicked ? !errors['api_user.expire_in_days'] : null">
                {{ errors['api_user.expire_in_days'] || PLACEHOLDERS['api_user.expire_in_days']() }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </div>
        </div>
  </UserFormShell>
</template>

<script lang="ts" setup>
import UserFormShell from '../UserFormShell.vue'
import * as v from 'valibot'

import { CompanyApiuser } from '@/api/resources.gen'
import type { ApiUser } from '@/api/types.gen'
import { vApiUserRequestWritable } from '@/api/valibot.gen'
import {
  emptyApiUser,
  FIELD_MESSAGES,
  PLACEHOLDERS,
  parseApiUserForm,
  validateApiUserForm,
  type ApiUserFieldErrors,
  type ApiUserFormValues,
} from './schemas'
import { USERNAME_TAKEN_MESSAGE } from '../user-form'
import { useUserForm } from '../use-user-form'
import UserIdentityPanel from '../UserIdentityPanel.vue'
const props = withDefaults(defineProps<{
  pk?: string | number | null
}>(), {
  pk: null,
})

function apiUserFromRecord(record: ApiUser): ApiUserFormValues {
  return {
    username: record.username,
    password1: '',
    password2: '',
    name: record.api_user?.name ?? '',
    expire_start_dt: record.api_user?.expire_start_dt ?? '',
    expire_in_days: record.api_user?.expire_in_days ?? 365,
  }
}

// The wrapper owns the pk split, the detail read, the probe wiring, the
// password rules, the guards, the toasts and the parse; the form keeps its
// per-type extras (the API-key panel) and the record shaping. `values` rides
// under its legacy name so the extra inputs stay untouched.
const {
  isCreate,
  values: apiUser,
  errors,
  submitClicked,
  isLoading,
  buttonDisabled,
  submitForm,
  cancelForm,
  probe,
} = useUserForm<
  ApiUserFormValues,
  ApiUser,
  v.InferOutput<typeof vApiUserRequestWritable>,
  ApiUserFieldErrors
>({
  pk: () => props.pk,
  resource: CompanyApiuser,
  empty: emptyApiUser,
  fromRecord: apiUserFromRecord,
  validate: validateApiUserForm,
  parse: parseApiUserForm,
  takenMessage: USERNAME_TAKEN_MESSAGE,
  copy: {
    fetchError: $trans('Error loading API user'),
    created: $trans('Created'),
    createdDetail: $trans('API user has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('API user has been updated'),
    createError: $trans('Error creating API user'),
    updateError: $trans('Error updating API user'),
  },
})
</script>
