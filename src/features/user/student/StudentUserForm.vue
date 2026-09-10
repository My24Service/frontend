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

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Username')"
              label-for="studentuser_username"
            >
              <BFormInput
                id="studentuser_username"
                size="sm"
                v-model="studentUser.username"
                :state="usernameValidationState"
              ></BFormInput>
              <b-form-invalid-feedback
                id="studentuser_username-required-feedback"
                :state="false">
                {{ errors.username }}
              </b-form-invalid-feedback>
              <b-form-invalid-feedback
                id="studentuser_username-taken-feedback"
                v-if="usernameTakenVisible"
                :state="false">
                {{ USERNAME_TAKEN_MESSAGE() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Password')"
              label-for="studentuser_password"
            >
              <BFormInput
                id="studentuser_password"
                size="sm"
                type="password"
                v-model="studentUser.password1"
                :state="submitClicked ? !errors.password1 : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="studentuser_password-feedback"
                :state="submitClicked ? !errors.password1 : null">
                {{ errors.password1 || FIELD_MESSAGES.password1() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Password again')"
              label-for="studentuser_password_again"
            >
              <BFormInput
                id="studentuser_password_again"
                size="sm"
                type="password"
                v-model="studentUser.password2"
                :state="submitClicked ? !errors.password2 : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="studentuser_password_again-feedback"
                :state="submitClicked ? !errors.password2 : null">
                {{ errors.password2 || FIELD_MESSAGES.password2() }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </div>

          <div class="panel col-1-3">
            <h6>{{ $trans('Personal details')}}</h6>
            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('First name')"
              label-for="studentuser_first_name"
            >
              <BFormInput
                id="studentuser_first_name"
                size="sm"
                v-model="studentUser.first_name"
                :state="submitClicked ? !errors.first_name : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="studentuser_first_name-feedback"
                :state="submitClicked ? !errors.first_name : null">
                {{ errors.first_name || FIELD_MESSAGES.first_name() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Last name')"
              label-for="studentuser_last_name"
            >
              <BFormInput
                id="studentuser_last_name"
                size="sm"
                v-model="studentUser.last_name"
                :state="submitClicked ? !errors.last_name : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="studentuser_last_name-feedback"
                :state="submitClicked ? !errors.last_name : null">
                {{ errors.last_name || FIELD_MESSAGES.last_name() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Email')"
              label-for="studentuser_email"
            >
              <BFormInput
                id="studentuser_email"
                size="sm"
                v-model="studentUser.email"
                :state="submitClicked ? !errors.email : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="studentuser_email-feedback"
                :state="submitClicked ? !errors.email : null">
                {{ errors.email || FIELD_MESSAGES.email() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Mobile')"
              label-for="studentuser_mobile"
            >
              <BFormInput
                id="studentuser_mobile"
                size="sm"
                v-model="studentUser.mobile"
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
                v-model="studentUser.iban"
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
                v-model="studentUser.street"
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
                v-model="studentUser.house_number"
              ></BFormInput>
              <BFormInput
                id="studentuser_house_number_addition"
                size="sm"
                v-model="studentUser.house_number_addition"
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
                v-model="studentUser.postal"
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
                v-model="studentUser.city"
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
                v-model="studentUser.country_code"
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
                v-model="studentUser.gender"
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
                v-model="studentUser.dob"
                :state="submitClicked ? !errors.student_user : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="studentuser_dob-feedback"
                :state="submitClicked ? !errors.student_user : null">
                {{ errors.student_user || FIELD_MESSAGES.student_user() }}
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
                v-model="studentUser.drivers_licence"
                :options="yesNoOptions"
                size="sm"
              ></BFormSelect>
            </BFormGroup>

            <BFormGroup
              v-if="studentUser.drivers_licence === 'Y'"
              label-size="sm"
              label-cols="4"
              :label="$trans('Type')"
              label-for="studentuser_drivers_licence_type"
            >
              <BFormInput
                id="studentuser_drivers_licence_type"
                size="sm"
                v-model="studentUser.drivers_licence_type"
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
                v-model="studentUser.box_truck"
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
                v-model="studentUser.bsn"
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
                v-model="studentUser.info"
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
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'

import {
  companyStudentuserCreateMutation,
  companyStudentuserListQueryKey,
  companyStudentuserPartialUpdateMutation,
  companyStudentuserRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { StudentUser } from '@/api/types.gen'
import {
  emptyStudentUser,
  FIELD_MESSAGES,
  parseStudentUserForm,
  USERNAME_TAKEN_MESSAGE,
  validateStudentUserForm,
  type StudentUserFieldErrors,
  type StudentUserFormValues,
} from './schemas'
import { useUsernameProbe } from '../use-username-probe'
import { errorToast, infoToast, $trans } from '@/utils'

const props = withDefaults(defineProps<{
  pk?: string | number | null
}>(), {
  pk: null,
})

const router = useRouter()
const queryClient = useQueryClient()
const {create} = useToast()

const isCreate = computed(() => !props.pk)
const studentUserId = computed(() => Number(props.pk))

const detailQuery = useQuery(() => ({
  ...companyStudentuserRetrieveOptions({path: {id: studentUserId.value}}),
  enabled: !isCreate.value,
}))

watch(
  () => detailQuery.error.value,
  (error) => {
    if (error) errorToast(create, $trans('Error loading student user'))
  },
)

const studentUser = ref<StudentUserFormValues>(emptyStudentUser())

const originalUsername = ref<string | null>(null)

function studentUserFromRecord(record: StudentUser): StudentUserFormValues {
  const sub = record.student_user ?? {}
  return {
    username: record.username ?? '',
    first_name: record.first_name ?? '',
    last_name: record.last_name ?? '',
    email: record.email ?? '',
    password1: '',
    password2: '',
    street: sub.street ?? '',
    house_number: sub.house_number ?? '',
    house_number_addition: sub.house_number_addition ?? '',
    postal: sub.postal ?? '',
    city: sub.city ?? '',
    country_code: sub.country_code ?? 'NL',
    mobile: sub.mobile ?? '',
    iban: sub.iban ?? '',
    gender: sub.gender ?? 'M',
    dob: sub.dob ?? '',
    drivers_licence: sub.drivers_licence ?? 'N',
    drivers_licence_type: sub.drivers_licence_type ?? '',
    box_truck: sub.box_truck ?? 'N',
    bsn: sub.bsn ?? '',
    info: sub.info ?? '',
  }
}

watch(
  () => detailQuery.data.value,
  (data) => {
    if (!data) return
    originalUsername.value = data.username ?? null
    studentUser.value = studentUserFromRecord(data)
  },
  {immediate: true},
)

const countries = ['NL', 'BE', 'DE']
const yesNoOptions = [
  {value: 'Y', text: $trans('Yes')},
  {value: 'N', text: $trans('No')},
]
const genderOptions = [
  {value: 'M', text: $trans('Male')},
  {value: 'F', text: $trans('Female')},
  {value: 'O', text: $trans('Other')},
]

const errors = ref<StudentUserFieldErrors>({})
const submitClicked = ref(false)
const saving = ref(false)

const probe = useUsernameProbe(
  () => studentUser.value.username,
  originalUsername,
)

const usernameTakenVisible = computed(() =>
  probe.state.value === 'taken' && !errors.value.username)

const usernameValidationState = computed(() => {
  if (!submitClicked.value) return probe.validationState.value ?? null
  if (errors.value.username) return false
  return probe.validationState.value ?? true
})

const saveMutation = useMutation({
  ...companyStudentuserCreateMutation(),
  onSuccess: async () => {
    infoToast(create, $trans('Created'), $trans('Student user has been created'))
    await queryClient.invalidateQueries({queryKey: companyStudentuserListQueryKey()})
    router.go(-1)
  },
  onError: () => {
    errorToast(create, $trans('Error creating student user'))
  },
})

const updateMutation = useMutation({
  ...companyStudentuserPartialUpdateMutation(),
  onSuccess: async () => {
    infoToast(create, $trans('Updated'), $trans('Student user has been updated'))
    await queryClient.invalidateQueries({queryKey: companyStudentuserListQueryKey()})
    router.go(-1)
  },
  onError: () => {
    errorToast(create, $trans('Error updating student user'))
  },
})

const isLoading = computed(() =>
  detailQuery.isLoading.value ||
  saving.value ||
  saveMutation.isPending.value ||
  updateMutation.isPending.value,
)
const buttonDisabled = computed(() =>
  saveMutation.isPending.value || updateMutation.isPending.value || saving.value)

async function submitForm() {
  if (saving.value) return
  saving.value = true

  try {
    submitClicked.value = true

    const found = validateStudentUserForm(studentUser.value, {isCreate: isCreate.value})
    errors.value = found
    if (Object.keys(found).length > 0) return

    await probe.waitForProbe()

    if (studentUser.value.username !== originalUsername.value && probe.state.value === 'taken') {
      errors.value.username = USERNAME_TAKEN_MESSAGE()
      return
    }

    try {
      if (isCreate.value) {
        await saveMutation.mutateAsync({
          body: parseStudentUserForm(studentUser.value, {isCreate: true}),
        })
      } else {
        const password = studentUser.value.password1 !== ''
          ? studentUser.value.password1
          : undefined
        await updateMutation.mutateAsync({
          path: {id: studentUserId.value},
          body: parseStudentUserForm(studentUser.value, {isCreate: false, password}),
        })
      }
    } catch {
      // The mutation's onError already told the user; staying on the form is
      // the contract, not a silent swallow.
    }
  } finally {
    saving.value = false
  }
}

function cancelForm() {
  router.go(-1)
}
</script>
