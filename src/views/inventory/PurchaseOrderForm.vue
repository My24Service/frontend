<template>
  <div class="app-page">
    <header>
      <div class='page-title'>
        <h3>
          <IBiFileEarmarkMedical></IBiFileEarmarkMedical>
          <span class="backlink" @click="cancelForm">{{ $trans('Purchase orders') }}</span> /
          <span v-if="isCreate">{{ $trans('New purchase order') }}</span>
          <span v-if="!isCreate">{{ $trans('Edit purchase order') }}</span>
        </h3>
        <div class="flex-columns">
          <BButton @click="cancelForm" class="btn btn-secondary" type="button" variant="secondary">
            {{ $trans('Cancel') }}
          </BButton>
          <BButton @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
            {{ $trans('Submit') }}
          </BButton>
        </div>
      </div>
    </header>
    <div class="page-detail">
      <b-overlay :show="isLoading" rounded="sm">

          <b-form class="flex-columns">
            <div class="panel col-1-3">
              <h6>{{ $trans('Supplier') }}</h6>
              <b-row v-if="isCreate">
                <b-col cols="6" role="group">
                  <BFormGroup
                    label-size="sm"
                    label-class="form-group-no-bottom"
                    v-bind:label="$trans('Search suppliers')"
                    label-for="purchaseorder-supplier-search"
                  >
                    <VueMultiselect
                      id="purchaseorder-supplier-search"
                      track-by="id"
                      :placeholder="$trans('Type to search')"
                      open-direction="bottom"
                      :options="suppliersSearch"
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
                      @search-change="getSuppliers"
                      @select="selectSupplier"
                      :custom-label="supplierLabel"
                    >
                      <template #noResult>
                        {{ $trans('Oops! No elements found. Consider changing the search query.') }}
                        </template>
                    </VueMultiselect>
                  </BFormGroup>
                </b-col>
                <b-col cols="6" role="group">
                  <BFormGroup
                    label-size="sm"
                    label-class="form-group-no-bottom"
                    v-bind:label="$trans('Search reservations')"
                    label-for="purchaseorder-reservation-search"
                  >
                    <VueMultiselect
                      id="purchaseorder-reservation-search"
                      track-by="id"
                      :placeholder="$trans('Type to search')"
                      open-direction="bottom"
                      :options="reservationsSearch"
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
                      @search-change="getReservations"
                      @select="selectReservation"
                      :custom-label="reservationLabel"
                    >
                      <template #noResult>
                        {{ $trans('Oops! No elements found. Consider changing the search query.') }}
                      </template>
                    </VueMultiselect>
                  </BFormGroup>
                </b-col>
              </b-row>

                <BFormGroup
                  label-size="sm"
                  label-cols="3"
                  v-bind:label="$trans('Name')"
                  label-for="purchaseorder_name"
                >
                  <BFormInput
                    readonly
                    v-model="purchaseOrder.order_name"
                    id="purchaseorder_name"
                    size="sm"
                    :state="isSubmitClicked ? !v$.purchaseOrder.supplier.$error : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.purchaseOrder.supplier.$error : null">
                    {{ chooseErrorText }}
                  </b-form-invalid-feedback>
                </BFormGroup>

                <BFormGroup
                  label-size="sm"
                  label-cols="3"
                  v-bind:label="$trans('Address')"
                  label-for="purchaseorder_address"
                >
                  <BFormInput
                    readonly
                    id="purchaseorder_address"
                    size="sm"
                    v-model="purchaseOrder.order_address"
                    :state="isSubmitClicked ? !v$.purchaseOrder.supplier.$error : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.purchaseOrder.supplier.$error : null">
                    {{ chooseErrorText }}
                  </b-form-invalid-feedback>
                </BFormGroup>

                <BFormGroup
                  label-size="sm"
                  label-cols="3"
                  v-bind:label="$trans('Postal')"
                  label-for="purchaseorder_postal"
                >
                  <BFormInput
                    readonly
                    id="purchaseorder_postal"
                    size="sm"
                    v-model="purchaseOrder.order_postal"
                    :state="isSubmitClicked ? !v$.purchaseOrder.supplier.$error : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.purchaseOrder.supplier.$error : null">
                    {{ chooseErrorText }}
                  </b-form-invalid-feedback>
                </BFormGroup>

                <BFormGroup
                  label-size="sm"
                  label-cols="3"
                  v-bind:label="$trans('City')"
                  label-for="purchaseorder_city"
                >
                  <BFormInput
                    readonly
                    id="purchaseorder_city"
                    size="sm"
                    v-model="purchaseOrder.order_city"
                    :state="isSubmitClicked ? !v$.purchaseOrder.supplier.$error : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.purchaseOrder.supplier.$error : null">
                    {{ chooseErrorText }}
                  </b-form-invalid-feedback>
                </BFormGroup>

                <BFormGroup
                  label-size="sm"
                  label-cols="3"
                  v-bind:label="$trans('Country')"
                  label-for="purchaseorder_country_code"
                >
                  <BFormInput
                    readonly
                    id="purchaseorder_city"
                    size="sm"
                    v-model="purchaseOrder.order_country_code"
                    :state="isSubmitClicked ? !v$.purchaseOrder.supplier.$error : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.purchaseOrder.supplier.$error : null">
                    {{ chooseErrorText }}
                  </b-form-invalid-feedback>
                </BFormGroup>

                <BFormGroup
                  label-size="sm"
                  label-cols="3"
                  v-bind:label="$trans('Reference')"
                  label-for="purchaseorder_reference"
                >
                  <BFormInput
                    id="purchaseorder_reference"
                    size="sm"
                    v-model="purchaseOrder.order_reference"
                  ></BFormInput>
                </BFormGroup>

                <BFormGroup
                  readonly
                  label-size="sm"
                  label-cols="3"
                  v-bind:label="$trans('Mobile')"
                  label-for="order_mobile"
                >
                  <BFormInput
                    id="order_mobile"
                    size="sm"
                    v-model="purchaseOrder.order_mobile"
                  ></BFormInput>
                </BFormGroup>


                <BFormGroup
                  label-size="sm"
                  label-cols="3"
                  v-bind:label="$trans('Tel.')"
                  label-for="order_tel"
                >
                  <BFormInput
                    id="order_tel"
                    size="sm"
                    v-model="purchaseOrder.order_tel"
                  ></BFormInput>
                </BFormGroup>

                <BFormGroup
                  label-size="sm"
                  label-cols="3"
                  v-bind:label="$trans('Expected entry date')"
                  label-for="expected_entry_date"
                >
                  <VueDatePicker
                    id="expected_entry_date"
                    size="sm"
                    class="p-sm-0"
                    v-model="purchaseOrder.expected_entry_date"
                    :placeholder="$trans('Choose a date')"
                    :state="isSubmitClicked ? !v$.purchaseOrder.expected_entry_date.$error : null"
                    :locale="nl"
                    auto-apply
                    arrow-navigation
                    :formats="{ input: 'dd/MM/yyyy' }"
                  ></VueDatePicker>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.purchaseOrder.expected_entry_date.$error : null">
                    {{ $trans('Please enter a date') }}
                  </b-form-invalid-feedback>
                </BFormGroup>

                <hr>


                  <BFormGroup
                    label-size="sm"
                    label-cols="3"
                    v-bind:label="$trans('Contacts')"
                    label-for="purchaseorder_contact"
                  >
                    <BFormTextarea
                      id="purchaseorder_contact"
                      v-model="purchaseOrder.order_contact"
                      rows="2"
                    ></BFormTextarea>
                  </BFormGroup>

                  <BFormGroup
                    label-size="sm"
                    label-cols="3"
                    v-bind:label="$trans('Description')"
                    label-for="purchaseorder_description"
                  >
                    <BFormTextarea
                      id="purchaseorder_description"
                      v-model="purchaseOrder.description"
                      rows="2"
                    ></BFormTextarea>
                  </BFormGroup>

                  <BFormGroup
                    label-size="sm"
                    label-cols="3"
                    v-bind:label="$trans('Supplier remarks')"
                    label-for="supplier_remarks"
                  >
                    <BFormTextarea
                      id="supplier_remarks"
                      v-model="purchaseOrder.supplier_remarks"
                      rows="2"
                    ></BFormTextarea>
                  </BFormGroup>

            </div>

            <div class="panel col-2-3">
              <div class="purchaseorder-materials" v-if="purchaseOrder.order_name">
                <h6>{{ $trans('Products') }}</h6>
                <b-row>
                  <b-col cols="12">
                    <b-table
                      v-if="purchaseOrder.materials.length > 0"
                      small
                      :fields="materialFields"
                      :items="purchaseOrder.materials" responsive="md"
                    >
                      <template #cell(icons)="data">
                        <div class="float-right">
                          <BLink class="h5 mx-2" @click="editMaterial(data.item, data.index)">
                            <IBiPencil></IBiPencil>
                          </BLink>
                          <BLink class="h5 mx-2" @click.prevent="deleteMaterial(data.index)">
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
                      v-bind:label="$trans('Search product')"
                    >
                      <VueMultiselect
                        id="purchaseorder-material-name"
                        track-by="id"
                        label="name"
                        :placeholder="$trans('Type to search')"
                        open-direction="bottom"
                        :options="materialsSearch"
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
                        @search-change="getMaterials"
                        @select="selectMaterial"
                      >
                        <template #noResult>{{ $trans('Oops! No elements found. Consider changing the search query.') }}</template>
                      </VueMultiselect>
                    </BFormGroup>
                  </b-col>
                </b-row>
                <b-row>
                  <b-col cols="4" role="group">
                    <BFormGroup
                      label-size="sm"
                      v-bind:label="$trans('Name')"
                      label-for="purchaseorder-material-name"
                    >
                      <BFormInput
                        readonly
                        id="purchaseorder-material-name"
                        size="sm"
                        v-model="material.material_view.name"
                      ></BFormInput>
                      <b-form-invalid-feedback
                        :state="!v$.material.material.$error">
                        {{ $trans('Please select a product') }}
                      </b-form-invalid-feedback>
                    </BFormGroup>
                  </b-col>
                  <b-col cols="4" role="group">
                    <BFormGroup
                      label-size="sm"
                      v-bind:label="$trans('Amount')"
                      label-for="purchaseorder-material-amount"
                    >
                      <BFormInput
                        ref="amount"
                        id="purchaseorder-material-amount"
                        size="sm"
                        v-model="material.amount"
                      ></BFormInput>
                      <b-form-invalid-feedback
                        :state="!v$.material.amount.$error">
                        {{ $trans('Please enter an amount') }}
                      </b-form-invalid-feedback>
                    </BFormGroup>
                  </b-col>
                  <b-col cols="4" role="group">
                    <BFormGroup
                      label-size="sm"
                      v-bind:label="$trans('Remarks')"
                      label-for="purchaseorder-material-remarks"
                    >
                      <BFormTextarea
                        id="purchaseorder-material-remarks"
                        v-model="material.remarks"
                        rows="1"
                      ></BFormTextarea>
                    </BFormGroup>
                  </b-col>
                </b-row>
                <footer class="modal-footer">
                  <BButton
                    @click="cancelEditMaterial"
                    class="btn btn-primary"
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    {{ $trans('Cancel') }}
                  </BButton>
                  &nbsp;
                  <BButton
                    v-if="isEditMaterial"
                    @click="doEditMaterial"
                    class="btn btn-primary"
                    size="sm"
                    type="button"
                    variant="warning">
                    {{ $trans('Edit product') }}
                  </BButton>
                  <BButton
                    v-if="!isEditMaterial"
                    @click="addMaterial"
                    class="btn btn-primary"
                    size="sm"
                    type="button"
                    variant="primary"
                    :disabled="!isMaterialValid"
                  >
                    {{ $trans('Add product') }}
                  </BButton>
                </footer>
              </div>
              <div v-else>
                <h6>{{ $trans("Products") }}</h6>
                <h3 class="dimmed">{{ $trans("Select a supplier or reservation") }}</h3>
              </div>
            </div>
          </b-form>

      </b-overlay>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import moment from 'moment'
import VueMultiselect from 'vue-multiselect'
import { nl } from "date-fns/locale"

import purchaseOrderModel from '@/models/inventory/PurchaseOrder.js'
import purchaseOrderMaterialModel from '@/models/inventory/PurchaseOrderMaterial.js'
import supplierModel from '@/models/inventory/Supplier.js'
import materialModel from '@/models/inventory/Material.js'
import supplierReservationModel from '@/models/inventory/SupplierReservation.js'
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";
import {useMainStore} from "@/stores/main";

const greaterThanZero = (value) => parseInt(value) > 0

// Stryker disable all : defineProps() is hoisted out of setup(), so it may not
// reference the locals Stryker's instrumentation introduces. Nothing to mutate here.
const props = defineProps({
  pk: {
    type: [String, Number],
    default: null
  },
  // Supplied by the purchaseorder-add-from-reservation route
  // (/inventory/purchaseorders/from/reservation/:reservation_pk). Nothing here
  // reads it yet, so that route currently renders an ordinary empty create form
  // and the reservation is ignored. Declared so it stays a prop rather than
  // falling through to $attrs and landing on the root element.
  reservation_pk: {
    type: [String, Number],
    default: null
  },
})
// Stryker restore all

const {create} = useToast()
const mainStore = useMainStore()
const router = useRouter()

const chooseErrorText = $trans('Please select a supplier or reservation')
const materialFields = [
  { key: 'material_view.name', label: $trans('Name') },
  { key: 'amount', label: $trans('Amount') },
  { key: 'remarks', label: $trans('Remarks') },
  { key: 'icons', label: '' }
]

const isLoading = ref(false)
const buttonDisabled = ref(false)
const submitClicked = ref(false)
const purchaseOrder = ref(purchaseOrderModel.getFields())
const material = ref(purchaseOrderMaterialModel.getFields())

const suppliersSearch = ref([])
const reservationsSearch = ref([])

const editIndex = ref(null)
const isEditMaterial = ref(false)
const materialsSearch = ref([])
const deletedMaterials = ref([])

// Template ref for the amount input, focused after picking a product.
const amount = ref(null)

const rules = {
  purchaseOrder: {
    supplier: {
      required,
    },
    expected_entry_date: {
      required,
    },
  },
  material: {
    material: {
      required
    },
    amount: {
      required,
      greaterThanZero
    },
  }
}

const v$ = useVuelidate(rules, {purchaseOrder, material})

const isCreate = computed(() => !props.pk)
const isSubmitClicked = computed(() => submitClicked.value)
const isMaterialValid = computed(() => {
  v$.value.material.material.$touch()
  v$.value.material.amount.$touch()
  return !v$.value.material.amount.$invalid && !v$.value.material.material.$invalid;
})

// materials
function deleteMaterial(index) {
  deletedMaterials.value.push(purchaseOrder.value.materials[index])
  purchaseOrder.value.materials.splice(index, 1)
}

function editMaterial(item, index) {
  editIndex.value = index
  isEditMaterial.value = true

  material.value = item
}

function emptyMaterial() {
  material.value = purchaseOrderMaterialModel.getFields()
}

function cancelEditMaterial() {
  isEditMaterial.value = false
  emptyMaterial()
}

function doEditMaterial() {
  purchaseOrder.value.materials.splice(editIndex.value, 1, material.value)
  editIndex.value = null
  isEditMaterial.value = false
  emptyMaterial()
}

function addMaterial() {
  if (!isMaterialValid.value) {
    return
  }
  purchaseOrder.value.materials.push(material.value)
  emptyMaterial()
  v$.value.$reset()
}

function selectMaterial(option) {
  material.value.material = option.id
  material.value.material_view.name = option.name
  if (!isEditMaterial.value) {
    material.value.amount = 0
    material.value.remarks = ''
  }
  v$.value.material.material.$touch()
  v$.value.material.amount.$touch()
  amount.value.focus()
}

async function getMaterials(query) {
  if (!purchaseOrder.value.supplier) {
    return
  }

  isLoading.value = true

  try {
    materialsSearch.value = await materialModel.search(query, purchaseOrder.value.supplier)
    isLoading.value = false
  } catch(error) {
    console.log('Error fetching materials', error)
    errorToast(create, $trans('Error fetching products'))
    isLoading.value = false
  }
}

// suppliers
async function getSuppliers(query) {
  isLoading.value = true
  try {
    suppliersSearch.value = await supplierModel.search(query)
    isLoading.value = false
  } catch(error) {
    console.log('Error fetching suppliers', error)
    errorToast(create, $trans('Error fetching suppliers'))
    isLoading.value = false
  }
}

function supplierLabel ({ name, city }) {
  return `${name} - ${city}`
}

function selectSupplier(option) {
  purchaseOrderModel.applySupplier(purchaseOrder.value, option)
  // Products are supplier-specific, so anything picked for the previous
  // supplier no longer applies.
  purchaseOrder.value.materials = []

  getMaterials('')
}

// reservations
async function getReservations(query) {
  isLoading.value = true
  try {
    reservationsSearch.value = await supplierReservationModel.search(query)
    isLoading.value = false
  } catch(error) {
    console.log('Error searching reservations', error)
    errorToast(create, $trans('Error searching reservations'))
    isLoading.value = false
  }
}

function reservationLabel ({ supplier }) {
  return `${supplier.name}`
}

function selectReservation(option) {
  purchaseOrder.value.supplier_reservation = option.id
  purchaseOrderModel.applySupplier(purchaseOrder.value, option.supplier)

  purchaseOrder.value.materials = option.products
}

/**
 * Hand the edited materials to the material service and let it work out
 * which need inserting, updating and deleting. `hooks` is passed straight
 * through to updateCollection, so the caller can react per material.
 */
async function saveMaterials(purchaseOrderPk, hooks = {}) {
  for (const item of purchaseOrder.value.materials) {
    item.purchase_order = purchaseOrderPk
  }

  purchaseOrderMaterialModel.collection = purchaseOrder.value.materials
  purchaseOrderMaterialModel.deletedItems = deletedMaterials.value

  return purchaseOrderMaterialModel.updateCollection(hooks)
}

async function submitForm() {
  submitClicked.value = true
  v$.value.purchaseOrder.supplier.$touch()
  if (v$.value.purchaseOrder.supplier.$invalid) {
    return
  }

  buttonDisabled.value = true
  isLoading.value = true

  if (isCreate.value) {
    // preInsert drops purchase_order_id; the server assigns it.
    try {
      const purchase_order = await purchaseOrderModel.insert(purchaseOrder.value)
      await saveMaterials(purchase_order.id)

      infoToast(create, $trans('Created'), $trans('Purchase order has been created'))
      buttonDisabled.value = false
      isLoading.value = false

      router.go(-1)
    } catch(error) {
      console.log('Error creating purchase order', error)
      errorToast(create, $trans('Error creating purchase order'))
      buttonDisabled.value = false
      isLoading.value = false
    }

    return
  }

  try {
    await purchaseOrderModel.update(props.pk, purchaseOrder.value)
    infoToast(create, $trans('Updated'), $trans('Purchase order has been updated'))

    await saveMaterials(props.pk, {
      onInserted: () => infoToast(
        create, $trans('Product created'), $trans('Purchase order product has been created')
      ),
      onUpdated: () => infoToast(
        create, $trans('Product updated'), $trans('Purchase order product has been updated')
      ),
      onDeleted: () => infoToast(
        create, $trans('Product removed'), $trans('Purchase order product has been removed')
      ),
    })

    buttonDisabled.value = false
    isLoading.value = false
    router.go(-1)
  } catch(error) {
    console.log('Error updating purchase order', error)
    errorToast(create, $trans('Error updating purchase order'))
    buttonDisabled.value = false
    isLoading.value = false
  }
}

async function loadOrder() {
  isLoading.value = true

  try {
    // detail() hands back expected_entry_date as a Date.
    purchaseOrder.value = await purchaseOrderModel.detail(props.pk)
    isLoading.value = false

    await getMaterials('')
  } catch(error) {
    console.log('error fetching purchase order', error)
    errorToast(create, $trans('Error fetching purchase order'))
    isLoading.value = false
  }
}

function cancelForm() {
  router.go(-1)
}

// Ran as created() before the move to <script setup>: kicked off during setup
// and deliberately not awaited, same as the options-API hook.
async function init() {
  const lang = mainStore.getCurrentLanguage
  moment.locale(lang)

  try {
    if (!isCreate.value) {
      return loadOrder()
    } else {
      purchaseOrder.value = purchaseOrderModel.getFields()
    }

    await getSuppliers('')
  } catch {
    // Kept as the last-resort guard for setup. It used to be reachable mainly
    // through `countries = mainStore.getCountries`, which threw when member
    // info had not loaded; that read went with the unused `countries` state.
    errorToast(create, $trans('Error fetching countries'))
    buttonDisabled.value = false
  }
}

init()
</script>
<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
