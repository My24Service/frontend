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
              v-model:values="engineer"
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
                v-model="engineer.engineer.mobile"
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
                v-model="engineer.engineer.address"
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
                v-model="engineer.engineer.postal"
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
                v-model="engineer.engineer.city"
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
                v-model="engineer.engineer.country_code"
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
                v-model="engineer.engineer.passport"
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
                v-model="engineer.engineer.email_tablet"
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
                v-model="engineer.engineer.license_plate"
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
                v-model="engineer.engineer.contract_hours_week"
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
                v-model="engineer.engineer.vca"
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
                v-model="engineer.engineer.cost_price"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Hourly rate')"
              label-for="engineer_hourly_rate"
            >
              <PriceInput
                v-model="engineer.engineer.hourly_rate"
                :currency="hourlyRateCurrency"
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
                v-model="engineer.engineer.preferred_location"
                :options="locations"
                size="sm"
                value-field="id"
                text-field="name"
              ></BFormSelect>
              <b-form-invalid-feedback
                id="engineer_preferred_location-feedback"
                :state="submitClicked ? !errors.preferred_location : null">
                {{ errors.preferred_location || FIELD_MESSAGES.engineer.preferred_location() }}
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
                  v-model="engineer.engineer.hide_from_dispatch"
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
import { useMainStore } from '@/stores/main'
import {
  emptyEngineerUser,
  FIELD_MESSAGES,
  parseEngineerUserForm,
  validateEngineerUserForm,
  type EngineerUserFieldErrors,
  type EngineerUserFormValues,
} from './schemas'
import { emptyUserIdentity, filledFrom, USERNAME_TAKEN_MESSAGE } from '../user-form'
import { useUserForm } from '../use-user-form'
import UserIdentityPanel from '../UserIdentityPanel.vue'
import { errorToast, $trans } from '@/services/i18n'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'

const props = withDefaults(defineProps<{
  pk?: string | number | null
}>(), {
  pk: null,
})

const mainStore = useMainStore()
const queryClient = useQueryClient()
const {create} = useToast()

// The record nests its profile the way the write body does, so the form's
// fields fill straight from it; the passwords start blank. The two decimals
// a record can hold as null open blank rather than at the new-engineer
// prefill, so an untouched save keeps them null.
function engineerUserFromRecord(record: Engineer): EngineerUserFormValues {
  const { engineer: defaults } = emptyEngineerUser()
  return {
    ...filledFrom(emptyUserIdentity(), record),
    engineer: filledFrom({ ...defaults, cost_price: '', contract_hours_week: '' }, record.engineer),
  }
}

const form = useUserForm<EngineerUserFormValues, Engineer, v.InferOutput<typeof vEngineerRequestWritable>, EngineerUserFieldErrors>({
  pk: () => props.pk,
  retrieve: (id) => companyEngineerRetrieveOptions({path: {id}}),
  create: companyEngineerCreateMutation(),
  update: companyEngineerPartialUpdateMutation(),
  invalidate: (queryClient) => queryClient.invalidateQueries({queryKey: companyEngineerListQueryKey()}),
  empty: emptyEngineerUser,
  fromRecord: engineerUserFromRecord,
  validate: validateEngineerUserForm,
  parse: parseEngineerUserForm,
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

// Read-only on the wire: the currency the rate is shown in comes with the
// record, not the form.
const hourlyRateCurrency = computed(() => form.record.value?.engineer?.hourly_rate_currency ?? 'EUR')
const {errors, submitClicked, buttonDisabled, isCreate, probe, submitForm, cancelForm} = form

const countries = computed(() => mainStore.getCountries)

// The preferred-location picker: the legacy form drove
// `stockLocationModel.list()`; the converted picker feeds the generated
// stock-location list query. Creating a location posts through the generated
// mutation, then pins the new id — the legacy `createLocation` flow.
const locationsQuery = useQuery(() => ({
  ...inventoryStockLocationListOptions(),
}))

useQueryErrorToast(locationsQuery.error, $trans('Error fetching locations'))

const locations = computed(() => locationsQuery.data.value?.results ?? [])

const newLocationName = ref('')
const buttonCreateLocationDisabled = computed(
  () => newLocationName.value === '' || createLocationMutation.isPending.value,
)

const createLocationMutation = useMutation({
  ...inventoryStockLocationCreateMutation(),
  onSuccess: async (data) => {
    await queryClient.invalidateQueries({queryKey: inventoryStockLocationListQueryKey()})
    engineer.value.engineer.preferred_location = data.id
    newLocationName.value = ''
  },
  onError: () => {
    errorToast(create, $trans('Error creating new location'))
  },
})

async function createLocation() {
  if (newLocationName.value === '') return
  try {
    await createLocationMutation.mutateAsync({body: {name: newLocationName.value}})
  } catch {
    // The mutation's onError already told the user; staying on the form is
    // the contract, not a silent swallow.
  }
}

// The hourly rate rides the wire as a decimal string; the PriceInput speaks
// dinero. Same handoff as the customer form's `applyPrice`.
function applyPrice(dinero: Dinero.Dinero) {
  engineer.value.engineer.hourly_rate = dinero.toFormat('0.00')
}

const isLoading = computed(() =>
  form.isLoading.value ||
  locationsQuery.isLoading.value ||
  createLocationMutation.isPending.value,
)
</script>
