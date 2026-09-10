<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
      <header>
        <div class="page-title">
          <h3>
            <IBiPeople></IBiPeople>
            <span class="backlink" @click="cancelForm">{{ $trans("People") }}</span> /
            <strong> {{ apiUser.username }}</strong>
            <span class="dimmed" v-if="isCreate && !apiUser.username">{{ $trans('new') }}</span>
            <span class="dimmed" v-if="!isCreate && !apiUser.username">{{ $trans('edit') }}</span>
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
              label-for="apiuser_username"
            >
              <BFormInput
                id="apiuser_username"
                size="sm"
                v-model="apiUser.username"
                :state="usernameValidationState"
              ></BFormInput>
              <b-form-invalid-feedback
                id="apiuser_username-required-feedback"
                :state="false">
                {{ errors.username }}
              </b-form-invalid-feedback>
              <b-form-invalid-feedback
                id="apiuser_username-taken-feedback"
                v-if="usernameTakenVisible"
                :state="false">
                {{ USERNAME_TAKEN_MESSAGE() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-cols="4"
              :label="$trans('Password')"
              label-for="apiuser_password"
            >
              <BFormInput
                id="apiuser_password"
                size="sm"
                type="password"
                v-model="apiUser.password1"
                :state="submitClicked ? !errors.password1 : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="apiuser_password-feedback"
                :state="submitClicked ? !errors.password1 : null">
                {{ errors.password1 || FIELD_MESSAGES.password1() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-cols="4"
              :label="$trans('Password again')"
              label-for="apiuser_password_again"
            >
              <BFormInput
                id="apiuser_password_again"
                size="sm"
                type="password"
                v-model="apiUser.password2"
                :state="submitClicked ? !errors.password2 : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="apiuser_password_again-feedback"
                :state="submitClicked ? !errors.password2 : null">
                {{ errors.password2 || FIELD_MESSAGES.password2() }}
              </b-form-invalid-feedback>
            </BFormGroup>
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
                :state="submitClicked ? !errors.name : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="apiuser_name-feedback"
                :state="submitClicked ? !errors.name : null">
                {{ errors.name || FIELD_MESSAGES.name() }}
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
                :state="submitClicked ? !errors.expire_start_dt : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="apiuser_expire_start_dt-feedback"
                :state="submitClicked ? !errors.expire_start_dt : null">
                {{ errors.expire_start_dt || FIELD_MESSAGES.expire_start_dt() }}
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
                :state="submitClicked ? !errors.expire_in_days : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="apiuser_expire_in_days-feedback"
                :state="submitClicked ? !errors.expire_in_days : null">
                {{ errors.expire_in_days || FIELD_MESSAGES.expire_in_days() }}
              </b-form-invalid-feedback>
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
  companyApiuserCreateMutation,
  companyApiuserListQueryKey,
  companyApiuserPartialUpdateMutation,
  companyApiuserRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { ApiUser } from '@/api/types.gen'
import {
  emptyApiUser,
  FIELD_MESSAGES,
  parseApiUserForm,
  USERNAME_TAKEN_MESSAGE,
  validateApiUserForm,
  type ApiUserFieldErrors,
  type ApiUserFormValues,
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
const apiUserId = computed(() => Number(props.pk))

const detailQuery = useQuery(() => ({
  ...companyApiuserRetrieveOptions({path: {id: apiUserId.value}}),
  enabled: !isCreate.value,
}))

watch(
  () => detailQuery.error.value,
  (error) => {
    if (error) errorToast(create, $trans('Error loading API user'))
  },
)

const apiUser = ref<ApiUserFormValues>(emptyApiUser())

const originalUsername = ref<string | null>(null)

function apiUserFromRecord(record: ApiUser): ApiUserFormValues {
  return {
    username: record.username,
    password1: '',
    password2: '',
    name: record.api_user?.name ?? '',
    // The wire carries a timestamp; the date input takes the day part.
    expire_start_dt: record.api_user?.expire_start_dt?.slice(0, 10) ?? '',
    expire_in_days: record.api_user?.expire_in_days ?? 365,
  }
}

watch(
  () => detailQuery.data.value,
  (data) => {
    if (!data) return
    originalUsername.value = data.username
    apiUser.value = apiUserFromRecord(data)
  },
  {immediate: true},
)

const errors = ref<ApiUserFieldErrors>({})
const submitClicked = ref(false)
const saving = ref(false)

// The legacy form validated username uniqueness in both modes (the async
// `isUnique` vuelidate rule over `usernameExists`), so the shared debounced
// probe applies here unchanged.
const probe = useUsernameProbe(
  () => apiUser.value.username,
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
  ...companyApiuserCreateMutation(),
  onSuccess: async () => {
    infoToast(create, $trans('Created'), $trans('API user has been created'))
    await queryClient.invalidateQueries({queryKey: companyApiuserListQueryKey()})
    router.go(-1)
  },
  onError: () => {
    errorToast(create, $trans('Error creating API user'))
  },
})

const updateMutation = useMutation({
  ...companyApiuserPartialUpdateMutation(),
  onSuccess: async () => {
    infoToast(create, $trans('Updated'), $trans('API user has been updated'))
    await queryClient.invalidateQueries({queryKey: companyApiuserListQueryKey()})
    router.go(-1)
  },
  onError: () => {
    errorToast(create, $trans('Error updating API user'))
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

    const found = validateApiUserForm(apiUser.value, {isCreate: isCreate.value})
    errors.value = found
    if (Object.keys(found).length > 0) return

    await probe.waitForProbe()

    if (apiUser.value.username !== originalUsername.value && probe.state.value === 'taken') {
      errors.value.username = USERNAME_TAKEN_MESSAGE()
      return
    }

    try {
      if (isCreate.value) {
        await saveMutation.mutateAsync({
          body: parseApiUserForm(apiUser.value, {isCreate: true}),
        })
      } else {
        const password = apiUser.value.password1 !== ''
          ? apiUser.value.password1
          : undefined
        await updateMutation.mutateAsync({
          path: {id: apiUserId.value},
          body: parseApiUserForm(apiUser.value, {isCreate: false, password}),
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
