<template>
  <b-overlay :show="isLoading" rounded="sm" v-if="!isLoading">
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
              <!-- The legacy input bound `:value`, which bootstrap-vue-next's
                   BFormInput no longer consumes — the total never showed.
                   Bound as the model value, it shows again (declared repair). -->
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
                      <div class="float-right">
                        <BLink class="h5 mx-2" @click="editEquipment(data.item, data.index)">
                          <IBiPencil></IBiPencil>
                        </BLink>
                        <BLink class="h5 mx-2" @click.prevent="deleteEquipment(data.index)">
                          <IBiTrash></IBiTrash>
                        </BLink>
                      </div>
                    </template>
                  </b-table>
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
import { useRouter } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
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
import type { Customer } from '@/api/types.gen'
import PriceInput from '@/components/PriceInput.vue'
import CustomerCard from '@/components/CustomerCard.vue'
import { useAuthStore } from '@/stores/auth'
import { useMainStore } from '@/stores/main'
import { toDinero, errorToast, infoToast, $trans } from '@/utils'
import { SESSION_AUTH_HEADER } from '../session-auth-header'
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
  type MaintenanceContractFormValues,
} from './schemas'
import {
  invalidateMaintenanceContractListQueries,
  invalidateMaintenanceEquipmentListQueries,
} from './list-invalidation'

/**
 * The maintenance-contract create/edit form, rewritten into the feature
 * folder.
 *
 * Reads go through the generated query options: the record under edit, its
 * customer (for the card), the contract's equipment rows, and the two
 * type-to-search autocompletes — debounced by half a second, as the legacy
 * `AwesomeDebouncePromise(..., 500)` was, with the query key folding the
 * search term (and the customer, for equipment) in.
 *
 * The equipment rows are staged client-side exactly as the legacy screen
 * staged them — adds push, edits replace in place, deletes mark — and are
 * replayed over the wire only on submit: the contract first, then the rows
 * in collection order (updates for rows the backend has, creates for the
 * new ones), then the deletions, stopping at the first failure. The parsed
 * bodies are what ride the wire; the model junk the legacy round-tripped
 * (`priceFields`, the dinero objects, the counts, the readonly ids) is gone.
 *
 * One declared repair: the legacy quick-create-equipment flow POSTed
 * successfully and then threw — `this.maintenanceEquipment.equipment = …`
 * named no property — so the created equipment never reached the form. It
 * lands in the staged row now.
 */

const props = defineProps({
  pk: {
    type: [String, Number],
    default: null,
  },
})

const router = useRouter()
const queryClient = useQueryClient()
const mainStore = useMainStore()
const authStore = useAuthStore()
const {create} = useToast()

const isCreate = computed(() => !props.pk)
// Route params arrive as strings; the generated operations want the number.
const contractId = computed(() => Number(props.pk))
const defaultCurrency = computed(() => mainStore.getDefaultCurrency)

// reads -----------------------------------------------------------------

const detailQuery = useQuery(() => ({
  ...customerMaintenanceContractRetrieveOptions({path: {id: contractId.value}}),
  // A create form has no record to fetch; without this the retrieve fires
  // against `undefined`.
  enabled: !isCreate.value,
}))

const contract = ref<MaintenanceContractFormValues>(emptyContract())

watch(
  () => detailQuery.data.value,
  (data) => {
    if (!data) return
    contract.value = contractFromRecord(data)
  },
  {immediate: true},
)

/** The customer the card shows: picked from the autocomplete on create, the
 * record's own customer on edit — the same fetch the legacy `loadData` made. */
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

const equipmentRows = ref<EquipmentRowState[]>([])
const deletedEquipmentIds = ref<number[]>([])

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

// autocompletes ----------------------------------------------------------

const HALF_SECOND = 500

const customerSearchTerm = ref('')
const customerQueryTerm = ref('')
let customerSearchTimer: ReturnType<typeof setTimeout> | undefined

watch(customerSearchTerm, (term) => {
  clearTimeout(customerSearchTimer)
  customerSearchTimer = setTimeout(() => {
    customerQueryTerm.value = term
  }, HALF_SECOND)
})

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
const equipmentQueryTerm = ref('')
let equipmentSearchTimer: ReturnType<typeof setTimeout> | undefined

watch(equipmentSearchTerm, (term) => {
  clearTimeout(equipmentSearchTimer)
  equipmentSearchTimer = setTimeout(() => {
    equipmentQueryTerm.value = term
  }, HALF_SECOND)
})

const equipmentSearchQuery = useQuery(() => ({
  ...equipmentEquipmentAutocompleteListOptions({
    query: {q: equipmentQueryTerm.value, customer: customerRecord.value.id as number},
  }),
  enabled: customerRecord.value.id !== undefined && equipmentQueryTerm.value.length > 0,
}))
const equipmentOptions = computed(() => equipmentSearchQuery.data.value ?? [])

// staged equipment rows --------------------------------------------------

const rowEdit = ref<EquipmentRowState>(emptyEquipmentRow(defaultCurrency.value))
const editingIndex = ref<number | null>(null)
const rowTouched = ref(false)

const rowErrors = computed(() => equipmentRowErrors(rowEdit.value))

function selectEquipmentOption(option: {id: number; name: string}) {
  // Already staged: edit that row in place, as the legacy `selectEquipment`
  // did when the same equipment was picked twice.
  const existing = equipmentRows.value.find((row) => row.equipment === option.id)
  if (existing) {
    editEquipment(existing, equipmentRows.value.indexOf(existing))
    return
  }

  rowEdit.value.equipment = option.id
  rowEdit.value.equipment_name = option.name
  rowTouched.value = false
  nextTick(() => timesPerYear.value?.focus())
}

function addEquipment() {
  if (rowEdit.value.equipment === null) return

  equipmentRows.value.push({...rowEdit.value})
  rowEdit.value = emptyEquipmentRow(defaultCurrency.value)
  rowTouched.value = false
}

function editEquipment(item: EquipmentRowState, index: number) {
  editingIndex.value = index
  rowEdit.value = item
}

function doEditEquipment() {
  if (editingIndex.value === null) return
  equipmentRows.value.splice(editingIndex.value, 1, {...rowEdit.value})
  editingIndex.value = null
  rowEdit.value = emptyEquipmentRow(defaultCurrency.value)
  rowTouched.value = false
}

function cancelEditEquipment() {
  editingIndex.value = null
  rowEdit.value = emptyEquipmentRow(defaultCurrency.value)
  rowTouched.value = false
}

function deleteEquipment(index: number) {
  // Only marked for deletion when the backend has the row — a staged-but-
  // unsaved row just disappears, as the legacy staging did.
  const row = equipmentRows.value[index]
  if (row.id) {
    deletedEquipmentIds.value.push(row.id)
  }
  equipmentRows.value.splice(index, 1)
}

const equipmentFields = [
  {key: 'equipment_name', label: $trans('Name')},
  {key: 'times_per_year', label: $trans('Times / year')},
  {key: 'tariff', label: $trans('Tariff')},
  {key: 'remarks', label: $trans('Remarks')},
  {key: 'icons', label: ''},
]

/** The row's tariff as dinero, on the row's own currency — what the legacy
 * price mixin built per row. */
function rowDinero(row: EquipmentRowState) {
  return row.tariff_dinero ?? toDinero(row.tariff || '0.00', row.tariff_currency || defaultCurrency.value)
}

/** The running contract value: the sum of the staged rows' tariffs — the
 * legacy `getItemsTotal`, zeroed when nothing is staged. */
const totalDinero = computed(() => {
  const base = toDinero('0.00', defaultCurrency.value)
  if (!equipmentRows.value.length) return base
  return equipmentRows.value.reduce(
    (total, row) => total.add(rowDinero(row)),
    base,
  )
})

// quick-create equipment -------------------------------------------------

const newEquipmentName = ref('')

const quickCreateEquipment = useMutation({...equipmentEquipmentCreateQuickCreateMutation()})

async function submitCreateEquipment() {
  // assuming we don't manage maintenance contracts from branches
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
    // Declared repair (README): the legacy flow POSTed successfully and then
    // threw — `this.maintenanceEquipment.equipment = response.id` named no
    // property — so the created equipment never reached the form. It lands
    // in the staged row now, and the focus moves on as the legacy code
    // intended.
    rowEdit.value.equipment = response.id
    rowEdit.value.equipment_name = response.name
    newEquipmentModal.value?.hide()
    nextTick(() => timesPerYear.value?.focus())
  } catch (error) {
    console.log('Error adding equipment', error)
    errorToast(create, $trans('Error adding equipment'))
  }
}

function cancelCreateEquipment() {
  newEquipmentModal.value?.hide()
}

// saving -----------------------------------------------------------------

const createContract = useMutation({...customerMaintenanceContractCreateMutation()})
const updateContract = useMutation({...customerMaintenanceContractPartialUpdateMutation()})
const createEquipmentRow = useMutation({...customerMaintenanceEquipmentCreateMutation()})
const updateEquipmentRow = useMutation({...customerMaintenanceEquipmentPartialUpdateMutation()})
const destroyEquipmentRow = useMutation({...customerMaintenanceEquipmentDestroyMutation()})

const contractErrors = ref<ContractFieldErrors>({})
const saving = ref(false)

async function submitForm() {
  contractErrors.value = validateContractForm(contract.value)
  if (Object.keys(contractErrors.value).length > 0) return

  saving.value = true

  try {
    if (isCreate.value) {
      const created = await createContract.mutateAsync({body: parseContractBody(contract.value)})
      await replayEquipmentRows(Number(created.id))
      infoToast(create, $trans('Created'), $trans('Maintenance contract has been created'))
    } else {
      await updateContract.mutateAsync({
        path: {id: contractId.value},
        body: parseContractBody(contract.value),
      })
      await replayEquipmentRows(contractId.value)
      infoToast(create, $trans('Updated'), $trans('Maintenance contract has been updated'))
    }
    await invalidateMaintenanceContractListQueries(queryClient)
    await invalidateMaintenanceEquipmentListQueries(queryClient)
    goBack()
  } catch (error) {
    console.log('Error saving maintenance contract', error)
    errorToast(
      create,
      isCreate.value
        ? $trans('Error creating maintenance contract')
        : $trans('Error updating maintenance_contract:'),
    )
  } finally {
    saving.value = false
  }
}

/**
 * The staged rows ride the wire only now: updates for the rows the backend
 * has, creates for the staged ones, in collection order, then the deletions
 * — the legacy `updateCollection`'s replay, stopping at the first failure.
 */
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

// template handles -------------------------------------------------------

const contractName = ref<{focus: () => void} | null>(null)
const contractValue = ref< unknown | null>(null)
void contractValue.value
const timesPerYear = ref<{focus: () => void} | null>(null)
const customerMultiselect = ref< unknown | null>(null)
void customerMultiselect.value
const equipmentMultiselect = ref<Record<string, any> | null>(null)
const newEquipmentModal = ref<{show: () => void; hide: () => void} | null>(null)
const newEquipmentForm = ref< unknown | null>(null)
void newEquipmentForm.value

function deactivateEquipmentMultiselect() {
  const multiselect = equipmentMultiselect.value as {
    deactivate?: () => void
    $refs?: {search?: {value?: string}}
  } | null
  multiselect?.deactivate?.()
  return multiselect?.$refs?.search?.value ?? ''
}

function showAddEquipmentModal() {
  newEquipmentName.value = deactivateEquipmentMultiselect()
  newEquipmentModal.value?.show()
}

// load state -------------------------------------------------------------

const isLoading = computed(() =>
  saving.value ||
  (!isCreate.value && (detailQuery.isLoading.value || equipmentQuery.isLoading.value)),
)

watch(
  () => detailQuery.error.value,
  (error) => {
    if (error) errorToast(create, `${$trans('Error loading maintenance contract')}, ${error.message}`)
  },
)

function cancelForm() {
  router.go(-1)
}

function goBack() {
  router.go(-1)
}

// The tests reach these through wrapper.vm, which for <script setup> only
// sees what is explicitly exposed. (The MaterialForm precedent.)
defineExpose({
  contract,
  rowEdit,
  equipmentRows,
  newEquipmentName,
  submitCreateEquipment,
})
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
