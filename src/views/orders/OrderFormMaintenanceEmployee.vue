<template>
  <div class="app-page" v-if="order">
    <b-modal
      id="new-equipment-modal"
      ref="newEquipmentModal"
      v-bind:title="$trans('New equipment')"
      @ok="submitCreateEquipment"
      @cancel="cancelCreateEquipment"
    >
      <form ref="maintenance_equipment_new_equipment-form" @submit.stop.prevent="submitCreateEquipment">
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

    <b-modal
      id="new-location-modal"
      ref="newLocationModal"
      v-bind:title="$trans('New location')"
      @ok="submitCreateLocation"
      @cancel="cancelCreateLocation"
    >
      <form ref="new_location-form" @submit.stop.prevent="submitCreateLocation">
        <b-container fluid>
          <b-row role="group">
            <b-col size="12">
              <BFormGroup
                v-bind:label="$trans('Location name')"
                label-for="new_location"
              >
                <BFormInput
                  id="new_location"
                  size="sm"
                  v-model="newLocationName"
                ></BFormInput>
              </BFormGroup>
            </b-col>
          </b-row>
        </b-container>
      </form>
    </b-modal>

    <header>
      <div class="page-title">
        <h3 v-if="!pk">
          <IBiFileEarmarkPlus></IBiFileEarmarkPlus>
          <router-link :to="{name:'order-list'}">{{ $trans("Orders") }}</router-link> /
          <strong>{{ $trans("new") }}</strong>
        </h3>
        <h3 v-if="pk">
          <IBiFileEarmarkTextFill></IBiFileEarmarkTextFill>
          <router-link :to="{name:'order-list'}">{{ $trans("Orders") }}</router-link> /
          <router-link :to="{name: 'order-view', params: {pk}}">#<strong>{{ pk }}</strong></router-link>
          / {{ $trans("edit") }}
        </h3>

        <div class="flex-columns">
          <BButton
            @click="cancelForm"
            type="button"
            variant="secondary"
          >
            {{ $trans('Cancel') }}
          </BButton>
          <BButton
            type="submit"
            @click="submitForm"
            variant="primary">
            {{ $trans('Submit') }}
          </BButton>
        </div>
      </div>
    </header>

    <div class="page-detail">
      <ApiResult
        class="app-detail"
        v-if="order.hasOwnProperty('apiOk')"
        :error="order.error"
        :success-message='$trans("Order created")'
      />
      <div class="flex-columns">
        <div class="panel col-1-3">
          <h6>{{ $trans('Contact') }}</h6>

          <BFormGroup
            :label="$trans('Branch')"
            label-for="order_name"
            label-cols="3"
            :state="stateOf('order_name')"
          >
            <b-input-group>
              <BFormInput
                v-model="order.order_name"
                id="order_name"
                readonly
              ></BFormInput>
            </b-input-group>
            <b-form-invalid-feedback :state="stateOf('order_name')">
              {{ errorFor('order_name') }}
            </b-form-invalid-feedback>
          </BFormGroup>

        </div>
        <div class="panel col-1-3">
          <h6>{{ $trans("Order details") }}</h6>
          <BFormGroup
            v-bind:label="$trans('Order type')"
            label-for="order_type"
            label-cols="3"
            :state="stateOf('order_type')"
          >
            <OrderTypesSelect
              v-model="order.order_type"
            />
            <b-form-invalid-feedback :state="stateOf('order_type')">
              {{ errorFor('order_type') }}
            </b-form-invalid-feedback>
          </BFormGroup>

          <BFormGroup
            v-bind:label="$trans('Reference')"
            label-for="order_reference"
            label-cols="3">
            <BFormInput
              id="order_reference"
              v-model="order.order_reference"
            >
            </BFormInput>
          </BFormGroup>

          <BFormGroup
            v-bind:label="$trans('Customer reference')"
            label-for="customer_reference"
            label-cols="3">
            <BFormInput
              id="customer_reference"
              v-model="order.customer_reference"
            >
            </BFormInput>
          </BFormGroup>

          <BFormGroup
            v-bind:label="$trans('Remarks')"
            label-for="remarks"
            label-cols="3"
          >
            <BFormTextarea
              id="remarks"
              v-model="order.remarks"
              rows="3"
            ></BFormTextarea>
          </BFormGroup>

          <!-- order start/end times -->
          <h6>{{ $trans('Planning') }}</h6>
          <b-container>
            <b-row>
              <BFormGroup
                :label="$trans('Start date')"
                label-for="start_date"
                label-cols="3"
                :state="stateOf('start_date')"
              >
                <VueDatePicker
                  id="start_date"
                  v-model="order.start_date"
                  :placeholder="$trans('Select date')"
                  :locale="nl"
                  auto-apply
                  arrow-navigation
                  :state="stateOf('start_date')"
                  :formats="{ input: 'dd/MM/yyyy' }"
                ></VueDatePicker>
                <b-form-invalid-feedback :state="stateOf('start_date')">
                  {{ errorFor('start_date') || $trans('Please enter a start date') }}
                </b-form-invalid-feedback>
              </BFormGroup>

              <b-col cols="2"></b-col>

              <BFormGroup
                :label="$trans('Start time')"
                label-for="start_time"
                label-cols="3"
                :state="stateOf('start_time')"
              >
                <BFormInput
                  id="start_time"
                  v-model="order.start_time"
                  type="text"
                  placeholder="HH:mm"
                  class="time-input"
                ></BFormInput>
                <VueDatePicker
                  v-model="start_time_date"
                  id="start_time"
                  :placeholder="$trans('Set time')"
                  time-picker
                  arrow-navigation
                  :formats="{ input: 'HH:mm' }"
                >
                  <template #trigger>
                    <p class="clock-icon">
                      <IBiClock></IBiClock>
                    </p>
                  </template>
                </VueDatePicker>
                <b-form-invalid-feedback :state="stateOf('start_time')">
                  {{ errorFor('start_time') }}
                </b-form-invalid-feedback>
              </BFormGroup>
            </b-row>
          </b-container>

          <b-container>
            <b-row>
              <BFormGroup
                label-class=""
                v-bind:label="$trans('End date')"
                label-for="end_date"
                label-cols="3"
                :state="stateOf('end_date')"
              >
                <VueDatePicker
                  id="end_date"
                  v-model="order.end_date"
                  :placeholder="$trans('Select date')"
                  :locale="nl"
                  auto-apply
                  arrow-navigation
                  :state="stateOf('end_date')"
                  :formats="{ input: 'dd/MM/yyyy' }"
                ></VueDatePicker>
                <b-form-invalid-feedback :state="stateOf('end_date')">
                  {{ errorFor('end_date') || $trans('Please enter an end date') }}
                </b-form-invalid-feedback>
              </BFormGroup>

              <b-col cols="2"></b-col>

              <BFormGroup
                :label="$trans('End time')"
                label-class=""
                label-for="end_time"
                label-cols="3"
                :state="stateOf('end_time')"
              >
                <BFormInput
                  id="end_time"
                  v-model="order.end_time"
                  type="text"
                  class="time-input"
                  placeholder="HH:mm"
                ></BFormInput>
                <VueDatePicker
                  v-model="end_time_date"
                  id="end_time"
                  class="mb-2"
                  :placeholder="$trans('Set time')"
                  time-picker
                  arrow-navigation
                  :formats="{ input: 'HH:mm' }"
                >
                  <template #trigger>
                    <p class="clock-icon">
                      <IBiClock></IBiClock>
                    </p>
                  </template>
                </VueDatePicker>
                <b-form-invalid-feedback :state="stateOf('end_time')">
                  {{ errorFor('end_time') }}
                </b-form-invalid-feedback>
              </BFormGroup>
            </b-row>
          </b-container>
        </div>

        <div class="panel col-1-3">
          <div class="documents section">
            <DocumentsComponent
              :order="order"
              :is-view="false"
              ref="documentsComponent"
            />
          </div>

          <div class="order-lines section">
            <h6>{{$trans('Order lines')}}</h6>
            <b-container fluid="sm">
              <b-row
                v-for="(orderline, index) of order.orderlines"
                :key="orderline.id"
                no-gutters
                style="padding-bottom: 10px"
              >
                <b-col cols="9">
                  <b-container>
                    <b-row>
                      <b-col cols="12">{{ $trans("Product") }}: <b>{{ orderline.product }}</b></b-col>
                    </b-row>
                    <b-row>
                      <b-col cols="12">{{ $trans("Location") }}: <b>{{ orderline.location }}</b></b-col>
                    </b-row>
                    <b-row>
                      <b-col cols="12">{{ $trans("Remarks") }}: <b>{{ orderline.remarks }}</b></b-col>
                    </b-row>
                  </b-container>
                </b-col>
                <b-col cols="3">
                  <div class="float-right">
                    <BLink class="h5 mx-2" @click.prevent="editOrderLine(orderline, index)">
                      <IBiPencil></IBiPencil>
                    </BLink>
                    <BLink class="h5 mx-2" @click.prevent="deleteOrderLine(index)">
                      <IBiTrash></IBiTrash>
                    </BLink>
                  </div>
                </b-col>
                <b-col v-if="orderline.hasOwnProperty('apiOk')" cols="12">
                  <ApiResult
                    :error="orderline.error"
                    :success-message='$trans("Orderline created")'
                  />
                </b-col>
              </b-row>
            </b-container>

            <hr v-if="order.orderlines.length > 0"/>

            <div>
              <!-- equipment -->
              <h5 v-if="isEditOrderLine">{{ $trans("Edit") }}</h5>
              <h5 v-else>{{ $trans("New") }}</h5>
              <BFormGroup
                v-bind:label="$trans('Equipment')"
                cols="12">
                <VueMultiselect
                  id="maintenance-contract-equipment-name"
                  ref="multiselectEquipment"
                  track-by="id"
                  label="name"
                  :placeholder="$trans('(type to search)')"
                  open-direction="bottom"
                  :options="equipmentSearch"
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
                  @search-change="getEquipmentDebounced"
                  @select="selectEquipment"
                  :disabled="!equipmentFormSearchOk"
                >
                    <template #noResult>
                      <h5>{{ $trans('No equipment found') }}</h5>
                      <p v-if="canQuickCreateEquipment">
                        <BButton
                          @click="showAddEquipmentModal"
                          class="btn btn-primary"

                          type="button"
                          variant="primary"
                        >
                          {{ $trans("Add new equipment") }}
                        </BButton>
                      </p>
                    </template>
                </VueMultiselect>

                <span>
                    <strong>{{ product }}</strong>
                    <IBiCheck v-if="equipment"></IBiCheck>
                  </span>

              </BFormGroup>

              <!-- equipment locations -->
              <BFormGroup
                v-bind:label="$trans('Location')"
                cols="12"
              >
                <VueMultiselect
                  id="location-name"
                  ref="multiselectLocation"
                  track-by="id"
                  label="name"
                  :placeholder="$trans('(type to search)')"
                  open-direction="bottom"
                  :options="locationSearch"
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
                  @search-change="getLocationDebounced"
                  @select="selectLocation"
                  :disabled="!equipmentFormSearchOk || locationSearchDisabled"
                >
                    <template #noResult>
                      <h5>{{ $trans('No locations found') }}</h5>
                      <p v-if="canQuickCreateEquipmentLocation">
                        <BButton
                          @click="showAddLocationModal"
                          class="btn btn-primary"

                          type="button"
                          variant="primary"
                        >
                          {{ $trans("Add new location") }}
                        </BButton>
                      </p>
                    </template>
                </VueMultiselect>

                <span>
                    <strong>{{ location }}</strong>
                    <IBiCheck v-if="equipment_location"></IBiCheck>
                  </span>
              </BFormGroup>

              <!-- else: equipment remarks -->
              <BFormGroup
                  label-for="order-orderline-remarks"
                  v-bind:label="$trans('Remarks')"
              >
                <BFormTextarea
                  id="order-orderline-remarks"
                  v-model="remarks"
                  rows="1"
                ></BFormTextarea>
              </BFormGroup>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import moment from 'moment'
import { nl } from 'date-fns/locale'
import AwesomeDebouncePromise from 'awesome-debounce-promise'
import VueMultiselect from 'vue-multiselect'
import { useToast } from 'bootstrap-vue-next'

import { OrderService, OrderModel } from '@/models/orders/Order'
import { SchemaValidationError, type FieldErrors } from '@/models/schema'
import { BranchService } from '@/models/company/Branch'
import { EquipmentService } from '@/models/equipment/equipment'
import { LocationService } from '@/models/equipment/location'
import { OrderlineService } from '@/models/orders/Orderline'

import OrderTypesSelect from '@/components/OrderTypesSelect.vue'
import DocumentsComponent from '@/views/orders/order_form/DocumentsComponent.vue'

import { errorToast, infoToast, $trans } from '@/utils'
import { useCommon } from '@/mixins/common'
import { useMainStore } from '@/stores/main'

const props = withDefaults(defineProps<{ pk?: string | number | null }>(), { pk: null })

const { create } = useToast()
const router = useRouter()
const mainStore = useMainStore()
// The options-API mixin's computeds, as refs. Same getters, same stores.
const { hasBranches, isPlanning, isAdmin } = useCommon()

const equipmentService = new EquipmentService()
const orderService = new OrderService()
const branchService = new BranchService()
const locationService = new LocationService()
const orderlineService = new OrderlineService()

const order = ref<any>(null)
const isLoading = ref(false)
const buttonDisabled = ref(false)
const countries = ref<any[]>([])

// orderline being edited/created
const editIndex = ref<number | null>(null)
const isEditOrderLine = ref(false)
const orderline_pk = ref<number | null>(null)
const product = ref('')
const equipment = ref<number | null>(null)
const location = ref('')
const equipment_location = ref<number | null>(null)
const remarks = ref('')
const isEditEquipment = ref(false)
const deletedOrderlines = ref<any[]>([])

const equipmentSearch = ref<any[]>([])
const newEquipmentName = ref<string | null>(null)
const locationSearch = ref<any[]>([])
const newLocationName = ref<string | null>(null)
const locationSearchDisabled = ref(false)

const start_time_date = ref(null)
const end_time_date = ref(null)

const newEquipmentModal = useTemplateRef<any>('newEquipmentModal')
const newLocationModal = useTemplateRef<any>('newLocationModal')
const multiselectEquipment = useTemplateRef<any>('multiselectEquipment')
const multiselectLocation = useTemplateRef<any>('multiselectLocation')
const documentsComponent = useTemplateRef<any>('documentsComponent')

/**
 * Validation state, produced by the generated Order write schema rather than
 * by a hand-maintained rule set.
 *
 * The rules this form used to declare with vuelidate (order_name/address/
 * postal/city/start_date/end_date required) were a copy of the serializer's
 * `required`, kept in sync by hand. `orderService.insert`/`update` check
 * against the schema generated from the OpenAPI document instead and refuse to
 * send an order that fails it, so a field the backend starts or stops
 * requiring shows up here on the next codegen run rather than being noticed in
 * production. What this form does is render what the model refused; it has no
 * validation rules of its own.
 *
 * Empty until the first submit: this form's fields are mostly prefilled from
 * the branch, and flagging them red before the user has done anything is
 * noise.
 */
const errors = ref<FieldErrors>({})
const submitClicked = ref(false)

const isSubmitClicked = computed(() => submitClicked.value)
const isCreate = computed(() => !props.pk)
const equipmentFormSearchOk = computed(() => order.value?.branch !== null)
const canQuickCreateEquipment = computed(() => mainStore.getSettingEquipmentQuickCreate)
const canQuickCreateEquipmentLocation = computed(() => mainStore.getSettingEquipmentLocationQuickCreate)

/** The message to show under a field, or `''` while the form is still clean. */
function errorFor(field: string): string {
  return submitClicked.value ? (errors.value[field] ?? '') : ''
}

/**
 * A b-form `:state` for a field: `null` (neutral) until submit, then
 * false/true. Matches what the vuelidate-driven `:state` bindings did.
 */
function stateOf(field: string): boolean | null {
  return submitClicked.value ? !errors.value[field] : null
}

// equipment
function showAddEquipmentModal() {
  multiselectEquipment.value.deactivate()
  newEquipmentName.value = multiselectEquipment.value.$refs.search.value
  newEquipmentModal.value.show()
}

function cancelCreateEquipment() {
  newEquipmentModal.value.hide()
}

async function submitCreateEquipment() {
  multiselectEquipment.value.deactivate()

  try {
    if (!hasBranches.value) {
      const response = isPlanning.value || isAdmin.value ?
        await equipmentService.quickAddCustomerPlanning(newEquipmentName.value, order.value.customer_relation) :
        await equipmentService.quickAddCustomerNonPlanning(newEquipmentName.value)

      equipment.value = response.id
      product.value = response.name
    } else {
      const response = isPlanning.value || isAdmin.value ?
        await equipmentService.quickAddBranchPlanning(newEquipmentName.value, order.value.branch) :
        await equipmentService.quickAddBranchNonPlanning(newEquipmentName.value)

      equipment.value = response.id
      product.value = response.name
    }
  } catch (error) {
    console.log('Error adding equipment', error)
    errorToast(create, $trans('Error adding equipment'))
  }
}

async function getEquipment(query: string) {
  try {
    equipmentSearch.value = await equipmentService.searchBranchEmployee(query)
  } catch (error) {
    console.log('Error searching equipment', error)
    errorToast(create, $trans('Error searching equipment'))
  }
}

function selectEquipment(option: any) {
  equipment.value = option.id
  product.value = option.name

  if (option.location) {
    equipment_location.value = option.location.id
    location.value = option.location.name
    locationSearchDisabled.value = true
  }
}

// equipment locations
function showAddLocationModal() {
  multiselectLocation.value.deactivate()
  newLocationName.value = multiselectLocation.value.$refs.search.value
  newLocationModal.value.show()
}

function cancelCreateLocation() {
  newLocationModal.value.hide()
}

async function submitCreateLocation() {
  multiselectLocation.value.deactivate()

  try {
    if (!hasBranches.value) {
      const response = isPlanning.value || isAdmin.value ?
        await locationService.quickAddCustomerPlanning(newLocationName.value, order.value.customer_relation) :
        await locationService.quickAddCustomerNonPlanning(newLocationName.value)

      equipment_location.value = response.id
      location.value = response.name
    } else {
      const response = isPlanning.value || isAdmin.value ?
        await locationService.quickAddBranchPlanning(newLocationName.value, order.value.branch) :
        await locationService.quickAddBranchNonPlanning(newLocationName.value)

      equipment_location.value = response.id
      location.value = response.name
    }
  } catch (error) {
    console.log('Error adding location', error)
    errorToast(create, $trans('Error adding location'))
  }
}

async function getLocation(query: string) {
  try {
    // LocationService.searchBranchEmployee takes only the query - the backend
    // scopes the result to the employee's own branch.
    locationSearch.value = await locationService.searchBranchEmployee(query)
  } catch (error) {
    console.log('Error searching location', error)
    errorToast(create, $trans('Error searching location'))
  }
}

function selectLocation(option: any) {
  equipment_location.value = option.id
  location.value = option.name
}

const getEquipmentDebounced = AwesomeDebouncePromise(getEquipment, 500)
const getLocationDebounced = AwesomeDebouncePromise(getLocation, 500)

// order lines
function deleteOrderLine(index: number | string) {
  deletedOrderlines.value.push(order.value.orderlines[index])
  order.value.orderlines.splice(Number(index), 1)
}

function editOrderLine(item: any, index: number | string) {
  editIndex.value = Number(index)
  isEditOrderLine.value = true

  orderline_pk.value = item.id
  product.value = item.product
  location.value = item.location
  remarks.value = item.remarks

  if (item.equipment && item.equipment_location) {
    equipment_location.value = item.equipment_location
    equipment.value = item.equipment
    isEditEquipment.value = true
  }
}

function emptyOrderLine() {
  orderline_pk.value = null
  product.value = ''
  location.value = ''
  remarks.value = ''
  equipment_location.value = null
  equipment.value = null
}

/**
 * Set the form's field errors from a failed save, and say whether the failure
 * was one.
 *
 * `orderService.insert`/`update` validate against the generated write schema
 * before issuing any request and throw a `SchemaValidationError` carrying one
 * message per field, so the form does not run its own validation pass - it
 * reports what the model refused. Anything else is a real request failure and
 * belongs in the caller's error toast.
 */
function reportSchemaErrors(error: unknown): boolean {
  if (!(error instanceof SchemaValidationError)) {
    return false
  }

  errors.value = error.errors
  console.log('invalid order', error.errors)
  return true
}

async function submitForm() {
  submitClicked.value = true
  errors.value = {}

  buttonDisabled.value = true
  isLoading.value = true

  const orderlines = order.value.orderlines

  if (isCreate.value) {
    try {
      // The order goes in as the form holds it: the model validates it, drops
      // the form-only keys the serializer does not accept (orderlines,
      // infolines, documents), renders the datepicker's Dates as `YYYY-MM-DD`
      // and pads the `HH:mm` time inputs. The role says which create serializer
      // to check against - this form is only ever used by a branch employee,
      // whose POST the view reads with OrderCreateBranchEmployeeSerializer.
      const newOrder = await orderService.insert(order.value, { role: 'branchEmployee' })

      // add orderlines
      try {
        for (const orderline of orderlines) {
          orderline.order = newOrder.id
          await orderlineService.insert(orderline)
        }
      } catch (error) {
        console.log('Error creating infolines', error)
      }

      // insert documents
      documentsComponent.value.orderCreated(newOrder)

      infoToast(create, $trans('Created'), $trans('Order has been created'))
      buttonDisabled.value = false
      isLoading.value = false
      router.go(-1)
    } catch (error) {
      isLoading.value = false
      buttonDisabled.value = false

      if (reportSchemaErrors(error)) {
        return
      }

      console.log('Error creating order', error)
      errorToast(create, $trans('Error creating order'))
    }

    return
  }

  try {
    await orderService.update(props.pk!, order.value, { role: 'branchEmployee' })

    for (const orderline of orderlines) {
      orderline.order = props.pk
      if (orderline.id) {
        await orderlineService.update(orderline.id, orderline)
      } else {
        await orderlineService.insert(orderline)
      }
    }

    for (const orderline of deletedOrderlines.value) {
      if (orderline.id) {
        await orderlineService.delete(orderline.id)
      }
    }

    infoToast(create, $trans('Updated'), $trans('Order has been updated'))
    isLoading.value = false
    buttonDisabled.value = false
    router.go(-1)
  } catch (error) {
    isLoading.value = false
    buttonDisabled.value = false

    if (reportSchemaErrors(error)) {
      return
    }

    console.log('Error updating order', error)
    errorToast(create, $trans('Error updating order'))
  }
}

async function loadOrder() {
  const loaded = await orderService.detail(props.pk!)
  loaded.start_date = moment(loaded.start_date, 'DD/MM/YYYY').toDate()
  loaded.end_date = moment(loaded.end_date, 'DD/MM/YYYY').toDate()

  return loaded
}

function cancelForm() {
  router.go(-1)
}

async function load() {
  isLoading.value = true

  moment.locale(mainStore.getCurrentLanguage ?? undefined)

  try {
    countries.value = mainStore.getCountries
    const branch = await branchService.getMyBranch()

    if (isCreate.value) {
      order.value = new OrderModel()
      order.value.branch = branch.id
      order.value.order_name = branch.name
      order.value.order_address = branch.address
      order.value.order_postal = branch.postal
      order.value.order_city = branch.city
      order.value.order_country_code = branch.country_code
      order.value.order_tel = branch.tel
      order.value.order_mobile = branch.mobile
      order.value.order_email = branch.email
      order.value.order_contact = branch.contact
    } else {
      order.value = await loadOrder()
      order.value.branch = branch.id
    }

    isLoading.value = false
  } catch (error) {
    console.log('error loading order', error)
    errorToast(create, $trans('Error fetching order data'))
    isLoading.value = false
  }
}

load()

// `<script setup>` closes the instance, so what the specs drive has to be said
// out loud. This is the component's test surface, nothing more.
defineExpose({
  order,
  errors,
  errorFor,
  stateOf,
  isLoading,
  buttonDisabled,
  submitClicked,
  submitForm,
  cancelForm,
  selectEquipment,
  selectLocation,
  editOrderLine,
  emptyOrderLine,
  deleteOrderLine,
  deletedOrderlines,
  equipment,
  equipment_location,
  product,
  location,
  remarks,
  isEditOrderLine,
})
</script>
<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
<style scoped>
.time-input {
  width: 100px !important;
  float:left !important;
}
.clock-icon {
  margin: .5em auto auto;
}
</style>
