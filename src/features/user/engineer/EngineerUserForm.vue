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
            <UserIdentityPanel
              v-model:values="identity"
              :errors="errors"
              :submitClicked="submitClicked"
              :probeState="probe.state.value"
              :takenMessage="USERNAME_TAKEN_MESSAGE"
              :fieldMessages="FIELD_MESSAGES"
              idPrefix="engineer"
            />
          </div>

          <div class="panel">
            <h6>{{ $trans('Personal details')}}</h6>
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'
import type Dinero from 'dinero.js'
import * as v from 'valibot'

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
import { vEngineerRequestWritable } from '@/api/valibot.gen'
import PriceInput from '@/components/PriceInput.vue'
// The stock-location endpoints declare a required `Authorization` header the
// request validator checks before the axios interceptor sets the real one.
import { SESSION_AUTH_HEADER } from '@/features/shared/session-auth-header'
import { useMainStore } from '@/stores/main'
import {
  emptyEngineerUser,
  FIELD_MESSAGES,
  payloadOf,
  USERNAME_TAKEN_MESSAGE,
  type EngineerUserFieldErrors,
  type EngineerUserFormValues,
} from './schemas'
import { useUserForm } from '../use-user-form'
import UserIdentityPanel, { type UserIdentityPanelValues } from '../UserIdentityPanel.vue'
import { errorToast, $trans } from '@/services/i18n'

const props = withDefaults(defineProps<{
  pk?: string | number | null
}>(), {
  pk: null,
})

const mainStore = useMainStore()
const queryClient = useQueryClient()
const {create} = useToast()

// `EngineerUserFormValues` is an interface, which carries no implicit index
// signature — the wrapper constrains its values to `Record<string, unknown>`
// and the panel models its values with one. The mapped copy keeps every
// field while satisfying both; `empty`/`fromRecord` still return the
// interface, which stays assignable back field by field.
type EngineerUserValues = Omit<EngineerUserFormValues, never>

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

const form = useUserForm<EngineerUserValues, Engineer, v.InferOutput<typeof vEngineerRequestWritable>, EngineerUserFieldErrors>({
  pk: () => props.pk,
  retrieve: (id) => companyEngineerRetrieveOptions({path: {id}}),
  create: companyEngineerCreateMutation(),
  update: companyEngineerPartialUpdateMutation(),
  invalidate: (queryClient) => queryClient.invalidateQueries({queryKey: companyEngineerListQueryKey()}),
  empty: emptyEngineerUser,
  fromRecord: engineerUserFromRecord,
  payloadOf,
  schema: vEngineerRequestWritable,
  fieldMessages: FIELD_MESSAGES,
  takenMessage: USERNAME_TAKEN_MESSAGE,
  copy: {
    fetchError: $trans('Error loading engineer'),
    created: $trans('Created'),
    createdDetail: $trans('Engineer has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Engineer has been updated'),
    createError: $trans('Error creating engineer'),
    updateError: $trans('Error updating engineer'),
  },
})

const engineer = form.values
const {errors, submitClicked, buttonDisabled, isCreate, probe, submitForm, cancelForm} = form

// The identity slice the panel edits. A whole-object bridge rather than the
// values ref itself: the panel's model makes the personal rows optional (api
// users omit them), so its update payload is not assignable back to the full
// form values — the bridge accepts it and merges it in place, keeping the
// ref the extras below bind to stable.
const identity = computed<UserIdentityPanelValues>({
  get: () => engineer.value,
  set: (next) => { Object.assign(engineer.value, next) },
})

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

const isLoading = computed(() =>
  form.isLoading.value ||
  locationsQuery.isLoading.value ||
  createLocationMutation.isPending.value,
)
</script>
