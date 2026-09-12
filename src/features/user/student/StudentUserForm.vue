<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
      <header>
        <div class="page-title">
          <h3>
            <IBiPeople></IBiPeople>
            <span class="backlink" @click="cancelForm">{{ $trans("People") }}</span> /
            <strong> {{ studentUser.username }}</strong>
            <span class="dimmed" v-if="isCreate && !studentUser.username">{{ $trans('new') }}</span>
            <span class="dimmed" v-if="!isCreate && !studentUser.username">{{ $trans('edit') }}</span>
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
          <div class="panel col-1-3">
            <h6>{{ $trans('User info')}}</h6>

            <UserIdentityPanel
              v-model:values="studentUser"
              id-prefix="studentuser"
              :errors="errors"
              :submit-clicked="submitClicked"
              :probe-state="probe.state.value"
              :taken-message="USERNAME_TAKEN_MESSAGE"
              :field-messages="FIELD_MESSAGES"
            />
          </div>

          <div class="panel col-1-3">
            <h6>{{ $trans('Personal details')}}</h6>
            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Mobile')"
              label-for="studentuser_mobile"
            >
              <BFormInput
                id="studentuser_mobile"
                size="sm"
                v-model="studentUser.student_user.mobile"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('IBAN')"
              label-for="studentuser_iban"
            >
              <BFormInput
                id="studentuser_iban"
                size="sm"
                v-model="studentUser.student_user.iban"
              ></BFormInput>
            </BFormGroup>
          </div>

          <div class="panel col-1-3">
            <h6>{{ $trans('Address')}}</h6>
            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Street')"
              label-for="studentuser_street"
            >
              <BFormInput
                id="studentuser_street"
                size="sm"
                v-model="studentUser.student_user.street"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('House nr./addition')"
              label-for="studentuser_house_number"
            >
              <BFormInput
                id="studentuser_house_number"
                size="sm"
                v-model="studentUser.student_user.house_number"
              ></BFormInput>
              <BFormInput
                id="studentuser_house_number_addition"
                size="sm"
                v-model="studentUser.student_user.house_number_addition"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Postal')"
              label-for="studentuser_postal"
            >
              <BFormInput
                id="studentuser_postal"
                size="sm"
                v-model="studentUser.student_user.postal"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('City')"
              label-for="studentuser_city"
            >
              <BFormInput
                id="studentuser_city"
                size="sm"
                v-model="studentUser.student_user.city"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Country')"
              label-for="studentuser_country_code"
            >
              <BFormSelect
                id="studentuser_country_code"
                v-model="studentUser.student_user.country_code"
                :options="countries"
                size="sm"
              ></BFormSelect>
            </BFormGroup>
          </div>

          <div class="panel col-1-3">
            <h6>{{ $trans('Student details')}}</h6>
            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Gender')"
              label-for="studentuser_gender"
            >
              <BFormSelect
                id="studentuser_gender"
                v-model="studentUser.student_user.gender"
                :options="genderOptions"
                size="sm"
              ></BFormSelect>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('DoB (yyyy-mm-dd)')"
              label-for="studentuser_dob"
            >
              <BFormInput
                id="studentuser_dob"
                size="sm"
                v-model="studentUser.student_user.dob"
                :state="submitClicked ? !dobError : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="studentuser_dob-feedback"
                :state="submitClicked ? !dobError : null">
                {{ dobError || FIELD_MESSAGES.student_user.dob() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Drivers licence')"
              label-for="studentuser_drivers_licence"
            >
              <BFormSelect
                id="studentuser_drivers_licence"
                v-model="studentUser.student_user.drivers_licence"
                :options="yesNoOptions"
                size="sm"
              ></BFormSelect>
            </BFormGroup>

            <BFormGroup
              v-if="studentUser.student_user.drivers_licence === 'Y'"
              label-size="sm"
              label-cols="4"
              :label="$trans('Type')"
              label-for="studentuser_drivers_licence_type"
            >
              <BFormInput
                id="studentuser_drivers_licence_type"
                size="sm"
                v-model="studentUser.student_user.drivers_licence_type"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Box truck')"
              label-for="studentuser_box_truck"
            >
              <BFormSelect
                id="studentuser_box_truck"
                v-model="studentUser.student_user.box_truck"
                :options="yesNoOptions"
                size="sm"
              ></BFormSelect>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('BSN')"
              label-for="studentuser_bsn"
            >
              <BFormInput
                id="studentuser_bsn"
                size="sm"
                v-model="studentUser.student_user.bsn"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Info')"
              label-for="studentuser_info"
            >
              <BFormTextarea
                id="studentuser_info"
                v-model="studentUser.student_user.info"
                rows="3"
              ></BFormTextarea>
            </BFormGroup>
          </div>
        </div>
      </div>
    </div>
  </b-overlay>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import * as v from 'valibot'

import {
  companyStudentuserCreateMutation,
  companyStudentuserListQueryKey,
  companyStudentuserPartialUpdateMutation,
  companyStudentuserRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import { vStudentUserWriteRequestWritable } from '@/api/valibot.gen'
import type { StudentUser } from '@/api/types.gen'
import {
  emptyStudentUser,
  FIELD_MESSAGES,
  parseStudentUserForm,
  validateStudentUserForm,
  type StudentUserFieldErrors,
  type StudentUserFormValues,
} from './schemas'
import { COUNTRY_OPTIONS } from './options'
import { emptyUserIdentity, filledFrom, USERNAME_TAKEN_MESSAGE } from '../user-form'
import { useUserForm } from '../use-user-form'
import UserIdentityPanel from '../UserIdentityPanel.vue'
import { $trans } from '@/services/i18n'

const props = withDefaults(defineProps<{
  pk?: string | number | null
}>(), {
  pk: null,
})

// The record nests its profile the way the write body does, so the form's
// fields fill straight from it; the passwords start blank.
function studentUserFromRecord(record: StudentUser): StudentUserFormValues {
  return {
    ...filledFrom(emptyUserIdentity(), record),
    student_user: filledFrom(emptyStudentUser().student_user, record.student_user),
  }
}

const dobError = computed(() => errors.value.dob ?? errors.value.student_user)

const countries = COUNTRY_OPTIONS
const yesNoOptions = [
  {value: 'Y', text: $trans('Yes')},
  {value: 'N', text: $trans('No')},
]
const genderOptions = [
  {value: 'M', text: $trans('Male')},
  {value: 'F', text: $trans('Female')},
  {value: 'O', text: $trans('Other')},
]

// The wrapper owns the pk split, the detail read, the probe wiring, the
// password rules, the guards, the toasts and the parse; the form keeps its
// per-type extras (address + student-details panels) and the record shaping.
// `values` rides under its legacy name so the extra inputs stay untouched.
const {
  isCreate,
  values: studentUser,
  errors,
  submitClicked,
  isLoading,
  buttonDisabled,
  submitForm,
  cancelForm,
  probe,
} = useUserForm<
  StudentUserFormValues,
  StudentUser,
  v.InferOutput<typeof vStudentUserWriteRequestWritable>,
  StudentUserFieldErrors
>({
  pk: () => props.pk,
  retrieve: (id: number) => companyStudentuserRetrieveOptions({path: {id}}),
  create: companyStudentuserCreateMutation(),
  update: companyStudentuserPartialUpdateMutation(),
  invalidate: (queryClient) => queryClient.invalidateQueries({queryKey: companyStudentuserListQueryKey()}),
  empty: emptyStudentUser,
  fromRecord: studentUserFromRecord,
  validate: validateStudentUserForm,
  parse: parseStudentUserForm,
  takenMessage: USERNAME_TAKEN_MESSAGE,
  copy: {
    fetchError: $trans('Error loading student user'),
    created: $trans('Created'),
    createdDetail: $trans('Student user has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Student user has been updated'),
    createError: $trans('Error creating student user'),
    updateError: $trans('Error updating student user'),
  },
})
</script>
