<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiFileLock></IBiFileLock>
          <span class="backlink" @click="cancelForm">{{ $trans('Reservations') }}</span> /
          <span v-if="isCreate">{{ $trans('New reservation') }}</span>
          {{ pk }} <span v-if="!isCreate" class="dimmed">{{ $trans('edit') }}</span>
        </h3>
        <div class='flex-columns'>
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
        <b-form>
          <div class='flex-columns'>
            <div class='panel col-1-3'>
              <h6>{{  $trans('Supplier') }}</h6>
              <fieldset>
                <BFormGroup
                  label-size="sm"
                  label-cols="12"
                  label-cols-md="3"
                  v-bind:label="$trans('Search supplier')"
                  label-for="supplier-reservation-supplier-search"
                >
                  <VueMultiselect
                    id="supplier-reservation-supplier-search"
                    track-by="id"
                    :placeholder="$trans('Type to search')"
                    open-direction="bottom"
                    :options="suppliers"
                    :multiple="false"
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
                    <template #noResult>{{ $trans('Oops! No elements found. Consider changing the search query.') }}</template>
                  </VueMultiselect>
                </BFormGroup>

                <BFormGroup
                label-cols="12"
                  label-cols-md="3"
                  label-size="sm"
                  v-bind:label="$trans('Supplier')"
                  label-for="supplier-reservation-supplier-name"
                >
                  <BFormInput
                    v-model="selectedSupplier.name"
                    id="supplier-reservation-supplier-name"
                    readonly
                    size="sm"
                    :state="isSubmitClicked ? !v$.supplierReservation.supplier.$error : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    :state="!v$.supplierReservation.supplier.$error">
                    {{ $trans('Please select a supplier') }}
                  </b-form-invalid-feedback>
                </BFormGroup>

                <BFormGroup
                  label-size="sm"
                  label-cols="12"
                  label-cols-md="3"
                  v-bind:label="$trans('Address')"
                  label-for="supplier-reservation-supplier-address"
                >
                  <BFormInput
                    v-model="selectedSupplier.address"
                    id="supplier-reservation-supplier-address"
                    readonly
                    size="sm"
                    :state="isSubmitClicked ? !v$.supplierReservation.supplier.$error : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.supplierReservation.supplier.$error : null">
                    {{ chooseErrorText }}
                  </b-form-invalid-feedback>
                </BFormGroup>

                <BFormGroup
                  label-size="sm"
                  label-cols="12"
                  label-cols-md="3"
                  v-bind:label="$trans('City')"
                  label-for="supplier-reservation-supplier-city"
                >
                  <BFormInput
                    v-model="selectedSupplier.city"
                    id="supplier-reservation-supplier-city"
                    size="sm"
                    readonly
                    :state="isSubmitClicked ? !v$.supplierReservation.supplier.$error : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.supplierReservation.supplier.$error : null">
                    {{ chooseErrorText }}
                  </b-form-invalid-feedback>
                </BFormGroup>

                <BFormGroup
                  label-size="sm"
                  label-cols="12"
                  label-cols-md="3"
                  v-bind:label="$trans('Email')"
                  label-for="supplier-reservation-supplier-email"
                >
                  <BFormInput
                    v-model="selectedSupplier.email"
                    id="supplier-reservation-supplier-email"
                    size="sm"
                    readonly
                    :state="isSubmitClicked ? !v$.supplierReservation.supplier.$error : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.supplierReservation.supplier.$error : null">
                    {{ chooseErrorText }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </fieldset>
            </div>
            <div class='panel col-1-3'>
              <div class="reservation-materials">
                <h6>{{$trans('Add product(s)')}}</h6>

                  <BFormGroup
                    label-size="sm"
                    v-bind:label="$trans('Search product')"
                  >
                    <VueMultiselect
                      id="reservation-material-name"
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
                    <b-form-invalid-feedback
                      :state="!v$.material.material.$error">
                      {{ $trans('Please select a product') }}
                    </b-form-invalid-feedback>
                  </BFormGroup>


                  <BFormGroup
                    label-size="sm"
                    v-bind:label="$trans('Name')"
                    label-for="reservation-material-name"
                    >
                  <BFormInput
                    id="reservation-material-name"
                    size="sm"
                    v-model="material.material_view.name"
                    readonly
                    :state="!v$.material.material.$error"
                    ></BFormInput>

                  </BFormGroup>

                  <BFormGroup
                    label-size="sm"
                    label-cols="3"
                    v-bind:label="$trans('Amount')"
                    label-for="reservation-material-amount"
                  >
                  <BFormInput
                    id="reservation-material-amount"
                    size="sm"
                    v-model="material.amount"
                    :state="!v$.material.amount.$error"
                    ref="amount"
                      ></BFormInput>
                      <b-form-invalid-feedback
                      :state="!v$.material.amount.$error">
                      {{ $trans('Please enter an amount') }}
                    </b-form-invalid-feedback>
                  </BFormGroup>

                  <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Remarks')"
                  label-for="reservation-material-remarks"
                  >
                  <BFormTextarea
                  id="reservation-material-remarks"
                  v-model="material.remarks"
                  rows="1"
                  ></BFormTextarea>
                </BFormGroup>

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

            </div>
            <div class="panel col-1-3">
              <h6>{{ $trans('Products') }}</h6>
              <b-table
                v-if="supplierReservation.materials.length > 0"
                small
                :fields="materialFields"
                :items="supplierReservation.materials" responsive="md"
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
            </div>
          </div>
        </b-form>
      </b-overlay>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue"
import { useRouter } from 'vue-router'
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import VueMultiselect from 'vue-multiselect'

import supplierReservationModel from '@/models/inventory/SupplierReservation.js'
import supplierReservationMaterialModel from '@/models/inventory/SupplierReservationMaterial.js'
import supplierModel from '@/models/inventory/Supplier.js'
import materialModel from '@/models/inventory/Material.js'
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";

const greaterThanZero = (value) => parseInt(value) > 0

// Stryker disable all : defineProps() is hoisted out of setup(), so it may not
// reference the locals Stryker's instrumentation introduces. Nothing to mutate here.
const props = defineProps({
  pk: {
    type: [String, Number],
    default: null
  },
})
// Stryker restore all

const {create} = useToast()
const router = useRouter()

const chooseErrorText = $trans('Please select a supplier')
const isLoading = ref(true)
const buttonDisabled = ref(false)
const submitClicked = ref(false)
const supplierReservation = ref(supplierReservationModel.getFields())
const material = ref(supplierReservationMaterialModel.getFields())

const suppliers = ref([])
const materialsSearch = ref([])
const selectedSupplier = ref({})

const isEditMaterial = ref(false)
// Was an undeclared instance property in the options API, so it was never
// reactive. It only ever gates doEditMaterial, which reads it in the same tick
// editMaterial sets it, but a ref costs nothing and is what the template
// binding would need if it ever grew one.
const editIndex = ref(null)

const materialFields = [
  { key: 'material_view.name', label: $trans('Name') },
  { key: 'amount', label: $trans('Amount') },
  { key: 'remarks', label: $trans('Remarks') },
  { key: 'icons', label: '' }
]

const deletedMaterials = ref([])

// Template ref for the amount input, focused after picking a product.
const amount = ref(null)

// Unlike the options API's bare useVuelidate(), the state is passed explicitly
// here, so validation follows supplierReservation/material through the
// reassignments in init() and loadData() instead of binding to whatever object
// existed at setup time.
const rules = {
  supplierReservation: {
    supplier: {
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

const v$ = useVuelidate(rules, {supplierReservation, material})

const isCreate = computed(() => !props.pk)
const isSubmitClicked = computed(() => submitClicked.value)
const isMaterialValid = computed(() => {
  v$.value.material.material.$touch()
  v$.value.material.amount.$touch()
  return !v$.value.material.amount.$invalid && !v$.value.material.material.$invalid
})

// materials
function deleteMaterial(index) {
  deletedMaterials.value.push(supplierReservation.value.materials[index])
  supplierReservation.value.materials.splice(index, 1)
}

function editMaterial(item, index) {
  editIndex.value = index
  isEditMaterial.value = true

  material.value = item
}

function emptyMaterial() {
  material.value = supplierReservationMaterialModel.getFields()
}

function cancelEditMaterial() {
  isEditMaterial.value = false
  emptyMaterial()
}

function doEditMaterial() {
  supplierReservation.value.materials.splice(editIndex.value, 1, material.value)
  editIndex.value = null
  isEditMaterial.value = false
  emptyMaterial()
}

function addMaterial() {
  if (!isMaterialValid.value) {
    return
  }
  supplierReservation.value.materials.push(material.value)
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

function materialLabel(material) {
  return `${material.name}`
}

function selectSupplier(option) {
  supplierReservation.value.supplier = option.id
  selectedSupplier.value = option

  getMaterials('')
}

async function getSuppliers(query) {
  isLoading.value = true

  try {
    supplierModel.setSearchQuery(query)
    const data = await supplierModel.list()
    suppliers.value = data.results
    isLoading.value = false
  } catch(error) {
    console.log('error fetching suppliers', error)
    errorToast(create, $trans('Error fetching suppliers'))
    isLoading.value = false
  }
}

function supplierLabel(supplier) {
  return `${supplier.name}, - ${supplier.city}`
}

async function getMaterials(query) {
  if (!selectedSupplier.value.id) {
    return
  }

  try {
    isLoading.value = true
    const data = await materialModel.listForSupplier(selectedSupplier.value.id, query)
    materialsSearch.value = data.results
    isLoading.value = false
  } catch(error) {
    console.log('error fetching products', error)
    errorToast(create, $trans('Error fetching products'))
    isLoading.value = false
  }
}

/**
 * Save the reservation's materials through the model layer.
 *
 * Links every material to `reservationPk`, then hands the collection and
 * the materials removed since the last load to the model, which inserts,
 * updates and deletes as needed. `hooks` is passed straight through to
 * updateCollection - see BaseModel.
 */
async function saveMaterials(reservationPk, hooks = {}) {
  for (const item of supplierReservation.value.materials) {
    item.reservation = reservationPk
  }

  supplierReservationMaterialModel.collection = supplierReservation.value.materials
  supplierReservationMaterialModel.deletedItems = deletedMaterials.value

  return supplierReservationMaterialModel.updateCollection(hooks)
}

async function submitForm() {
  submitClicked.value = true
  v$.value.supplierReservation.supplier.$touch()
  if (v$.value.supplierReservation.supplier.$invalid) {
    return
  }

  buttonDisabled.value = true
  isLoading.value = true

  if (isCreate.value) {
    try {
      const reservation = await supplierReservationModel.insert(supplierReservation.value)
      await saveMaterials(reservation.id)

      infoToast(create, $trans('Created'), $trans('Reservation has been created'))
      buttonDisabled.value = false
      isLoading.value = false
      router.go(-1)
    } catch(error) {
      console.log('Error creating reservation', error)
      errorToast(create, $trans('Error creating reservation'))
      buttonDisabled.value = false
      isLoading.value = false
    }

    return
  }

  try {
    await supplierReservationModel.update(props.pk, supplierReservation.value)
    infoToast(create, $trans('Updated'), $trans('Reservation has been updated'))

    // The hooks fire per item as updateCollection works through the
    // collection, so a material saved before a later failure keeps its
    // toast - which is what the hand-rolled loop this replaced did.
    await saveMaterials(props.pk, {
      onUpdated: () => infoToast(create, $trans('Product updated'), $trans('Reservation product has been updated')),
      onInserted: () => infoToast(create, $trans('Product created'), $trans('Reservation product has been created')),
      onDeleted: () => infoToast(create, $trans('Product removed'), $trans('Reservation product has been removed')),
    })

    buttonDisabled.value = false
    isLoading.value = false
    router.go(-1)
  } catch(error) {
    console.log('Error updating reservation', error)
    errorToast(create, $trans('Error updating reservation'))
    buttonDisabled.value = false
    isLoading.value = false
  }
}

async function loadData() {
  try {
    supplierReservation.value = await supplierReservationModel.detail(props.pk)
    selectedSupplier.value = supplierReservation.value.supplier_view

    await getMaterials('')
  } catch(error) {
    console.log('error fetching reservation', error)
    errorToast(create, $trans('Error fetching reservation'))
  }
}

function cancelForm() {
  router.go(-1)
}

// Was created(). Deliberately not awaited: setup() cannot be async without
// turning the component into an async one, and nothing below depends on it.
async function init() {
  isLoading.value = true

  await getSuppliers('')

  if (!isCreate.value) {
    await loadData()
  } else {
    supplierReservation.value = supplierReservationModel.getFields()
  }
  emptyMaterial()

  isLoading.value = false
}

init()

// The tests reach these through wrapper.vm, which for <script setup> only sees
// what is explicitly exposed.
defineExpose({
  supplierReservation,
  material,
  deletedMaterials,
  selectedSupplier,
  editIndex,
  isEditMaterial,
  isLoading,
  buttonDisabled,
  v$,
  selectSupplier,
  selectMaterial,
  editMaterial,
  doEditMaterial,
  deleteMaterial,
  getMaterials,
  submitForm,
})
</script>
