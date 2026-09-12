<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
      <header>
        <div class="page-title">
          <h3>
            <IBiPeople></IBiPeople>
            <span class="backlink" @click="cancelForm">{{ $trans("People") }}</span> /
            <strong> {{ salesUser.username }}</strong>
            <span class="dimmed" v-if="isCreate && !salesUser.username">{{ $trans('new') }}</span>
            <span class="dimmed" v-if="!isCreate && !salesUser.username">{{ $trans('edit') }}</span>
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
            <h6>{{ $trans('User info')}}</h6>
            <UserIdentityPanel
              v-model:values="salesUser"
              id-prefix="salesuser"
              :errors="errors"
              :submit-clicked="submitClicked"
              :probe-state="probe.state.value"
              :taken-message="USERNAME_TAKEN_MESSAGE"
              :field-messages="FIELD_MESSAGES"
              :password-again-label="$trans('Confirm password')"
              :email-label="$trans('Email address')"
            />
          </div>

          <div class="panel">
            <h6>{{ $trans('Contract')}} &amp; {{ $trans('Time registration') }} </h6>
            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Contract hours per week')"
              label-for="sales_user_contract_hours_week"
            >
              <BFormInput
                id="sales_user_contract_hours_week"
                size="sm"
                v-model="salesUser.sales_user.contract_hours_week"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Uses time registration')"
              label-for="sales_user_uses_time_registration"
            >
              <BFormCheckbox
                id="sales_user_uses_time_registration"
                size="sm"
                v-model="salesUser.sales_user.uses_time_registration"
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
  companySalesuserCreateMutation,
  companySalesuserListQueryKey,
  companySalesuserPartialUpdateMutation,
  companySalesuserRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { SalesUser } from '@/api/types.gen'
import { vSalesUserRequestWritable } from '@/api/valibot.gen'
import UserIdentityPanel from '../UserIdentityPanel.vue'
import { emptyUserIdentity, filledFrom, USERNAME_TAKEN_MESSAGE } from '../user-form'
import { useUserForm } from '../use-user-form'
import {
  emptySalesUser,
  FIELD_MESSAGES,
  parseSalesUserForm,
  validateSalesUserForm,
  type SalesUserFieldErrors,
  type SalesUserFormValues,
} from './schemas'
import { $trans } from '@/services/i18n'

const props = withDefaults(defineProps<{
  pk?: string | number | null
}>(), {
  pk: null,
})

function salesUserFromRecord(record: SalesUser): SalesUserFormValues {
  return {
    ...filledFrom(emptyUserIdentity(), record),
    sales_user: filledFrom(emptySalesUser().sales_user, record.sales_user),
  }
}

const {
  values: salesUser,
  errors,
  submitClicked,
  probe,
  isCreate,
  isLoading,
  buttonDisabled,
  submitForm,
  cancelForm,
} = useUserForm<
  SalesUserFormValues,
  SalesUser,
  v.InferOutput<typeof vSalesUserRequestWritable>,
  SalesUserFieldErrors
>({
  pk: () => props.pk,
  retrieve: (id) => companySalesuserRetrieveOptions({path: {id}}),
  create: companySalesuserCreateMutation(),
  update: companySalesuserPartialUpdateMutation(),
  invalidate: (queryClient) => queryClient.invalidateQueries({queryKey: companySalesuserListQueryKey()}),
  empty: () => ({...emptySalesUser()}),
  fromRecord: salesUserFromRecord,
  validate: validateSalesUserForm,
  parse: parseSalesUserForm,
  takenMessage: USERNAME_TAKEN_MESSAGE,
  copy: {
    fetchError: $trans('Error loading sales user'),
    created: $trans('Created'),
    createdDetail: $trans('sales user has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('sales user has been updated'),
    createError: $trans('Error creating sales user'),
    updateError: $trans('Error updating sales user'),
  },
})
</script>
