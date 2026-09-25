<template>
  <UserFormShell
    :username="planningUser.username"
    :is-create="isCreate"
    :is-loading="isLoading"
    :button-disabled="buttonDisabled"
    @cancel="cancelForm"
    @submit="submitForm"
  >

        <div class="flex-columns">
          <div class="panel">
            <h6>{{ $trans('user info') }}</h6>
            <UserIdentityPanel
              v-model:values="planningUser"
              id-prefix="planninguser"
              :errors="errors"
              :submit-clicked="submitClicked"
              :probe-state="probe.state.value"
              :taken-message="USERNAME_TAKEN_MESSAGE"
              :field-messages="FIELD_MESSAGES"
            />
          </div>

          <div class="panel">
            <h6>{{ $trans('Contract')}} &amp; {{ $trans('time') }} </h6>
            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Contract hours per week')"
              label-for="planning_user_contract_hours_week"
            >
              <BFormInput
                id="planning_user_contract_hours_week"
                size="sm"
                v-model="planningUser.planning_user.contract_hours_week"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Uses time registration')"
              label-for="planning_user_uses_time_registration"
            >
              <BFormCheckbox
                id="planning_user_uses_time_registration"
                size="sm"
                v-model="planningUser.planning_user.uses_time_registration"
              >
              </BFormCheckbox>
            </BFormGroup>
          </div>
        </div>
  </UserFormShell>
</template>

<script lang="ts" setup>
import UserFormShell from '../UserFormShell.vue'
import * as v from 'valibot'

import { CompanyPlanninguser } from '@/api/resources.gen'
import type { PlanningUser } from '@/api/types.gen'
import { vPlanningUserRequestWritable } from '@/api/valibot.gen'
import UserIdentityPanel from '../UserIdentityPanel.vue'
import { emptyUserIdentity, filledFrom, USERNAME_TAKEN_MESSAGE } from '../user-form'
import { useUserForm } from '../use-user-form'
import {
  emptyPlanningUser,
  FIELD_MESSAGES,
  parsePlanningUserForm,
  validatePlanningUserForm,
  type PlanningUserFieldErrors,
  type PlanningUserFormValues,
} from './schemas'
const props = withDefaults(defineProps<{
  pk?: string | number | null
}>(), {
  pk: null,
})

function planningUserFromRecord(record: PlanningUser): PlanningUserFormValues {
  return {
    ...filledFrom(emptyUserIdentity(), record),
    planning_user: filledFrom(emptyPlanningUser().planning_user, record.planning_user),
  }
}

const {
  values: planningUser,
  errors,
  submitClicked,
  probe,
  isCreate,
  isLoading,
  buttonDisabled,
  submitForm,
  cancelForm,
} = useUserForm<
  PlanningUserFormValues,
  PlanningUser,
  v.InferOutput<typeof vPlanningUserRequestWritable>,
  PlanningUserFieldErrors
>({
  pk: () => props.pk,
  resource: CompanyPlanninguser,
  empty: () => ({...emptyPlanningUser()}),
  fromRecord: planningUserFromRecord,
  validate: validatePlanningUserForm,
  parse: parsePlanningUserForm,
  takenMessage: USERNAME_TAKEN_MESSAGE,
  copy: {
    fetchError: $trans('Error loading planning user'),
    created: $trans('Created'),
    createdDetail: $trans('planning user has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('planning user has been updated'),
    createError: $trans('Error creating planning user'),
    updateError: $trans('Error updating planning user'),
  },
})
</script>
