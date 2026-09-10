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
            <BFormGroup
              label-cols="4"
              :label="$trans('Username')"
              label-for="planninguser_username"
            >
              <BFormInput
                id="planninguser_username"
                size="sm"
                v-model="planningUser.username"
                :state="usernameValidationState"
              ></BFormInput>
              <b-form-invalid-feedback
                id="planninguser_username-required-feedback"
                :state="false">
                {{ errors.username }}
              </b-form-invalid-feedback>
              <b-form-invalid-feedback
                id="planninguser_username-taken-feedback"
                v-if="usernameTakenVisible"
                :state="false">
                {{ USERNAME_TAKEN_MESSAGE() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-cols="4"
              :label="$trans('Password')"
              label-for="planninguser_password"
            >
              <BFormInput
                id="planninguser_password"
                size="sm"
                type="password"
                v-model="planningUser.password1"
                :state="submitClicked ? !errors.password1 : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="planninguser_password-feedback"
                :state="submitClicked ? !errors.password1 : null">
                {{ errors.password1 || FIELD_MESSAGES.password1() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-cols="4"
              :label="$trans('Password again')"
              label-for="planninguser_password_again"
            >
              <BFormInput
                id="planninguser_password_again"
                size="sm"
                type="password"
                v-model="planningUser.password2"
                :state="submitClicked ? !errors.password2 : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="planninguser_password_again-feedback"
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
              label-for="planninguser_first_name"
            >
              <BFormInput
                id="planninguser_first_name"
                size="sm"
                v-model="planningUser.first_name"
                :state="submitClicked ? !errors.first_name : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="planninguser_first_name-feedback"
                :state="submitClicked ? !errors.first_name : null">
                {{ errors.first_name || FIELD_MESSAGES.first_name() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Last name')"
              label-for="planninguser_last_name"
            >
              <BFormInput
                id="planninguser_last_name"
                size="sm"
                v-model="planningUser.last_name"
                :state="submitClicked ? !errors.last_name : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="planninguser_last_name-feedback"
                :state="submitClicked ? !errors.last_name : null">
                {{ errors.last_name || FIELD_MESSAGES.last_name() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Email')"
              label-for="planninguser_email"
            >
              <BFormInput
                id="planninguser_email"
                size="sm"
                v-model="planningUser.email"
                :state="submitClicked ? !errors.email : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="planninguser_email-feedback"
                :state="submitClicked ? !errors.email : null">
                {{ errors.email || FIELD_MESSAGES.email() }}
              </b-form-invalid-feedback>
            </BFormGroup>
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
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'

import {
  companyPlanninguserCreateMutation,
  companyPlanninguserListQueryKey,
  companyPlanninguserPartialUpdateMutation,
  companyPlanninguserRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { PlanningUser } from '@/api/types.gen'
import {
  emptyPlanningUser,
  FIELD_MESSAGES,
  parsePlanningUserForm,
  USERNAME_TAKEN_MESSAGE,
  validatePlanningUserForm,
  type PlanningUserFieldErrors,
  type PlanningUserFormValues,
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
const planningUserId = computed(() => Number(props.pk))

const detailQuery = useQuery(() => ({
  ...companyPlanninguserRetrieveOptions({path: {id: planningUserId.value}}),
  enabled: !isCreate.value,
}))

watch(
  () => detailQuery.error.value,
  (error) => {
    if (error) errorToast(create, $trans('Error loading planning user'))
  },
)

const planningUser = ref<PlanningUserFormValues>(emptyPlanningUser())

const originalUsername = ref<string | null>(null)

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

watch(
  () => detailQuery.data.value,
  (data) => {
    if (!data) return
    originalUsername.value = data.username
    planningUser.value = planningUserFromRecord(data)
  },
  {immediate: true},
)

const errors = ref<PlanningUserFieldErrors>({})
const submitClicked = ref(false)
const saving = ref(false)

const probe = useUsernameProbe(
  () => planningUser.value.username,
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
  ...companyPlanninguserCreateMutation(),
  onSuccess: async () => {
    infoToast(create, $trans('Created'), $trans('planning user has been created'))
    await queryClient.invalidateQueries({queryKey: companyPlanninguserListQueryKey()})
    router.go(-1)
  },
  onError: () => {
    errorToast(create, $trans('Error creating planning user'))
  },
})

const updateMutation = useMutation({
  ...companyPlanninguserPartialUpdateMutation(),
  onSuccess: async () => {
    infoToast(create, $trans('Updated'), $trans('planning user has been updated'))
    await queryClient.invalidateQueries({queryKey: companyPlanninguserListQueryKey()})
    router.go(-1)
  },
  onError: () => {
    errorToast(create, $trans('Error updating planning user'))
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

    const found = validatePlanningUserForm(planningUser.value, {isCreate: isCreate.value})
    errors.value = found
    if (Object.keys(found).length > 0) return

    await probe.waitForProbe()

    if (planningUser.value.username !== originalUsername.value && probe.state.value === 'taken') {
      errors.value.username = USERNAME_TAKEN_MESSAGE()
      return
    }

    try {
      if (isCreate.value) {
        await saveMutation.mutateAsync({
          body: parsePlanningUserForm(planningUser.value, {isCreate: true}),
        })
      } else {
        const password = planningUser.value.password1 !== ''
          ? planningUser.value.password1
          : undefined
        await updateMutation.mutateAsync({
          path: {id: planningUserId.value},
          body: parsePlanningUserForm(planningUser.value, {isCreate: false, password}),
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
