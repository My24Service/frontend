<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
      <header>
        <div class="page-title">
          <h3>
            <IBiPeople></IBiPeople>
            <span class="backlink" @click="cancelForm">{{ $trans("People") }}</span> /
            <strong> {{ planningUser.username }}</strong>
            <span class="dimmed" v-if="isCreate && !planningUser.username">{{ $trans('new') }}</span>
            <span class="dimmed" v-if="!isCreate && !planningUser.username">{{ $trans('edit') }}</span>
          </h3>
          <div class="flex-columns">
            <BButton @click="cancelForm" type="button" variant="secondary" class="outline">
              {{ $trans('Cancel') }}</BButton>
            <BButton @click="submitForm" :disabled="buttonDisabled" type="button" variant="primary">
              {{ $trans('Submit') }}</BButton>
          </div>
        </div>
      </header>

      <div class="page-detail">
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
                v-model="planningUser.contract_hours_week"
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
                v-model="planningUser.uses_time_registration"
              >
              </BFormCheckbox>
            </BFormGroup>
          </div>
        </div>
      </div>
    </div>
  </b-overlay>
</template>

<script lang="ts" setup>
import * as v from 'valibot'

import {
  companyPlanninguserCreateMutation,
  companyPlanninguserListQueryKey,
  companyPlanninguserPartialUpdateMutation,
  companyPlanninguserRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { PlanningUser } from '@/api/types.gen'
import { vPlanningUserRequestWritable } from '@/api/valibot.gen'
import UserIdentityPanel from '../UserIdentityPanel.vue'
import { useUserForm } from '../use-user-form'
import {
  emptyPlanningUser,
  FIELD_MESSAGES,
  parsePlanningUserForm,
  USERNAME_TAKEN_MESSAGE,
  validatePlanningUserForm,
  type PlanningUserFieldErrors,
  type PlanningUserFormValues,
} from './schemas'
import { $trans } from '@/services/i18n'

const props = withDefaults(defineProps<{
  pk?: string | number | null
}>(), {
  pk: null,
})

function planningUserFromRecord(record: PlanningUser): PlanningUserFormValues {
  return {
    username: record.username,
    first_name: record.first_name ?? '',
    last_name: record.last_name ?? '',
    email: record.email ?? '',
    password1: '',
    password2: '',
    uses_time_registration: record.planning_user?.uses_time_registration ?? false,
    contract_hours_week: record.planning_user?.contract_hours_week ?? '0.00',
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
  retrieve: (id) => companyPlanninguserRetrieveOptions({path: {id}}),
  create: companyPlanninguserCreateMutation(),
  update: companyPlanninguserPartialUpdateMutation(),
  invalidate: (queryClient) => queryClient.invalidateQueries({queryKey: companyPlanninguserListQueryKey()}),
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
