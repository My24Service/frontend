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
            <UserIdentityPanel
              v-model:values="employeeUser"
              :errors="errors"
              :submitClicked="submitClicked"
              :probeState="probe.state.value"
              :takenMessage="USERNAME_TAKEN_MESSAGE"
              :fieldMessages="FIELD_MESSAGES"
              idPrefix="employee"
            />
          </div>

          <div class="panel">
            <h6>{{ $trans('personal details') }}</h6>
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
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import * as v from 'valibot'

import {
  companyBranchListOptions,
  companyBranchMyRetrieveOptions,
  companyEmployeeuserCreateMutation,
  companyEmployeeuserListQueryKey,
  companyEmployeeuserPartialUpdateMutation,
  companyEmployeeuserRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { EmployeeUser } from '@/api/types.gen'
import { vEmployeeUserRequestWritable } from '@/api/valibot.gen'
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
import { useUserForm } from '../use-user-form'
import UserIdentityPanel from '../UserIdentityPanel.vue'
import { $trans } from '@/services/i18n'

const props = withDefaults(defineProps<{
  pk?: string | number | null
}>(), {
  pk: null,
})

const authStore = useAuthStore()
const mainStore = useMainStore()

const isBranchEmployee = computed(() => authStore.isBranchEmployee)
const hasBranches = computed(() => mainStore.getMemberHasBranches)

// The legacy form offered the branch picker to office users of a branched
// tenant, showed a branch employee their own branch read-only, and nothing
// otherwise.
const showBranchSelect = computed(() => hasBranches.value && !isBranchEmployee.value)

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

function employeeUserFromRecord(record: EmployeeUser): EmployeeUserFormValues {
  return {
    username: record.username,
    first_name: record.first_name ?? '',
    last_name: record.last_name ?? '',
    email: record.email ?? '',
    password1: '',
    password2: '',
    contract_hours_week: record.employee_user?.contract_hours_week ?? '0.00',
    branch: record.employee_user?.branch ?? null,
  }
}

const form = useUserForm<EmployeeUserFormValues, EmployeeUser, v.InferOutput<typeof vEmployeeUserRequestWritable>, EmployeeUserFieldErrors>({
  pk: () => props.pk,
  retrieve: (id) => companyEmployeeuserRetrieveOptions({path: {id}}),
  create: companyEmployeeuserCreateMutation(),
  update: companyEmployeeuserPartialUpdateMutation(),
  invalidate: (queryClient) => queryClient.invalidateQueries({queryKey: companyEmployeeuserListQueryKey()}),
  empty: emptyEmployeeUser,
  fromRecord: employeeUserFromRecord,
  validate: validateEmployeeUserForm,
  parse: parseEmployeeUserForm,
  takenMessage: USERNAME_TAKEN_MESSAGE,
  // A branch employee files under their own branch: pin its id before
  // validation, as the legacy submit did before validating.
  prepare: (values) => {
    if (isBranchEmployee.value && myBranchQuery.data.value) {
      values.branch = myBranchQuery.data.value.id
    }
  },
  copy: {
    fetchError: $trans('Error loading employee'),
    created: $trans('Created'),
    createdDetail: $trans('employee has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('employee has been updated'),
    createError: $trans('Error creating employee'),
    updateError: $trans('Error updating employee'),
  },
})

const employeeUser = form.values
const {errors, submitClicked, isLoading, buttonDisabled, isCreate, probe, submitForm, cancelForm} = form


</script>
