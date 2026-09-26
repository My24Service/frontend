<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
      <header>
        <div class='page-title'>
          <h3>
            <IBiFileEarmarkLock></IBiFileEarmarkLock><router-link :to="{name: 'maintenance-contracts'}">{{ $trans("Maintenance contracts") }}</router-link> /
            <span class="dimmed" v-if="isCreate && !contract.name">{{ $trans('new') }}</span>
            <span class="dimmed" v-if="!isCreate && !contract.name">{{ $trans('edit') }}</span>
            <span v-else>{{ contract.name }}</span>
          </h3>
          <div class='flex-columns'>
            <BButton @click="cancelForm" type="button" variant="secondary">
              {{ $trans('Cancel') }}</BButton>
            <BButton @click="submitForm" type="button" variant="primary">
              {{ $trans('Submit') }}</BButton>
          </div>
        </div>
      </header>
      <div class="page-detail">
        <b-form class="flex-columns" @submit.stop.prevent="submitForm">
          <div class='panel col-1-3'>
            <h6>{{ $trans('Contract info') }}</h6>
            <BFormGroup v-bind:label="$trans('Contract name')"
              label-cols="4"
              label-size="sm"
              label-for="maintenance_contract_name">
              <BFormInput
                ref="contractName"
                id="maintenance_contract_name"
                size="sm"
                v-model="contract.name"
                :placeholder="$trans('The name of this contract')"
                required
              ></BFormInput>
              <b-form-invalid-feedback :state="!contractErrors.name">
                {{ contractErrors.name }}
              </b-form-invalid-feedback>
            </BFormGroup>
            <BFormGroup v-bind:label="$trans('Customer')"
              label-cols="4"
              label-size="sm"
              label-for="maintenance_contract_customer_search"
            >
              <VueMultiselect
                v-if="!isLoading"
                id="maintenance_contract_customer_search"
                track-by="id"
                :placeholder="$trans('Customer name (type to search)')"
                open-direction="bottom"
                :options="customerOptions"
                :multiple="false"
                :loading="isLoading"
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
                required
              >
                <template #noResult>
                  {{ $trans('No customers found. Consider changing the search query.') }}
                </template>
              </VueMultiselect>
              <b-form-invalid-feedback :state="!contractErrors.customer">
                {{ contractErrors.customer }}
              </b-form-invalid-feedback>
            </BFormGroup>
            <BFormGroup v-bind:label="$trans('Remarks')"
              label-size="sm"
              label-cols="4"
              label-for="maintenance_contract_remarks"
            >
              <BFormTextarea
                id="maintenance_contract_remarks"
                v-model="contract.remarks"
                rows="1"
                :placeholder="$trans('A note about this contract')"
              ></BFormTextarea>
            </BFormGroup>
            <BFormGroup v-bind:label="$trans('Contract value')"
              label-cols="4"
              label-size="sm"
              label-for="maintenance_contract_contract_value">

              <BFormInput
                id="maintenance_contract_contract_value"
                size="sm"
                readonly
                :model-value="formatMoney(equipmentTotal)"
              >
              </BFormInput>
            </BFormGroup>

            <h6 v-if="customerRecord.id">{{ $trans("Customer") }}</h6>
            <CustomerCard
              :key="customerRecord.id"
              v-if="customerRecord.name"
              :customer="customerRecord"
              />
          </div>

          <StagedEquipmentPanel
            :staging="staging"
            :customer="customerRecord"
            :loading="isLoading"
            :error="contractErrors.equipment"
          />
        </b-form>
      </div>
    </div>
  </b-overlay>
</template>

<script lang="ts" setup>
import VueMultiselect from 'vue-multiselect'

import CustomerCard from '../CustomerCard.vue'
import { formatMoney } from '@/services/money'
import { useResourceForm } from '@/features/forms'
import StagedEquipmentPanel from './StagedEquipmentPanel.vue'
import { useEquipmentStaging } from './useEquipmentStaging'
import {
  contractFromRecord,
  emptyContract,
  parseContractWithEquipmentBody,
  validateContractForm,
  type ContractFieldErrors,
  type MaintenanceContractFormValues,
} from './schemas'

const props = withDefaults(defineProps<{
  pk?: string | number | null
}>(), {
  pk: null,
})

const {
  values: contract,
  errors: contractErrors,
  isCreate,
  id: contractId,
  isLoading: baseIsLoading,
  submitForm,
  cancelForm,
} = useResourceForm<
  MaintenanceContractFormValues,
  Api.MaintenanceContract,
  Api.MaintenanceContractWithEquipmentRequestRequest,
  ContractFieldErrors
>({
  pk: () => props.pk,
  retrieve: (id) => Api.CustomerMaintenanceContract.retrieve.options({path: {id}}),
  // One request writes the contract and its whole equipment set, in the
  // backend's one transaction. The pair differs only in the verb's address: an
  // update POSTs to `/with-equipment/` as a create does, because this codebase
  // disables PUT and keeps the pair on one verb (see my24service
  // `apps/customer/mixins/maintenance_contract_with_equipment.py`).
  create: Api.CustomerMaintenanceContractWithEquipment.create.mutation(),
  update: Api.CustomerMaintenanceContract.extras.withEquipmentUpdate.mutation(),
  invalidate: async (qc) => {
    await qc.invalidateQueries({queryKey: Api.CustomerMaintenanceContract.list.queryKey()})
    await qc.invalidateQueries({queryKey: Api.CustomerMaintenanceEquipment.list.queryKey()})
  },
  empty: () => emptyContract(),
  fromRecord: (record) => contractFromRecord(record),
  validate: (values) => ({
    ...validateContractForm(values),
    ...staging.stagedErrors(),
  }),
  parse: (values) => parseContractWithEquipmentBody(values, staging.equipmentBody()),
  onSaved: (result) => {
    // The response is the contract detail plus the stored equipment rows, ids
    // and all — which is what makes a second save address the rows the first
    // one wrote instead of creating them again.
    staging.adoptStoredRows(
      (result as Api.MaintenanceContractWithEquipmentResponse).equipment,
    )
  },
  copy: {
    fetchError: $trans('Error loading maintenance contract'),
    created: $trans('Created'),
    createdDetail: $trans('Maintenance contract has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Maintenance contract has been updated'),
    createError: $trans('Error creating maintenance contract'),
    updateError: $trans('Error updating maintenance_contract:'),
  },
})

const customerRecord = ref<Partial<Api.Customer>>({})

/**
 * The staged equipment set, owned here rather than read through the panel:
 * the panel renders it, but the total, the validation and the equipment half
 * of the save body are the form's own reads of its own state — no mount-order
 * dependency, no first-render fallback.
 */
const staging = useEquipmentStaging({
  contractId: () => contractId.value,
  isCreate: () => isCreate.value,
  customerId: () => contract.value.customer ?? undefined,
})

const customerId = computed(() => contract.value.customer)
const customerQuery = useQuery(() => ({
  ...Api.CustomerCustomer.retrieve.options({
    path: {id: customerId.value as number},
  }),
  enabled: !isCreate.value && customerId.value !== null,
}))

watch(
  () => customerQuery.data.value,
  (data) => {
    if (!data) return
    customerRecord.value = data
  },
  {immediate: true},
)

const customerSearchTerm = ref('')
const customerQueryTerm = refDebounced(customerSearchTerm, 500)

const customerSearchQuery = useQuery(() => ({
  ...Api.CustomerCustomerAutocomplete.list.options({query: {q: customerQueryTerm.value}}),
  enabled: customerQueryTerm.value.length > 0,
}))
const customerOptions = computed(() => customerSearchQuery.data.value ?? [])

function customerLabel({name, city}: {name?: string; city?: string}) {
  return `${name} - ${city}`
}

function selectCustomer(option: {id: number; name: string; address?: string; city?: string; country_code?: string; tel?: string}) {
  contract.value.customer = option.id
  customerRecord.value = {
    id: option.id,
    name: option.name,
    address: option.address,
    city: option.city,
    country_code: option.country_code,
    tel: option.tel,
  }
  void nextTick(() => contractName.value?.focus())
}

/** The sum of the staged rows, which the equipment set owns. */
const equipmentTotal = staging.totalDinero

const contractName = ref<{focus: () => void} | null>(null)

const isLoading = computed(() =>
  baseIsLoading.value || staging.isLoading.value,
)
</script>
<style>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.25s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
