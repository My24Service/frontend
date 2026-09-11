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
                :model-value="equipmentTotal.toFormat('$0.00')"
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
            ref="equipmentPanel"
            :customer="customerRecord"
            :contract-id="contractId"
            :is-create="isCreate"
            :loading="isLoading"
            :error="contractErrors.equipment"
          />
        </b-form>
      </div>
    </div>
  </b-overlay>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import { useQuery } from '@tanstack/vue-query'
import VueMultiselect from 'vue-multiselect'

import {
  customerCustomerAutocompleteListOptions,
  customerCustomerRetrieveOptions,
  customerMaintenanceContractCreateMutation,
  customerMaintenanceContractPartialUpdateMutation,
  customerMaintenanceContractRetrieveOptions,
  customerMaintenanceContractListQueryKey,
  customerMaintenanceEquipmentListQueryKey,
} from '@/api/@tanstack/vue-query.gen'
import type { Customer, MaintenanceContract } from '@/api/types.gen'
import CustomerCard from '../CustomerCard.vue'
import { useMainStore } from '@/stores/main'
import { $trans } from '@/services/i18n'
import { zeroDinero } from './dinero-helpers'
import { useResourceForm } from '@/features/forms/use-resource-form'
import StagedEquipmentPanel from './StagedEquipmentPanel.vue'
import {
  contractFromRecord,
  emptyContract,
  parseContractBody,
  validateContractForm,
  type ContractFieldErrors,
  type MaintenanceContractBody,
  type MaintenanceContractFormValues,
} from './schemas'

/**
 * The maintenance contract itself: its name, customer and remarks, and the
 * staged equipment panel that adds the rows to it.
 *
 * The equipment is written by the panel once this form's write has handed back
 * an id — a row cannot reference a contract that does not exist yet — so the
 * panel is also where the staged set is validated and replayed from.
 */
const props = withDefaults(defineProps<{
  pk?: string | number | null
}>(), {
  pk: null,
})

const mainStore = useMainStore()

/** The panel renders unconditionally, so this ref is set before either callback runs. */
const equipmentPanel = ref<InstanceType<typeof StagedEquipmentPanel> | null>(null)

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
  MaintenanceContract,
  MaintenanceContractBody,
  ContractFieldErrors
>({
  pk: () => props.pk,
  retrieve: (id) => customerMaintenanceContractRetrieveOptions({path: {id}}),
  create: customerMaintenanceContractCreateMutation(),
  update: customerMaintenanceContractPartialUpdateMutation(),
  invalidate: async (qc) => {
    await qc.invalidateQueries({queryKey: customerMaintenanceContractListQueryKey()})
    await qc.invalidateQueries({queryKey: customerMaintenanceEquipmentListQueryKey()})
  },
  empty: () => emptyContract(),
  fromRecord: (record) => contractFromRecord(record),
  validate: (values) => ({
    ...validateContractForm(values),
    ...(equipmentPanel.value?.stagedErrors() ?? {}),
  }),
  parse: (values) => parseContractBody(values),
  onSaved: async (result, context) => {
    // A create has no id yet, so the replayed rows take the one the response
    // just handed back; an edit already knows the id it is writing.
    const contractPk = context.isCreate ? Number((result as {id: number}).id) : context.id
    await equipmentPanel.value?.replay(contractPk)
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

const customerRecord = ref<Partial<Customer>>({})

const customerId = computed(() => contract.value.customer)
const customerQuery = useQuery(() => ({
  ...customerCustomerRetrieveOptions({
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
  ...customerCustomerAutocompleteListOptions({query: {q: customerQueryTerm.value}}),
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
  nextTick(() => contractName.value?.focus())
}

/** The sum of the staged rows, which the equipment panel owns. */
const equipmentTotal = computed(() =>
  equipmentPanel.value?.totalDinero ?? zeroDinero(mainStore.getDefaultCurrency))

const contractName = ref<{focus: () => void} | null>(null)

const isLoading = computed(() =>
  baseIsLoading.value ||
  (!isCreate.value && (equipmentPanel.value?.isLoading ?? false)),
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
