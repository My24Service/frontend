<template>
  <div class='app-page'>
    <header>
      <div class='page-title'>
        <h3>
          <IBiReceipt></IBiReceipt>
          <span @click="cancelForm" class="backlink">{{ $trans('Entries') }}</span> /
          <span v-if="isCreate">{{ $trans('New entry') }}</span>
          <span v-if="!isCreate">{{ $trans('Edit entry') }}</span>
        </h3>
        <BButton-toolbar>
          <BButton @click="cancelForm" class="btn btn-secondary" type="button" variant="secondary">
            {{ $trans('Cancel') }}
          </BButton>
          <BButton @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
            {{ $trans('Submit') }}
          </BButton>
        </BButton-toolbar>
      </div>
    </header>
    <div class='page-details panel'>
      <b-overlay :show="isLoading" rounded="sm">
        <div class="container app-form">
          <b-form>

            <b-row>
              <b-col cols="12" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Purchase order')"
                  label-for="purchaseorder-entry-order-search"
                >
                  <VueMultiselect
                    id="purchaseorder-entry-order-search"
                    track-by="id"
                    :placeholder="$trans('Type to search')"
                    open-direction="bottom"
                    :options="purchaseOrders"
                    :multiple="false"
                    :internal-search="false"
                    :clear-on-select="true"
                    :close-on-select="true"
                    :options-limit="30"
                    :limit="10"
                    :max-height="600"
                    :show-no-results="false"
                    :hide-selected="true"
                    @search-change="getPurchaseOrders"
                    @select="selectPurchaseOrder"
                    :custom-label="purchaseOrderLabel"
                  >
                    <template #noResult>
                      {{ $trans('Oops! No elements found. Consider changing the search query.') }}
                      </template>
                  </VueMultiselect>
                </BFormGroup>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="1" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Order ID')"
                  label-for="purchaseorder-entry-order-id"
                >
                  <BFormInput
                    v-model="selectedPurchaseOrder.purchase_order_id"
                    id="purchaseorder-entry-order-id"
                    readonly
                    size="sm"
                  ></BFormInput>
                </BFormGroup>
              </b-col>
              <b-col cols="3" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Supplier')"
                  label-for="purchaseorder-entry-supplier"
                >
                  <BFormInput
                    v-model="selectedPurchaseOrder.order_name"
                    id="purchaseorder-entry-supplier"
                    readonly
                    size="sm"
                  ></BFormInput>
                </BFormGroup>
              </b-col>
              <b-col cols="3" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('City')"
                  label-for="purchaseorder-entry-city"
                >
                  <BFormInput
                    v-model="selectedPurchaseOrder.order_city"
                    id="purchaseorder-entry-city"
                    size="sm"
                    readonly
                  ></BFormInput>
                </BFormGroup>
              </b-col>
              <b-col cols="2" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Expected entry date')"
                  label-for="purchaseorder-entry-expected_entry_date"
                >
                  <BFormInput
                    v-model="selectedPurchaseOrder.expected_entry_date"
                    id="purchaseorder-entry-expected_entry_date"
                    size="sm"
                    readonly
                  ></BFormInput>
                </BFormGroup>
              </b-col>
              <b-col cols="3" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Default location')"
                  label-for="purchaseorder-entry-default-location"
                >
                  <BFormSelect
                    id="purchaseorder-entry-default-location"
                    v-model="defaultLocation"
                    :options="stockLocations"
                    size="sm"
                    value-field="id"
                    text-field="name"
                  ></BFormSelect>
                </BFormGroup>
              </b-col>
            </b-row>

            <div class="entry-materials">
              <h4>{{ $trans('Products') }}</h4>
              <b-row>
                <b-col cols="12">
                  <b-table
                    v-if="purchaseorderEntries.length > 0"
                    small
                    :fields="entriesFields"
                    :items="purchaseorderEntries" responsive="md"
                  >
                    <template #cell(entry_date)="data">
                      {{ formatEntryDate(data.item.entry_date) }}
                    </template>
                    <template #cell(icons)="data">
                      <div class="float-right">
                        <BLink class="h5 mx-2" @click="editEntry(data.item, data.index)">
                          <IBiPencil></IBiPencil>
                        </BLink>
                        <BLink class="h5 mx-2" @click.prevent="deleteEntry(data.index)">
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
                    v-bind:label="$trans('Product')"
                    label-for="purchaseorder-entry-material-search"
                  >
                    <VueMultiselect
                      id="purchaseorder-entry-material-search"
                      track-by="id"
                      :placeholder="$trans('Type to search')"
                      open-direction="bottom"
                      :options="purchaseOrderMaterials"
                      :multiple="false"
                      :internal-search="true"
                      :clear-on-select="true"
                      :close-on-select="true"
                      :options-limit="30"
                      :limit="10"
                      :max-height="600"
                      :show-no-results="false"
                      :hide-selected="true"
                      @select="selectPurchaseOrderMaterial"
                      :custom-label="purchaseOrderMaterialLabel"
                    >
                      <template #noResult>
                        {{ $trans('Oops! No elements found. Consider changing the search query.') }}
                        </template>
                    </VueMultiselect>
                    <b-form-invalid-feedback
                      :state="isSubmitClicked ? !v$.entry.purchase_order_material.$error : null">
                      {{ $trans('Please select a product') }}
                    </b-form-invalid-feedback>
                  </BFormGroup>
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="3" role="group">
                  <BFormGroup
                    label-size="sm"
                    v-bind:label="$trans('Name')"
                    label-for="purchaseorder-entry-material-name"
                  >
                    <BFormInput
                      v-model="entry.purchase_order_material_view.name"
                      id="purchaseorder-entry-material-name"
                      readonly
                      size="sm"
                    ></BFormInput>
                  </BFormGroup>
                </b-col>
                <b-col cols="1" role="group">
                  <BFormGroup
                    label-size="sm"
                    v-bind:label="$trans('Ordered')"
                    label-for="purchaseorder-entry-material-amount"
                  >
                    <BFormInput
                      v-model="entry.ordered_amount"
                      id="purchaseorder-entry-material-amount"
                      readonly
                      size="sm"
                    ></BFormInput>
                  </BFormGroup>
                </b-col>
                <b-col cols="2" role="group">
                  <BFormGroup
                    label-size="sm"
                    v-bind:label="$trans('Unit')"
                    label-for="purchaseorder-entry-material-unit"
                  >
                    <BFormInput
                      v-model="entry.purchase_order_material_view.unit"
                      id="purchaseorder-entry-material-unit"
                      size="sm"
                      readonly
                    ></BFormInput>
                  </BFormGroup>
                </b-col>
                <b-col cols="1" role="group">
                  <BFormGroup
                    label-size="sm"
                    v-bind:label="$trans('Entry')"
                    label-for="purchaseorder-entry-amount"
                  >
                    <BFormInput
                      ref="amount"
                      v-model="entry.amount"
                      id="purchaseorder-entry-amount"
                      size="sm"
                      :state="isSubmitClicked ? !v$.entry.amount.$error : null"
                    ></BFormInput>
                    <b-form-invalid-feedback
                      :state="isSubmitClicked ? !v$.entry.amount.$error : null">
                      {{ $trans('Please enter an amount') }}
                    </b-form-invalid-feedback>
                  </BFormGroup>
                </b-col>
                <b-col cols="2" role="group">
                  <BFormGroup
                    label-size="sm"
                    v-bind:label="$trans('Date')"
                    label-for="purchaseorder-entry-date"
                  >
                    <VueDatePicker
                      id="purchaseorder-entry-date"
                      size="sm"
                      class="p-sm-0"
                      v-model="entry.entry_date"
                      :placeholder="$trans('Choose a date')"
                      :state="isSubmitClicked ? !v$.entry.entry_date.$error : null"
                      :locale="nl"
                      auto-apply
                      arrow-navigation
                      :formats="{ input: 'dd/MM/yyyy' }"
                    ></VueDatePicker>
                    <b-form-invalid-feedback
                      :state="isSubmitClicked ? !v$.entry.entry_date.$error : null">
                      {{ $trans('Please enter a date') }}
                    </b-form-invalid-feedback>
                  </BFormGroup>
                </b-col>
                <b-col cols="3" role="group">
                  <BFormGroup
                    label-size="sm"
                    v-bind:label="$trans('Move to location')"
                    label-for="purchaseorder-entry-location"
                  >
                    <BFormSelect
                      id="purchaseorder-entry-location"
                      v-model="entry.stock_location"
                      :options="stockLocations"
                      size="sm"
                      value-field="id"
                      text-field="name"
                    ></BFormSelect>
                  </BFormGroup>
                </b-col>
              </b-row>
              <footer class="modal-footer">
                <BButton
                  @click="cancelEditEntry"
                  class="btn btn-primary"
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  {{ $trans('Cancel') }}
                </BButton>
                &nbsp;
                <BButton
                  v-if="isEditEntry"
                  @click="doEditEntry"
                  class="btn btn-primary"
                  size="sm"
                  type="button"
                  variant="warning">
                  {{ $trans('Edit entry') }}
                </BButton>
                <BButton
                  v-if="!isEditEntry"
                  @click="addEntry"
                  class="btn btn-primary"
                  size="sm"
                  type="button"
                  variant="primary"
                  :disabled="!isEntryValid"
                >
                  {{ $trans('Add entry') }}
                </BButton>
              </footer>
            </div>

            <div class="mx-auto">
              <footer class="modal-footer">

              </footer>
            </div>
          </b-form>
        </div>
      </b-overlay>
    </div>

  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import VueMultiselect from 'vue-multiselect'
import moment from 'moment'
import { nl } from "date-fns/locale"

import purchaseorderEntryModel from '../../models/inventory/PurchaseOrderEntry.js'
import purchaseOrderModel from '../../models/inventory/PurchaseOrder.js'
import stockLocationModel from '../../models/inventory/StockLocation.js'
import materialModel from '../../models/inventory/Material.js'
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";

const greaterThanZero = (value) => parseInt(value) > 0

const props = defineProps({
  pk: {
    type: [String, Number],
    default: null
  },
})

const {create} = useToast()
const router = useRouter()

const isLoading = ref(false)
const buttonDisabled = ref(false)
const submitClicked = ref(false)
// The single entry being composed or edited. Everything - the form's v-models,
// addEntry, and the update path - works on this one object.
const entry = ref(purchaseorderEntryModel.getFields())
const purchaseorderEntries = ref([])
const defaultLocation = ref(null)

const stockLocations = ref([])

const purchaseOrders = ref([])
const selectedPurchaseOrder = ref({})

const entriesFields = [
  { key: 'purchase_order_material_view.name', label: $trans('Name') },
  { key: 'purchase_order_material_view.unit', label: $trans('Unit') },
  { key: 'ordered_amount', label: $trans('Ordered amount') },
  { key: 'amount', label: $trans('Entry amount') },
  { key: 'entry_date', label: $trans('Date') },
  { key: 'stock_location_name', label: $trans('Location') },
  { key: 'icons', label: '' }
]

const editIndex = ref(null)
const isEditEntry = ref(false)
const deletedEntries = ref([])

const purchaseOrderMaterials = ref([])
const selectedPurchaseOrderMaterial = ref({
  material_view: materialModel.getFields()
})

const amount = ref(null)

// Unlike the options API's bare useVuelidate(), the state is passed explicitly
// here, so validation follows `entry` through the reassignments in loadData()
// and emptyEntry().
const rules = {
  entry: {
    purchase_order_material: {
      required
    },
    entry_date: {
      required,
    },
    amount: {
      required,
      greaterThanZero
    },
  },
}

const v$ = useVuelidate(rules, {entry})

const isCreate = computed(() => !props.pk)
const isSubmitClicked = computed(() => submitClicked.value)
const isEntryValid = computed(() => {
  v$.value.entry.purchase_order_material.$touch()
  v$.value.entry.entry_date.$touch()
  return !v$.value.entry.amount.$invalid && !v$.value.entry.purchase_order_material.$invalid
})

watch(defaultLocation, (val) => {
  const location = stockLocations.value.find(stockLocation => stockLocation.id === val)
  for (const item of purchaseorderEntries.value) {
    item.stock_location = location.id
    item.stock_location_name = location.name
  }
})

async function selectPurchaseOrder(option) {
  entry.value.purchase_order = option.id
  selectedPurchaseOrder.value = option

  isLoading.value = true
  try {
    const data = await purchaseOrderModel.detail(option.id)
    purchaseOrderMaterials.value = data.materials
    purchaseorderEntries.value = purchaseorderEntryModel.entriesForPurchaseOrder(data)

    isLoading.value = false
  } catch(error) {
    console.log('Error fetching purchase order products', error)
    errorToast(create, $trans('Error fetching purchase order products'))
    isLoading.value = false
  }
}

// entries
function formatEntryDate(entry_date) {
  return moment(entry_date).format('YYYY-MM-DD')
}

function deleteEntry(index) {
  deletedEntries.value.push(purchaseorderEntries.value[index])
  purchaseorderEntries.value.splice(index, 1)
}

function editEntry(item, index) {
  editIndex.value = index
  isEditEntry.value = true

  entry.value = item
}

function emptyEntry() {
  entry.value = purchaseorderEntryModel.getFields()
}

function cancelEditEntry() {
  isEditEntry.value = false
  emptyEntry()
}

function doEditEntry() {
  const location = stockLocations.value.find(stockLocation => stockLocation.id === entry.value.stock_location)
  entry.value.stock_location_name = location ? location.name : ""
  purchaseorderEntries.value.splice(editIndex.value, 1, entry.value)
  editIndex.value = null
  isEditEntry.value = false
  emptyEntry()
}

function addEntry() {
  if (!isEntryValid.value) {
    return
  }
  purchaseorderEntries.value.push(entry.value)
  emptyEntry()
  v$.value.$reset()
}

// purchase orders
async function getPurchaseOrders(query) {
  isLoading.value = true

  try {
    purchaseOrderModel.setSearchQuery(query)
    const data = await purchaseOrderModel.list()
    purchaseOrders.value = data.results
    isLoading.value = false
  } catch(error) {
    console.log('Error fetching purchase orders', error)
    errorToast(create, $trans('Error fetching purchase orders'))
    isLoading.value = false
  }
}

function purchaseOrderLabel(purchaseOrder) {
  return `${purchaseOrder.purchase_order_id} - ${purchaseOrder.order_name}, ${purchaseOrder.order_city} (materials: ${purchaseOrder.num_materials})`
}

// materials
function selectPurchaseOrderMaterial(option) {
  entry.value.purchase_order_material = option.id
  selectedPurchaseOrderMaterial.value = option
  amount.value.focus()
}

function purchaseOrderMaterialLabel(purchaseOrderMaterial) {
  return `${purchaseOrderMaterial.material_view.name} (ordered: ${purchaseOrderMaterial.amount}, entries: ${purchaseOrderMaterial.num_entries})`
}

// rest
async function submitForm() {
  submitClicked.value = true

  isLoading.value = true
  buttonDisabled.value = true

  if (isCreate.value) {
    try {
      // The hook fires per entry as updateCollection works through the
      // collection, so entries saved before a later failure keep their
      // toasts - which is what the hand-rolled loop this replaced did.
      purchaseorderEntryModel.collection = purchaseorderEntries.value
      purchaseorderEntryModel.deletedItems = deletedEntries.value
      await purchaseorderEntryModel.updateCollection({
        onInserted: () => infoToast(create, $trans('Created'), $trans('Entry has been created')),
      })

      buttonDisabled.value = false
      isLoading.value = false
      router.go(-1)
    } catch(error) {
      console.log('Error creating entry', error)
      errorToast(create, $trans('Error creating entry'))
      buttonDisabled.value = false
      isLoading.value = false
    }

    return
  }

  v$.value.$touch()
  if (v$.value.$invalid) {
    return
  }

  // A null stock_location is dropped from the payload by preUpdate.
  try {
    await purchaseorderEntryModel.update(props.pk, entry.value)
    infoToast(create, $trans('Updated'), $trans('Entry has been updated'))
    buttonDisabled.value = false
    isLoading.value = false
    router.go(-1)
  } catch(error) {
    console.log('Error updating entry', error)
    errorToast(create, $trans('Error updating entry'))
    buttonDisabled.value = false
    isLoading.value = false
  }
}

async function loadData() {
  isLoading.value = true

  try {
    entry.value = await purchaseorderEntryModel.detail(props.pk)
    entry.value.purchase_order_material_view = {
      'name': entry.value.material_name,
      "unit": "",
    }

    isLoading.value = false
  } catch(error) {
    console.log('error fetching entry', error)
    errorToast(create, $trans('Error fetching entry'))
    isLoading.value = false
  }
}

function cancelForm() {
  router.go(-1)
}

// Was created(). Kept as a then-chain rather than await so the ordering is
// unchanged: the purchase-order search and the stock-location list start
// together, and only the entry load waits on the locations.
function init() {
  getPurchaseOrders('')

  stockLocationModel.list().then((data) => {
    stockLocations.value = data.results

    if (!isCreate.value) {
      loadData()
    } else {
      entry.value = purchaseorderEntryModel.getFields()
    }
  })
}

init()

// The tests reach these through wrapper.vm, which for <script setup> only sees
// what is explicitly exposed.
defineExpose({
  entry,
  purchaseorderEntries,
  deletedEntries,
  stockLocations,
  defaultLocation,
  editIndex,
  isEditEntry,
  isLoading,
  buttonDisabled,
  v$,
  selectPurchaseOrder,
  selectPurchaseOrderMaterial,
  editEntry,
  doEditEntry,
  deleteEntry,
  addEntry,
  submitForm,
})
</script>
