<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
      <header>
        <div class="page-title">
          <h3>
            <IBiPeople></IBiPeople>
            <span class="backlink" @click="cancelForm">{{ $trans("People") }}</span> /
            <strong> {{ engineer.username }}</strong>
            <span class="dimmed" v-if="isCreate && !engineer.username">{{ $trans('new') }}</span>
            <span class="dimmed" v-if="!isCreate && !engineer.username">{{ $trans('edit') }}</span>
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
              label-for="engineer_username"
            >
              <BFormInput
                id="engineer_username"
                size="sm"
                v-model="engineer.username"
                :state="usernameValidationState"
              ></BFormInput>
              <b-form-invalid-feedback
                id="engineer_username-required-feedback"
                :state="false">
                {{ errors.username }}
              </b-form-invalid-feedback>
              <b-form-invalid-feedback
                id="engineer_username-taken-feedback"
                v-if="usernameTakenVisible"
                :state="false">
                {{ USERNAME_TAKEN_MESSAGE() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-cols="4"
              :label="$trans('Password')"
              label-for="engineer_password"
            >
              <BFormInput
                id="engineer_password"
                size="sm"
                type="password"
                v-model="engineer.password1"
                :state="submitClicked ? !errors.password1 : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="engineer_password-feedback"
                :state="submitClicked ? !errors.password1 : null">
                {{ errors.password1 || FIELD_MESSAGES.password1() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-cols="4"
              :label="$trans('Password again')"
              label-for="engineer_password_again"
            >
              <BFormInput
                id="engineer_password_again"
                size="sm"
                type="password"
                v-model="engineer.password2"
                :state="submitClicked ? !errors.password2 : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="engineer_password_again-feedback"
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
              label-for="engineer_first_name"
            >
              <BFormInput
                id="engineer_first_name"
                size="sm"
                v-model="engineer.first_name"
                :state="submitClicked ? !errors.first_name : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="engineer_first_name-feedback"
                :state="submitClicked ? !errors.first_name : null">
                {{ errors.first_name || FIELD_MESSAGES.first_name() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Last name')"
              label-for="engineer_last_name"
            >
              <BFormInput
                id="engineer_last_name"
                size="sm"
                v-model="engineer.last_name"
                :state="submitClicked ? !errors.last_name : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="engineer_last_name-feedback"
                :state="submitClicked ? !errors.last_name : null">
                {{ errors.last_name || FIELD_MESSAGES.last_name() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Email')"
              label-for="engineer_email"
            >
              <BFormInput
                id="engineer_email"
                size="sm"
                v-model="engineer.email"
                :state="submitClicked ? !errors.email : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="engineer_email-feedback"
                :state="submitClicked ? !errors.email : null">
                {{ errors.email || FIELD_MESSAGES.email() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Mobile phone')"
              label-for="engineer_mobile"
            >
              <BFormInput
                id="engineer_mobile"
                size="sm"
                v-model="engineer.mobile"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Address')"
              label-for="engineer_address"
            >
              <BFormInput
                id="engineer_address"
                size="sm"
                v-model="engineer.address"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Postal')"
              label-for="engineer_postal"
            >
              <BFormInput
                id="engineer_postal"
                size="sm"
                v-model="engineer.postal"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('City')"
              label-for="engineer_city"
            >
              <BFormInput
                id="engineer_city"
                size="sm"
                v-model="engineer.city"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Country')"
              label-for="engineer_country_code"
            >
              <BFormSelect
                id="engineer_country_code"
                v-model="engineer.country_code"
                :options="countries"
                size="sm"
              ></BFormSelect>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Passport')"
              label-for="engineer_passport"
            >
              <BFormInput
                id="engineer_passport"
                size="sm"
                v-model="engineer.passport"
              ></BFormInput>
            </BFormGroup>
          </div>

          <div class="panel">
            <h6>{{ $trans('Work info')}}</h6>
            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Email tablet')"
              label-for="engineer_email_tablet"
            >
              <BFormInput
                id="engineer_email_tablet"
                size="sm"
                v-model="engineer.email_tablet"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('License plate')"
              label-for="engineer_license_plate"
            >
              <BFormInput
                id="engineer_license_plate"
                size="sm"
                v-model="engineer.license_plate"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Contract hours per week')"
              label-for="engineer_contract_hours_week"
            >
              <BFormInput
                id="engineer_contract_hours_week"
                size="sm"
                v-model="engineer.contract_hours_week"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('VCA')"
              label-for="engineer_vca"
            >
              <BFormInput
                id="engineer_vca"
                size="sm"
                v-model="engineer.vca"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Cost price')"
              label-for="engineer_cost_price"
            >
              <BFormInput
                id="engineer_cost_price"
                size="sm"
                v-model="engineer.cost_price"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Hourly rate')"
              label-for="engineer_hourly_rate"
            >
              <PriceInput
                v-model="engineer.hourly_rate"
                :currency="engineer.hourly_rate_currency"
                @priceChanged="(dinero) => applyPrice(dinero)"
              />
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Preferred location')"
              label-for="engineer_preferred_location"
            >
              <BFormSelect
                id="engineer_preferred_location"
                v-model="engineer.preferred_location"
                :options="locations"
                size="sm"
                value-field="id"
                text-field="name"
              ></BFormSelect>
              <b-form-invalid-feedback
                id="engineer_preferred_location-feedback"
                :state="submitClicked ? !errors.preferred_location : null">
                {{ errors.preferred_location || FIELD_MESSAGES.preferred_location() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Or create new location')"
              label-for="engineer_preferred_location_new"
            >
              <div>
                <BFormInput
                  style="width: 140px !important; float:left !important;"
                  id="engineer_preferred_location_new"
                  size="sm"
                  v-model="newLocationName"
                ></BFormInput>
                <span style="float:left !important;">&nbsp;</span>
                <BButton
                  style="width: 60px !important;"
                  @click="createLocation"
                  :disabled="buttonCreateLocationDisabled"
                  type="button"
                  size="sm"
                  variant="primary">
                  {{ $trans('Create') }}</BButton>
              </div>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Hide from dispatch?')"
              label-for="engineer_hide_from_dispatch"
            >
              <div>
                <BFormCheckbox
                  id="engineer_hide_from_dispatch"
                  size="sm"
                  v-model="engineer.hide_from_dispatch"
                >
                </BFormCheckbox>
              </div>
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
import type Dinero from 'dinero.js'

import {
  companyEngineerCreateMutation,
  companyEngineerListQueryKey,
  companyEngineerPartialUpdateMutation,
  companyEngineerRetrieveOptions,
  inventoryStockLocationCreateMutation,
  inventoryStockLocationListOptions,
  inventoryStockLocationListQueryKey,
} from '@/api/@tanstack/vue-query.gen'
import type { Engineer } from '@/api/types.gen'
import PriceInput from '@/components/PriceInput.vue'
// The stock-location endpoints declare a required `Authorization` header the
// request validator checks before the axios interceptor sets the real one.
import { SESSION_AUTH_HEADER } from '@/features/shared/session-auth-header'
import { useMainStore } from '@/stores/main'
import {
  emptyEngineerUser,
  FIELD_MESSAGES,
  parseEngineerUserForm,
  USERNAME_TAKEN_MESSAGE,
  validateEngineerUserForm,
  type EngineerUserFieldErrors,
  type EngineerUserFormValues,
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
const mainStore = useMainStore()

const isCreate = computed(() => !props.pk)
const engineerUserId = computed(() => Number(props.pk))

const detailQuery = useQuery(() => ({
  ...companyEngineerRetrieveOptions({path: {id: engineerUserId.value}}),
  enabled: !isCreate.value,
}))

watch(
  () => detailQuery.error.value,
  (error) => {
    if (error) errorToast(create, $trans('Error loading engineer'))
  },
)

const engineer = ref<EngineerUserFormValues>(emptyEngineerUser())

const originalUsername = ref<string | null>(null)

function engineerUserFromRecord(record: Engineer): EngineerUserFormValues {
  return {
    username: record.username,
    first_name: record.first_name ?? '',
    last_name: record.last_name ?? '',
    email: record.email ?? '',
    password1: '',
    password2: '',
    mobile: record.engineer?.mobile ?? '',
    address: record.engineer?.address ?? '',
    postal: record.engineer?.postal ?? '',
    city: record.engineer?.city ?? '',
    country_code: record.engineer?.country_code ?? '',
    passport: record.engineer?.passport ?? '',
    email_tablet: record.engineer?.email_tablet ?? '',
    vca: record.engineer?.vca ?? '',
    cost_price: record.engineer?.cost_price ?? '',
    license_plate: record.engineer?.license_plate ?? '',
    contract_hours_week: record.engineer?.contract_hours_week ?? '',
    hourly_rate: record.engineer?.hourly_rate ?? '0.00',
    hourly_rate_currency: record.engineer?.hourly_rate_currency ?? 'EUR',
    preferred_location: record.engineer?.preferred_location ?? null,
    hide_from_dispatch: record.engineer?.hide_from_dispatch ?? false,
  }
}

watch(
  () => detailQuery.data.value,
  (data) => {
    if (!data) return
    originalUsername.value = data.username
    engineer.value = engineerUserFromRecord(data)
  },
  {immediate: true},
)

const countries = computed(() => mainStore.getCountries)

// The preferred-location picker: the legacy form drove
// `stockLocationModel.list()`; the converted picker feeds the generated
// stock-location list query. Creating a location posts through the generated
// mutation, then pins the new id — the legacy `createLocation` flow.
const locationsQuery = useQuery(() => ({
  ...inventoryStockLocationListOptions({headers: SESSION_AUTH_HEADER}),
}))

watch(
  () => locationsQuery.error.value,
  (error) => {
    if (error) errorToast(create, $trans('Error fetching locations'))
  },
)

const locations = computed(() => locationsQuery.data.value?.results ?? [])

const newLocationName = ref('')
const buttonCreateLocationDisabled = computed(
  () => newLocationName.value === '' || createLocationMutation.isPending.value,
)

const createLocationMutation = useMutation({
  ...inventoryStockLocationCreateMutation(),
  onSuccess: async (data) => {
    await queryClient.invalidateQueries({queryKey: inventoryStockLocationListQueryKey({headers: SESSION_AUTH_HEADER})})
    engineer.value.preferred_location = data.id
    newLocationName.value = ''
  },
  onError: () => {
    errorToast(create, $trans('Error creating new location'))
  },
})

async function createLocation() {
  if (newLocationName.value === '') return
  try {
    await createLocationMutation.mutateAsync({body: {name: newLocationName.value}, headers: SESSION_AUTH_HEADER})
  } catch {
    // The mutation's onError already told the user; staying on the form is
    // the contract, not a silent swallow.
  }
}

// The hourly rate rides the wire as a decimal string; the PriceInput speaks
// dinero. Same handoff as the customer form's `applyPrice`.
function applyPrice(dinero: Dinero.Dinero) {
  engineer.value.hourly_rate = dinero.toFormat('0.00')
}

const errors = ref<EngineerUserFieldErrors>({})
const submitClicked = ref(false)
const saving = ref(false)

const probe = useUsernameProbe(
  () => engineer.value.username,
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
  ...companyEngineerCreateMutation(),
  onSuccess: async () => {
    infoToast(create, $trans('Created'), $trans('Engineer has been created'))
    await queryClient.invalidateQueries({queryKey: companyEngineerListQueryKey()})
    router.go(-1)
  },
  onError: () => {
    errorToast(create, $trans('Error creating engineer'))
  },
})

const updateMutation = useMutation({
  ...companyEngineerPartialUpdateMutation(),
  onSuccess: async () => {
    infoToast(create, $trans('Updated'), $trans('Engineer has been updated'))
    await queryClient.invalidateQueries({queryKey: companyEngineerListQueryKey()})
    router.go(-1)
  },
  onError: () => {
    errorToast(create, $trans('Error updating engineer'))
  },
})

const isLoading = computed(() =>
  detailQuery.isLoading.value ||
  locationsQuery.isLoading.value ||
  createLocationMutation.isPending.value ||
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

    const found = validateEngineerUserForm(engineer.value, {isCreate: isCreate.value})
    errors.value = found
    if (Object.keys(found).length > 0) return

    await probe.waitForProbe()

    if (engineer.value.username !== originalUsername.value && probe.state.value === 'taken') {
      errors.value.username = USERNAME_TAKEN_MESSAGE()
      return
    }

    try {
      if (isCreate.value) {
        await saveMutation.mutateAsync({
          body: parseEngineerUserForm(engineer.value, {isCreate: true}),
        })
      } else {
        const password = engineer.value.password1 !== ''
          ? engineer.value.password1
          : undefined
        await updateMutation.mutateAsync({
          path: {id: engineerUserId.value},
          body: parseEngineerUserForm(engineer.value, {isCreate: false, password}),
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
