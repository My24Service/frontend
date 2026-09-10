<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
      <header>
        <div class="page-title">
          <h3>
            <IBiPeople></IBiPeople>
            <span class="backlink" @click="cancelForm">{{ $trans("People") }}</span> /
            <strong> {{ customerUser.username }}</strong>
            <span class="dimmed" v-if="isCreate && !customerUser.username">{{ $trans('new') }}</span>
            <span class="dimmed" v-if="!isCreate && !customerUser.username">{{ $trans('edit') }}</span>
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
              label-for="customeruser_username"
            >
              <BFormInput
                id="customeruser_username"
                size="sm"
                v-model="customerUser.username"
                :state="usernameValidationState"
              ></BFormInput>
              <b-form-invalid-feedback
                id="customeruser_username-required-feedback"
                :state="false">
                {{ errors.username }}
              </b-form-invalid-feedback>
              <b-form-invalid-feedback
                id="customeruser_username-taken-feedback"
                v-if="usernameTakenVisible"
                :state="false">
                {{ USERNAME_TAKEN_MESSAGE() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Password')"
              label-for="customeruser_password"
            >
              <BFormInput
                id="customeruser_password"
                size="sm"
                type="password"
                v-model="customerUser.password1"
                :state="submitClicked ? !errors.password1 : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="customeruser_password-feedback"
                :state="submitClicked ? !errors.password1 : null">
                {{ errors.password1 || FIELD_MESSAGES.password1() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Password again')"
              label-for="customeruser_password_again"
            >
              <BFormInput
                id="customeruser_password_again"
                size="sm"
                type="password"
                v-model="customerUser.password2"
                :state="submitClicked ? !errors.password2 : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="customeruser_password_again-feedback"
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
              label-for="customeruser_first_name"
            >
              <BFormInput
                id="customeruser_first_name"
                size="sm"
                v-model="customerUser.first_name"
                :state="submitClicked ? !errors.first_name : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="customeruser_first_name-feedback"
                :state="submitClicked ? !errors.first_name : null">
                {{ errors.first_name || FIELD_MESSAGES.first_name() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Last name')"
              label-for="customeruser_last_name"
            >
              <BFormInput
                id="customeruser_last_name"
                size="sm"
                v-model="customerUser.last_name"
                :state="submitClicked ? !errors.last_name : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="customeruser_last_name-feedback"
                :state="submitClicked ? !errors.last_name : null">
                {{ errors.last_name || FIELD_MESSAGES.last_name() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Email')"
              label-for="customeruser_email"
            >
              <BFormInput
                id="customeruser_email"
                size="sm"
                v-model="customerUser.email"
                :state="submitClicked ? !errors.email : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="customeruser_email-feedback"
                :state="submitClicked ? !errors.email : null">
                {{ errors.email || FIELD_MESSAGES.email() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Settings group')"
              label-for="customeruser_settings_group"
            >
              <BFormInput
                id="customeruser_settings_group"
                size="sm"
                v-model="customerUser.settings_group"
              ></BFormInput>
            </BFormGroup>
          </div>

          <div class="panel col-1-3">
            <h6>{{ $trans('Customer') }}</h6>
            <div class="flex-columns">
              <BFormGroup
                label-size="sm"
                label=""
                label-for="customeruser_customer_search"
                class="inline"
              >
                <VueMultiselect
                  id="customeruser_customer_search"
                  track-by="id"
                  :placeholder="$trans('Type to search customer')"
                  open-direction="bottom"
                  :options="customerOptions"
                  :multiple="false"
                  :loading="customerSearchPending"
                  :internal-search="false"
                  :clear-on-select="true"
                  :close-on-select="true"
                  :options-limit="30"
                  :limit="10"
                  :max-height="600"
                  :show-no-results="false"
                  :hide-selected="true"
                  @search-change="customerSearchTerm = $event"
                  @select="selectCustomer"
                  :custom-label="customerLabel"
                >
                  <template #noResult>
                    {{ $trans('Oops! No elements found. Consider changing the search query.') }}
                  </template>
                </VueMultiselect>
              </BFormGroup>
              <BButton @click="clearCustomer" size="sm" type="button" variant="danger" :title="$trans('Clear customer')">
                <IBiBackspace></IBiBackspace>
              </BButton>
            </div>

            <br>
            <BFormGroup
              label-size="sm"
              label=""
              label-for="customeruser_customer"
            >
              <BFormInput
                id="customeruser_customer"
                size="sm"
                readonly
                v-model="customerInfo"
              ></BFormInput>
            </BFormGroup>
          </div>
        </div>
      </div>
    </div>
  </b-overlay>
</template>

<style scoped>
.form-group.inline {
  margin-bottom: 0;
}
</style>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { refDebounced } from '@vueuse/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'
import VueMultiselect from 'vue-multiselect'

import {
  companyCustomeruserCreateMutation,
  companyCustomeruserListQueryKey,
  companyCustomeruserPartialUpdateMutation,
  companyCustomeruserRetrieveOptions,
  customerCustomerAutocompleteListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { CustomerAutocomplete, CustomerUser } from '@/api/types.gen'
import {
  emptyCustomerUser,
  FIELD_MESSAGES,
  parseCustomerUserForm,
  USERNAME_TAKEN_MESSAGE,
  validateCustomerUserForm,
  type CustomerUserFieldErrors,
  type CustomerUserFormValues,
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
const customerUserId = computed(() => Number(props.pk))

const detailQuery = useQuery(() => ({
  ...companyCustomeruserRetrieveOptions({path: {id: customerUserId.value}}),
  enabled: !isCreate.value,
}))

watch(
  () => detailQuery.error.value,
  (error) => {
    if (error) errorToast(create, $trans('Error loading customer user'))
  },
)

const customerUser = ref<CustomerUserFormValues>(emptyCustomerUser())
const customerInfo = ref('')

const originalUsername = ref<string | null>(null)

function customerUserFromRecord(record: CustomerUser): { values: CustomerUserFormValues; info: string } {
  const values: CustomerUserFormValues = {
    username: record.username,
    first_name: record.first_name ?? '',
    last_name: record.last_name ?? '',
    email: record.email ?? '',
    password1: '',
    password2: '',
    customer: record.customer_user?.customer ?? null,
    settings_group: record.customer_user?.settings_group ?? '',
  }
  const details = record.customer_details
  const info = details && record.customer_user?.customer !== null
    ? `${details.name}, ${details.address}, ${details.city}`
    : ''
  return { values, info }
}

watch(
  () => detailQuery.data.value,
  (data) => {
    if (!data) return
    originalUsername.value = data.username
    const { values, info } = customerUserFromRecord(data)
    customerUser.value = values
    customerInfo.value = info
  },
  {immediate: true},
)

// The customer picker: debounced search term feeds the generated
// autocomplete query (same shape as the maintenance-contract customer
// picker); selecting an option pins the id and the display line, clearing
// nulls both again.
const customerSearchTerm = ref('')
const customerQueryTerm = refDebounced(customerSearchTerm, 500)

const customerSearchQuery = useQuery(() => ({
  ...customerCustomerAutocompleteListOptions({query: {q: customerQueryTerm.value}}),
  enabled: customerQueryTerm.value.length > 0,
}))

watch(
  () => customerSearchQuery.error.value,
  (error) => {
    if (error) errorToast(create, $trans('Error fetching customers'))
  },
)

const customerOptions = computed(() => customerSearchQuery.data.value ?? [])
const customerSearchPending = computed(() => customerSearchQuery.isFetching.value)

function customerLabel({ name, city }: { name?: string; city?: string }) {
  return `${name} - ${city}`
}

function selectCustomer(option: CustomerAutocomplete) {
  customerUser.value.customer = option.id
  customerInfo.value = `${option.name}, ${option.address}, ${option.city}`
}

function clearCustomer() {
  customerUser.value.customer = null
  customerInfo.value = ''
}

const errors = ref<CustomerUserFieldErrors>({})
const submitClicked = ref(false)
const saving = ref(false)

const probe = useUsernameProbe(
  () => customerUser.value.username,
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
  ...companyCustomeruserCreateMutation(),
  onSuccess: async () => {
    infoToast(create, $trans('Created'), $trans('Customer user has been created'))
    await queryClient.invalidateQueries({queryKey: companyCustomeruserListQueryKey()})
    router.go(-1)
  },
  onError: () => {
    errorToast(create, $trans('Error creating customer user'))
  },
})

const updateMutation = useMutation({
  ...companyCustomeruserPartialUpdateMutation(),
  onSuccess: async () => {
    infoToast(create, $trans('Updated'), $trans('Customer user has been updated'))
    await queryClient.invalidateQueries({queryKey: companyCustomeruserListQueryKey()})
    router.go(-1)
  },
  onError: () => {
    errorToast(create, $trans('Error updating customer user'))
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

    const found = validateCustomerUserForm(customerUser.value, {isCreate: isCreate.value})
    errors.value = found
    if (Object.keys(found).length > 0) return

    await probe.waitForProbe()

    if (customerUser.value.username !== originalUsername.value && probe.state.value === 'taken') {
      errors.value.username = USERNAME_TAKEN_MESSAGE()
      return
    }

    try {
      if (isCreate.value) {
        await saveMutation.mutateAsync({
          body: parseCustomerUserForm(customerUser.value, {isCreate: true}),
        })
      } else {
        const password = customerUser.value.password1 !== ''
          ? customerUser.value.password1
          : undefined
        await updateMutation.mutateAsync({
          path: {id: customerUserId.value},
          body: parseCustomerUserForm(customerUser.value, {isCreate: false, password}),
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
