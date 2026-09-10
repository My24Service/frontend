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
            <BFormGroup
              label-cols="4"
              :label="$trans('Username')"
              label-for="salesuser_username"
            >
              <BFormInput
                id="salesuser_username"
                size="sm"
                v-model="salesUser.username"
                :state="usernameValidationState"
              ></BFormInput>
              <b-form-invalid-feedback
                id="salesuser_username-required-feedback"
                :state="false">
                {{ errors.username }}
              </b-form-invalid-feedback>
              <b-form-invalid-feedback
                id="salesuser_username-taken-feedback"
                v-if="usernameTakenVisible"
                :state="false">
                {{ USERNAME_TAKEN_MESSAGE() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-cols="4"
              :label="$trans('Password')"
              label-for="salesuser_password"
            >
              <BFormInput
                id="salesuser_password"
                size="sm"
                type="password"
                v-model="salesUser.password1"
                :state="submitClicked ? !errors.password1 : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="salesuser_password-feedback"
                :state="submitClicked ? !errors.password1 : null">
                {{ errors.password1 || FIELD_MESSAGES.password1() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-cols="4"
              :label="$trans('Confirm password')"
              label-for="salesuser_password_again"
            >
              <BFormInput
                id="salesuser_password_again"
                size="sm"
                type="password"
                v-model="salesUser.password2"
                :state="submitClicked ? !errors.password2 : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="salesuser_password_again-feedback"
                :state="submitClicked ? !errors.password2 : null">
                {{ errors.password2 || FIELD_MESSAGES.password2() }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </div>

          <div class="panel">
            <h6>{{ $trans('Personal details')}}</h6>
            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('First name')"
              label-for="salesuser_first_name"
            >
              <BFormInput
                id="salesuser_first_name"
                size="sm"
                v-model="salesUser.first_name"
                :state="submitClicked ? !errors.first_name : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="salesuser_first_name-feedback"
                :state="submitClicked ? !errors.first_name : null">
                {{ errors.first_name || FIELD_MESSAGES.first_name() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Last name')"
              label-for="salesuser_last_name"
            >
              <BFormInput
                id="salesuser_last_name"
                size="sm"
                v-model="salesUser.last_name"
                :state="submitClicked ? !errors.last_name : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="salesuser_last_name-feedback"
                :state="submitClicked ? !errors.last_name : null">
                {{ errors.last_name || FIELD_MESSAGES.last_name() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Email address')"
              label-for="salesuser_email"
            >
              <BFormInput
                id="salesuser_email"
                size="sm"
                v-model="salesUser.email"
                :state="submitClicked ? !errors.email : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="salesuser_email-feedback"
                :state="submitClicked ? !errors.email : null">
                {{ errors.email || FIELD_MESSAGES.email() }}
              </b-form-invalid-feedback>
            </BFormGroup>
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
                v-model="salesUser.contract_hours_week"
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
                v-model="salesUser.uses_time_registration"
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
  companySalesuserCreateMutation,
  companySalesuserListQueryKey,
  companySalesuserPartialUpdateMutation,
  companySalesuserRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { SalesUser } from '@/api/types.gen'
import {
  emptySalesUser,
  FIELD_MESSAGES,
  parseSalesUserForm,
  USERNAME_TAKEN_MESSAGE,
  validateSalesUserForm,
  type SalesUserFieldErrors,
  type SalesUserFormValues,
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
const salesUserId = computed(() => Number(props.pk))

const detailQuery = useQuery(() => ({
  ...companySalesuserRetrieveOptions({path: {id: salesUserId.value}}),
  enabled: !isCreate.value,
}))

watch(
  () => detailQuery.error.value,
  (error) => {
    if (error) errorToast(create, $trans('Error loading sales user'))
  },
)

const salesUser = ref<SalesUserFormValues>(emptySalesUser())

const originalUsername = ref<string | null>(null)

function salesUserFromRecord(record: SalesUser): SalesUserFormValues {
  return {
    username: record.username,
    first_name: record.first_name ?? '',
    last_name: record.last_name ?? '',
    email: record.email ?? '',
    password1: '',
    password2: '',
    uses_time_registration: record.sales_user?.uses_time_registration ?? false,
    contract_hours_week: record.sales_user?.contract_hours_week ?? '0.00',
    ...(record.sales_user && 'uuid' in record.sales_user
      ? {uuid: (record.sales_user as {uuid?: string}).uuid}
      : {}),
  }
}

watch(
  () => detailQuery.data.value,
  (data) => {
    if (!data) return
    originalUsername.value = data.username
    salesUser.value = salesUserFromRecord(data)
  },
  {immediate: true},
)

const errors = ref<SalesUserFieldErrors>({})
const submitClicked = ref(false)
const saving = ref(false)

const probe = useUsernameProbe(
  () => salesUser.value.username,
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
  ...companySalesuserCreateMutation(),
  onSuccess: async () => {
    infoToast(create, $trans('Created'), $trans('sales user has been created'))
    await queryClient.invalidateQueries({queryKey: companySalesuserListQueryKey()})
    router.go(-1)
  },
  onError: () => {
    errorToast(create, $trans('Error creating sales user'))
  },
})

const updateMutation = useMutation({
  ...companySalesuserPartialUpdateMutation(),
  onSuccess: async () => {
    infoToast(create, $trans('Updated'), $trans('sales user has been updated'))
    await queryClient.invalidateQueries({queryKey: companySalesuserListQueryKey()})
    router.go(-1)
  },
  onError: () => {
    errorToast(create, $trans('Error updating sales user'))
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

    const found = validateSalesUserForm(salesUser.value, {isCreate: isCreate.value})
    errors.value = found
    if (Object.keys(found).length > 0) return

    await probe.waitForProbe()

    if (salesUser.value.username !== originalUsername.value && probe.state.value === 'taken') {
      errors.value.username = USERNAME_TAKEN_MESSAGE()
      return
    }

    try {
      if (isCreate.value) {
        await saveMutation.mutateAsync({
          body: parseSalesUserForm(salesUser.value, {isCreate: true}),
        })
      } else {
        const password = salesUser.value.password1 !== ''
          ? salesUser.value.password1
          : undefined
        await updateMutation.mutateAsync({
          path: {id: salesUserId.value},
          body: parseSalesUserForm(salesUser.value, {isCreate: false, password}),
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
