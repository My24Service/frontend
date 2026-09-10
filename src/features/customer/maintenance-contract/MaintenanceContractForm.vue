<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
      <b-modal
        id="new-equipment-modal"
        ref="newEquipmentModal"
        v-bind:title="$trans('New equipment')"
        @ok="submitCreateEquipment"
        @cancel="cancelCreateEquipment"
      >
        <form ref="newEquipmentForm" @submit.stop.prevent="submitCreateEquipment">
          <b-container fluid>
            <b-row role="group">
              <b-col size="12">
                <BFormGroup
                  v-bind:label="$trans('Equipment name')"
                  label-for="maintenance_equipment_new_equipment"
                >
                  <BFormInput
                    id="maintenance_equipment_new_equipment"
                    size="sm"
                    v-model="newEquipmentName"
                  ></BFormInput>
                </BFormGroup>
              </b-col>
            </b-row>
          </b-container>
        </form>
      </b-modal>
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
                ref="customerMultiselect"
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
                ref="contractValue"
                id="maintenance_contract_contract_value"
                size="sm"
                readonly
                :model-value="totalDinero.toFormat('$0.00')"
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

          <div class="panel col-2-3">
            <h6 :class="!customerRecord.id ? 'dimmed' : ''">{{ $trans('Equipment') }}</h6>
            <hr />

            <h3 v-if="!customerRecord.id" class="text-center">
              <IBiInfoSquare variant="primary"></IBiInfoSquare> &nbsp;
              <span class="dimmed">{{ $trans('Select a customer to add equipment to this contract.') }}</span>
            </h3>

            <div class="maintenance-contract-equipment" v-else>
              <b-row>
                <b-col cols="12">
                  <b-table
                    v-if="equipmentRows.length > 0"
                    small
                    :fields="equipmentFields"
                    :items="equipmentRows" responsive="md"
                  >
                    <template #cell(tariff)="data">
                      {{ rowDinero(data.item).toFormat('$0.00')}}
                    </template>
                    <template #cell(icons)="data">
                      <div class="float-end">
                        <BLink class="h5 mx-2" @click="editEquipment(data.item, data.index)">
                          <IBiPencil></IBiPencil>
                        </BLink>
                        <BLink class="h5 mx-2" @click.prevent="deleteEquipment(data.index)">
                          <IBiTrash></IBiTrash>
                        </BLink>
                      </div>
                    </template>
                  </b-table>
                  <b-form-invalid-feedback :state="!contractErrors.equipment">
                    {{ contractErrors.equipment }}
                  </b-form-invalid-feedback>
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="12" role="group">
                  <BFormGroup
                    label-size="sm"
                    v-bind:label="$trans('Add equipment')"
                  >
                    <VueMultiselect
                      id="maintenance-contract-equipment-name"
                      ref="equipmentMultiselect"
                      :key="customerRecord.id"
                      track-by="id"
                      label="name"
                      :placeholder="$trans('Type to search')"
                      open-direction="bottom"
                      :options="equipmentOptions"
                      :multiple="false"
                      :loading="isLoading"
                      :internal-search="false"
                      :clear-on-select="true"
                      :close-on-select="true"
                      :options-limit="30"
                      :limit="10"
                      :max-height="600"
                      :show-no-results="true"
                      :hide-selected="true"
                      @search-change="equipmentSearchTerm = $event"
                      @select="selectEquipmentOption"
                    >
                      <template #noResult>
                        <p>
                          <IBiInfoSquare variant="primary"></IBiInfoSquare>
                          {{ $trans('No equipment found. Consider changing the search query, or add a new equipment:')}}
                        </p>
                        <p>
                          <BButton
                            @click="showAddEquipmentModal"
                            class="btn btn-primary"
                            size="sm"
                            type="button"
                            variant="primary"
                          >
                            {{ $trans("Add equipment") }}
                          </BButton>
                        </p>
                      </template>
                    </VueMultiselect>
                  </BFormGroup>
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="3" role="group">
                  <BFormGroup
                    label-size="sm"
                    v-bind:label="$trans('Name')"
                    label-for="maintenance-contract-equipment-name"
                  >
                    <BFormInput
                      readonly
                      id="maintenance-contract-equipment-name"
                      size="sm"
                      v-model="rowEdit.equipment_name"
                    ></BFormInput>
                    <b-form-invalid-feedback :state="!rowErrors.equipment">
                      {{ rowErrors.equipment }}
                    </b-form-invalid-feedback>
                  </BFormGroup>
                </b-col>
                <b-col cols="2" role="group">
                  <BFormGroup
                    label-size="sm"
                    v-bind:label="$trans('Frequency')"
                    :placeholder="$trans('times per year')"
                    label-for="maintenance-contract-equipment-times_per_year"
                  >
                    <BFormInput
                      id="maintenance-contract-equipment-times_per_year"
                      size="sm"
                      ref="timesPerYear"
                      v-model="rowEdit.times_per_year"
                    ></BFormInput>
                    <b-form-invalid-feedback :state="!rowErrors.times_per_year">
                      {{ rowErrors.times_per_year }}
                    </b-form-invalid-feedback>
                  </BFormGroup>
                </b-col>
                <b-col cols="3" role="group">
                  <BFormGroup
                    label-size="sm"
                    v-bind:label="$trans('Tariff')"
                    label-for="maintenance-contract-equipment-tariff"
                  >
                    <PriceInput
                      v-model="rowEdit.tariff"
                      :currency="rowEdit.tariff_currency"
                    />
                  </BFormGroup>
                </b-col>
                <b-col cols="4" role="group">
                  <BFormGroup
                    label-size="sm"
                    v-bind:label="$trans('Remarks')"
                    label-for="maintenance-contract-equipment-remarks"
                  >
                    <BFormTextarea
                      id="maintenance-contract-equipment-remarks"
                      v-model="rowEdit.remarks"
                      rows="1"
                    ></BFormTextarea>
                  </BFormGroup>
                </b-col>
              </b-row>
              <footer class="modal-footer">
                <BButton
                  @click="cancelEditEquipment"
                  class="btn btn-primary"
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  {{ $trans('Cancel') }}
                </BButton>
                &nbsp;
                <BButton
                  v-if="editingIndex !== null"
                  @click="doEditEquipment"
                  class="btn btn-primary"
                  size="sm"
                  type="button"
                  variant="warning">
                  {{ $trans('Edit equipment') }}
                </BButton>
                <BButton
                  v-if="editingIndex === null"
                  @click="addEquipment"
                  class="btn btn-primary"
                  size="sm"
                  type="button"
                  variant="primary"
                  :disabled="rowEdit.equipment === null"
                >
                  {{ $trans('Add equipment') }}
                </BButton>
              </footer>

            </div>

          </div>
        </b-form>
      </div>
    </div>
  </b-overlay>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'
import VueMultiselect from 'vue-multiselect'

import {
  customerCustomerAutocompleteListOptions,
  customerCustomerRetrieveOptions,
  customerMaintenanceContractCreateMutation,
  customerMaintenanceContractPartialUpdateMutation,
  customerMaintenanceContractRetrieveOptions,
  customerMaintenanceEquipmentCreateMutation,
  customerMaintenanceEquipmentDestroyMutation,
  customerMaintenanceEquipmentListOptions,
  customerMaintenanceEquipmentPartialUpdateMutation,
  equipmentEquipmentAutocompleteListOptions,
  equipmentEquipmentCreateQuickCreateMutation,
} from '@/api/@tanstack/vue-query.gen'
import type { Customer, MaintenanceContract } from '@/api/types.gen'
import PriceInput from '@/components/PriceInput.vue'
import CustomerCard from '../CustomerCard.vue'
import { useAuthStore } from '@/features/auth'
import { useMainStore } from '@/stores/main'
import { toDinero, errorToast, $trans } from '@/services/i18n'
import { rowDinero as sharedRowDinero } from './dinero-helpers'
import { SESSION_AUTH_HEADER } from '@/features/shared/session-auth-header'
import { useResourceForm } from '@/features/forms/use-resource-form'
import {
  contractFromRecord,
  emptyContract,
  emptyEquipmentRow,
  equipmentRowErrors,
  equipmentRowFromRecord,
  parseContractBody,
  parseEquipmentBody,
  validateContractForm,
  type ContractFieldErrors,
  type EquipmentRowState,
  type MaintenanceContractBody,
  type MaintenanceContractFormValues,
} from './schemas'
import {
  customerMaintenanceContractListQueryKey,
  customerMaintenanceEquipmentListQueryKey,
} from '@/api/@tanstack/vue-query.gen'




const props = withDefaults(defineProps<{
  pk?: string | number | null
}>(), {
  pk: null,
})

const mainStore = useMainStore()
const authStore = useAuthStore()
const {create} = useToast()

const defaultCurrency = computed(() => mainStore.getDefaultCurrency)

const equipmentRows = ref<EquipmentRowState[]>([])
const deletedEquipmentIds = ref<number[]>([])

const createEquipmentRow = useMutation({...customerMaintenanceEquipmentCreateMutation()})
const updateEquipmentRow = useMutation({...customerMaintenanceEquipmentPartialUpdateMutation()})
const destroyEquipmentRow = useMutation({...customerMaintenanceEquipmentDestroyMutation()})

async function replayEquipmentRows(contractPk: number) {
  for (const row of equipmentRows.value) {
    const body = parseEquipmentBody(row, contractPk)
    if (row.id) {
      await updateEquipmentRow.mutateAsync({path: {id: row.id}, body})
    } else {
      await createEquipmentRow.mutateAsync({body})
    }
  }
  for (const id of deletedEquipmentIds.value) {
    await destroyEquipmentRow.mutateAsync({path: {id}})
  }
}

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
    ...equipmentStagedErrors(),
  }),
  parse: (values) => parseContractBody(values),
  onSaved: async (result, context) => {
    // A create has no id yet, so the replayed rows take the one the response
    // just handed back; an edit already knows the id it is writing.
    const contractPk = context.isCreate ? Number((result as {id: number}).id) : context.id
    await replayEquipmentRows(contractPk)
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
    headers: SESSION_AUTH_HEADER,
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

const equipmentQuery = useQuery(() => ({
  ...customerMaintenanceEquipmentListOptions({query: {contract: contractId.value, page: 1}}),
  enabled: !isCreate.value,
}))

watch(
  () => equipmentQuery.data.value,
  (data) => {
    if (!data) return
    equipmentRows.value = (data.results ?? []).map(
      (row) => equipmentRowFromRecord(row, defaultCurrency.value),
    )
    deletedEquipmentIds.value = []
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

const equipmentSearchTerm = ref('')
const equipmentQueryTerm = refDebounced(equipmentSearchTerm, 500)

const equipmentSearchQuery = useQuery(() => ({
  ...equipmentEquipmentAutocompleteListOptions({
    query: {q: equipmentQueryTerm.value, customer: customerRecord.value.id as number},
  }),
  enabled: customerRecord.value.id !== undefined && equipmentQueryTerm.value.length > 0,
}))
const equipmentOptions = computed(() => equipmentSearchQuery.data.value ?? [])



const rowEdit = ref<EquipmentRowState>(emptyEquipmentRow(defaultCurrency.value))
const editingIndex = ref<number | null>(null)
const rowErrors = computed(() => equipmentRowErrors(rowEdit.value))

function equipmentStagedErrors(): ContractFieldErrors {
  const committedBad = equipmentRows.value.some(
    (row) => Object.keys(equipmentRowErrors(row)).length > 0,
  )
  const pendingBad = rowEdit.value.equipment !== null &&
    Object.keys(equipmentRowErrors(rowEdit.value)).length > 0
  if (!committedBad && !pendingBad) return {}
  return {equipment: $trans('Please fix the equipment rows before saving')}
}

function selectEquipmentOption(option: {id: number; name: string}) {

  const existing = equipmentRows.value.find((row) => row.equipment === option.id)
  if (existing) {
    editEquipment(existing, equipmentRows.value.indexOf(existing))
    return
  }

  rowEdit.value.equipment = option.id
  rowEdit.value.equipment_name = option.name
  nextTick(() => timesPerYear.value?.focus())
}

function addEquipment() {
  if (rowEdit.value.equipment === null) return

  equipmentRows.value.push({...rowEdit.value})
  rowEdit.value = emptyEquipmentRow(defaultCurrency.value)
}

function editEquipment(item: EquipmentRowState, index: number) {
  editingIndex.value = index
  rowEdit.value = {...item}
}

function doEditEquipment() {
  if (editingIndex.value === null) return
  equipmentRows.value.splice(editingIndex.value, 1, {...rowEdit.value})
  editingIndex.value = null
  rowEdit.value = emptyEquipmentRow(defaultCurrency.value)
}

function cancelEditEquipment() {
  editingIndex.value = null
  rowEdit.value = emptyEquipmentRow(defaultCurrency.value)
}

function deleteEquipment(index: number) {

  const row = equipmentRows.value[index]
  if (row.id) {
    deletedEquipmentIds.value.push(row.id)
  }
  equipmentRows.value.splice(index, 1)
  if (editingIndex.value !== null) {
    if (editingIndex.value === index) {
      editingIndex.value = null
      rowEdit.value = emptyEquipmentRow(defaultCurrency.value)
    } else if (editingIndex.value > index) {
      editingIndex.value -= 1
    }
  }
}

const equipmentFields = [
  {key: 'equipment_name', label: $trans('Name')},
  {key: 'times_per_year', label: $trans('Times / year')},
  {key: 'tariff', label: $trans('Tariff')},
  {key: 'remarks', label: $trans('Remarks')},
  {key: 'icons', label: ''},
]


function rowDinero(row: EquipmentRowState) {
  return sharedRowDinero(row, defaultCurrency.value)
}


const totalDinero = computed(() => {
  const base = toDinero('0.00', defaultCurrency.value)
  if (!equipmentRows.value.length) return base
  return equipmentRows.value.reduce(
    (total, row) => total.add(rowDinero(row)),
    base,
  )
})



const newEquipmentName = ref('')

const quickCreateEquipment = useMutation({...equipmentEquipmentCreateQuickCreateMutation()})

async function submitCreateEquipment() {

  if (!mainStore.getMemberHasBranches) {
    errorToast(create, $trans('Not creating equipment from branch environment'))
    return
  }

  deactivateEquipmentMultiselect()

  try {
    const planning = authStore.isPlanning || authStore.isAdmin
    const response = await quickCreateEquipment.mutateAsync({
      body: planning
        ? {customer: customerRecord.value.id as number, name: newEquipmentName.value}
        : {customer: 0, name: newEquipmentName.value},
    })

    rowEdit.value.equipment = response.id
    rowEdit.value.equipment_name = response.name
    newEquipmentModal.value?.hide()
    nextTick(() => timesPerYear.value?.focus())
  } catch (error) {
    errorToast(create, $trans('Error adding equipment'))
  }
}

function cancelCreateEquipment() {
  newEquipmentModal.value?.hide()
}



const contractName = ref<{focus: () => void} | null>(null)
const contractValue = ref<unknown | null>(null)
const timesPerYear = ref<{focus: () => void} | null>(null)
const customerMultiselect = ref<unknown | null>(null)
const equipmentMultiselect = ref<{
  deactivate?: () => void
  $refs?: {search?: {value?: string}}
} | null>(null)
const newEquipmentModal = ref<{show: () => void; hide: () => void} | null>(null)
const newEquipmentForm = ref<unknown | null>(null)

function deactivateEquipmentMultiselect() {
  equipmentMultiselect.value?.deactivate?.()
  return equipmentMultiselect.value?.$refs?.search?.value ?? ''
}

function showAddEquipmentModal() {
  newEquipmentName.value = deactivateEquipmentMultiselect()
  newEquipmentModal.value?.show()
}



const isLoading = computed(() =>
  baseIsLoading.value ||
  (!isCreate.value && equipmentQuery.isLoading.value),
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
