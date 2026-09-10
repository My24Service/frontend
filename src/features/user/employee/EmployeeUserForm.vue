<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
      <header>
        <div class="page-title">
          <h3>
            <IBiPeople></IBiPeople>
            <span class="backlink" @click="cancelForm">{{ $trans("People") }}</span> /
            <strong> {{ employeeUser.username }}</strong>
            <span class="dimmed" v-if="isCreate && !employeeUser.username">{{ $trans('new') }}</span>
            <span class="dimmed" v-if="!isCreate && !employeeUser.username">{{ $trans('edit') }}</span>
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
            <BFormGroup
              label-cols="4"
              :label="$trans('Username')"
              label-for="employee_username"
            >
              <BFormInput
                id="employee_username"
                size="sm"
                v-model="employeeUser.username"
                :state="usernameValidationState"
              ></BFormInput>
              <b-form-invalid-feedback
                id="employee_username-required-feedback"
                :state="false">
                {{ errors.username }}
              </b-form-invalid-feedback>
              <b-form-invalid-feedback
                id="employee_username-taken-feedback"
                v-if="usernameTakenVisible"
                :state="false">
                {{ USERNAME_TAKEN_MESSAGE() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-cols="4"
              :label="$trans('Password')"
              label-for="employee_password"
            >
              <BFormInput
                id="employee_password"
                size="sm"
                type="password"
                v-model="employeeUser.password1"
                :state="submitClicked ? !errors.password1 : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="employee_password-feedback"
                :state="submitClicked ? !errors.password1 : null">
                {{ errors.password1 || FIELD_MESSAGES.password1() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-cols="4"
              :label="$trans('Password again')"
              label-for="employee_password_again"
            >
              <BFormInput
                id="employee_password_again"
                size="sm"
                type="password"
                v-model="employeeUser.password2"
                :state="submitClicked ? !errors.password2 : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="employee_password_again-feedback"
                :state="submitClicked ? !errors.password2 : null">
                {{ errors.password2 || FIELD_MESSAGES.password2() }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </div>

          <div class="panel">
            <h6>{{ $trans('personal details') }}</h6>
            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('First name')"
              label-for="employee_first_name"
            >
              <BFormInput
                id="employee_first_name"
                size="sm"
                v-model="employeeUser.first_name"
                :state="submitClicked ? !errors.first_name : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="employee_first_name-feedback"
                :state="submitClicked ? !errors.first_name : null">
                {{ errors.first_name || FIELD_MESSAGES.first_name() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Last name')"
              label-for="employee_last_name"
            >
              <BFormInput
                id="employee_last_name"
                size="sm"
                v-model="employeeUser.last_name"
                :state="submitClicked ? !errors.last_name : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="employee_last_name-feedback"
                :state="submitClicked ? !errors.last_name : null">
                {{ errors.last_name || FIELD_MESSAGES.last_name() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Email')"
              label-for="employee_email"
            >
              <BFormInput
                id="employee_email"
                size="sm"
                v-model="employeeUser.email"
                :state="submitClicked ? !errors.email : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="employee_email-feedback"
                :state="submitClicked ? !errors.email : null">
                {{ errors.email || FIELD_MESSAGES.email() }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </div>

          <div class="panel">
            <h6>{{ $trans('contract')}} &amp; {{ $trans('misc.') }} </h6>
            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Contract hours per week')"
              label-for="employee_contract_hours_week"
            >
              <BFormInput
                id="employee_contract_hours_week"
                size="sm"
                v-model="employeeUser.contract_hours_week"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              v-if="showBranchSelect"
              label-size="sm"
              label-cols="4"
              :label="$trans('Branch')"
              label-for="employee_branch"
            >
              <BFormSelect
                id="employee_branch"
                v-model="employeeUser.branch"
                :options="branchOptions"
                size="sm"
              ></BFormSelect>
            </BFormGroup>

            <BFormGroup
              v-else-if="hasBranches && isBranchEmployee && myBranchName"
              label-size="sm"
              label-cols="4"
              :label="$trans('Branch')"
              label-for="employee_branch"
            >
              <BFormInput
                id="employee_branch"
                :model-value="myBranchName"
                readonly
              />
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
  companyBranchListOptions,
  companyBranchMyRetrieveOptions,
  companyEmployeeuserCreateMutation,
  companyEmployeeuserListQueryKey,
  companyEmployeeuserPartialUpdateMutation,
  companyEmployeeuserRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { EmployeeUser } from '@/api/types.gen'
import { useAuthStore } from '@/features/auth'
import { useMainStore } from '@/stores/main'
import {
  emptyEmployeeUser,
  FIELD_MESSAGES,
  parseEmployeeUserForm,
  USERNAME_TAKEN_MESSAGE,
  validateEmployeeUserForm,
  type EmployeeUserFieldErrors,
  type EmployeeUserFormValues,
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
const authStore = useAuthStore()
const mainStore = useMainStore()
const {create} = useToast()

const isCreate = computed(() => !props.pk)
const employeeUserId = computed(() => Number(props.pk))

const isBranchEmployee = computed(() => authStore.isBranchEmployee)
const hasBranches = computed(() => mainStore.getMemberHasBranches)

// The legacy form offered the branch picker to office users of a branched
// tenant, showed a branch employee their own branch read-only, and nothing
// otherwise.
const showBranchSelect = computed(() => hasBranches.value && !isBranchEmployee.value)

const detailQuery = useQuery(() => ({
  ...companyEmployeeuserRetrieveOptions({path: {id: employeeUserId.value}}),
  enabled: !isCreate.value,
}))

watch(
  () => detailQuery.error.value,
  (error) => {
    if (error) errorToast(create, $trans('Error loading employee'))
  },
)

// The legacy form listed the first page of branches for the picker; the
// converted picker reads the same generated list query.
const branchListQuery = useQuery(() => ({
  ...companyBranchListOptions(),
  enabled: showBranchSelect.value,
}))

const branchOptions = computed(() => [
  {value: null, text: '-'},
  ...(branchListQuery.data.value?.results ?? []).map((branch) => ({
    value: branch.id,
    text: `${branch.name} - ${branch.city}`,
  })),
])

// A branch employee may only file colleagues under their own branch: the
// legacy form fetched it for display and pinned its id on submit.
const myBranchQuery = useQuery(() => ({
  ...companyBranchMyRetrieveOptions(),
  enabled: isBranchEmployee.value,
}))

const myBranchName = computed(() => myBranchQuery.data.value?.name ?? '')

const employeeUser = ref<EmployeeUserFormValues>(emptyEmployeeUser())

const originalUsername = ref<string | null>(null)

function employeeUserFromRecord(record: EmployeeUser): EmployeeUserFormValues {
  return {
    username: record.username,
    first_name: record.first_name ?? '',
    last_name: record.last_name ?? '',
    email: record.email ?? '',
    password1: '',
    password2: '',
    uses_time_registration: record.employee_user?.uses_time_registration ?? true,
    contract_hours_week: record.employee_user?.contract_hours_week ?? '0.00',
    branch: record.employee_user?.branch ?? null,
  }
}

watch(
  () => detailQuery.data.value,
  (data) => {
    if (!data) return
    originalUsername.value = data.username
    employeeUser.value = employeeUserFromRecord(data)
  },
  {immediate: true},
)

const errors = ref<EmployeeUserFieldErrors>({})
const submitClicked = ref(false)
const saving = ref(false)

const probe = useUsernameProbe(
  () => employeeUser.value.username,
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
  ...companyEmployeeuserCreateMutation(),
  onSuccess: async () => {
    infoToast(create, $trans('Created'), $trans('employee has been created'))
    await queryClient.invalidateQueries({queryKey: companyEmployeeuserListQueryKey()})
    router.go(-1)
  },
  onError: () => {
    errorToast(create, $trans('Error creating employee'))
  },
})

const updateMutation = useMutation({
  ...companyEmployeeuserPartialUpdateMutation(),
  onSuccess: async () => {
    infoToast(create, $trans('Updated'), $trans('employee has been updated'))
    await queryClient.invalidateQueries({queryKey: companyEmployeeuserListQueryKey()})
    router.go(-1)
  },
  onError: () => {
    errorToast(create, $trans('Error updating employee'))
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

    if (isBranchEmployee.value && myBranchQuery.data.value) {
      employeeUser.value.branch = myBranchQuery.data.value.id
    }

    const found = validateEmployeeUserForm(employeeUser.value, {isCreate: isCreate.value})
    errors.value = found
    if (Object.keys(found).length > 0) return

    await probe.waitForProbe()

    if (employeeUser.value.username !== originalUsername.value && probe.state.value === 'taken') {
      errors.value.username = USERNAME_TAKEN_MESSAGE()
      return
    }

    try {
      if (isCreate.value) {
        await saveMutation.mutateAsync({
          body: parseEmployeeUserForm(employeeUser.value, {isCreate: true}),
        })
      } else {
        const password = employeeUser.value.password1 !== ''
          ? employeeUser.value.password1
          : undefined
        await updateMutation.mutateAsync({
          path: {id: employeeUserId.value},
          body: parseEmployeeUserForm(employeeUser.value, {isCreate: false, password}),
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
