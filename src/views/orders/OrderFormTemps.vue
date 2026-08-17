<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <b-row>
          <b-col cols="4" role="group">
            <BFormGroup
              label-size="sm"
              label-class="p-sm-0"
              v-bind:label="$trans('Search existing address')"
              label-for="order-customer-search"
            >
              <VueMultiselect
                id="order-customer-search"
                track-by="id"
                :placeholder="$trans('Type to search')"
                open-direction="bottom"
                :options="customers"
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
                @search-change="getCustomers"
                @select="selectCustomer"
                :custom-label="customerLabel"
              >
                <template #noResult>{{ $trans('Oops! No elements found. Consider changing the search query.') }}</template>
              </VueMultiselect>
            </BFormGroup>
          </b-col>
          <b-col cols="2" role="group">
            <BFormGroup
              label-size="sm"
              label-class="p-sm-0"
              v-bind:label="$trans('Start date')"
              label-for="start_date"
            >
              <VueDatePicker
                id="start_date"
                size="sm"
                class="p-sm-0"
                v-model="order.start_date"
                :placeholder="$trans('Choose a date')"
                :state="stateOf('start_date')"
                :locale="nl"
                auto-apply
                arrow-navigation
                :formats="{ input: 'dd/MM/yyyy' }"
              ></VueDatePicker>
              <b-form-invalid-feedback
                :state="stateOf('start_date')">
                {{ errorFor('start_date') || $trans('Please enter a start date') }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </b-col>
          <b-col cols="2" role="group">
            <BFormGroup
              label-size="sm"
              label-class="p-sm-0"
              v-bind:label="$trans('Start time')"
              label-for="start_time"
            >
              <b-form-timepicker
                id="start_time"
                size="sm"
                v-model="order.start_time"
                placeholder="Choose a time"
                :hour12=false
              ></b-form-timepicker>
            </BFormGroup>
          </b-col>
          <b-col cols="2" role="group">
            <BFormGroup
              label-size="sm"
              label-class="p-sm-0"
              v-bind:label="$trans('End date')"
              label-for="end_date"
            >
              <VueDatePicker
                id="end_date"
                size="sm"
                v-model="order.end_date"
                class="mb-2"
                v-bind:placeholder="$trans('Choose a date')"
                :state="stateOf('end_date')"
                :locale="nl"
                auto-apply
                arrow-navigation
                :formats="{ input: 'dd/MM/yyyy' }"
              ></VueDatePicker>
              <b-form-invalid-feedback
                :state="stateOf('end_date')">
                {{ errorFor('end_date') || $trans('Please enter an end date') }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </b-col>
          <b-col cols="2" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('End time')"
              label-class="p-sm-0"
              label-for="end_time"
            >
              <b-form-timepicker
                id="end_time"
                size="sm"
                v-model="order.end_time"
                class="mb-2"
                v-bind:placeholder="$trans('Choose a time')"
                :hour12=false
              ></b-form-timepicker>
            </BFormGroup>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="4" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Customer')"
              label-for="order_name"
            >
              <BFormInput
                v-model="order.order_name"
                id="order_name"
                size="sm"
                :state="stateOf('order_name')"
              ></BFormInput>
              <b-form-invalid-feedback
                :state="stateOf('order_name')">
                {{ errorFor('order_name') || $trans('Please enter the customer') }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </b-col>
          <b-col cols="2" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Customer ID')"
              label-for="customer_id"
            >
              <BFormInput
                v-model="order.customer_id"
                readonly
                id="customer_id"
                size="sm"
                :state="stateOf('customer_id')"
              ></BFormInput>
            </BFormGroup>
          </b-col>
          <b-col cols="4" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Address')"
              label-for="order_address"
            >
              <BFormInput
                id="order_address"
                size="sm"
                v-model="order.order_address"
                :state="stateOf('order_address')"
              ></BFormInput>
              <b-form-invalid-feedback
                :state="stateOf('order_address')">
                {{ errorFor('order_address') || $trans('Please enter the address') }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </b-col>
          <b-col cols="2" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Country')"
              label-for="order_country_code"
            >
              <BFormSelect v-model="order.order_country_code" :options="countries" size="sm"></BFormSelect>
            </BFormGroup>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="2" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Postal')"
              label-for="order_postal"
            >
              <BFormInput
                id="order_postal"
                size="sm"
                v-model="order.order_postal"
                :state="stateOf('order_postal')"
              ></BFormInput>
              <b-form-invalid-feedback
                :state="stateOf('order_postal')">
                {{ errorFor('order_postal') || $trans('Please enter the postal') }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </b-col>
          <b-col cols="4" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('City')"
              label-for="order_city"
            >
              <BFormInput
                id="order_city"
                size="sm"
                v-model="order.order_city"
                :state="stateOf('order_city')"
              ></BFormInput>
              <b-form-invalid-feedback
                :state="stateOf('order_city')">
                {{ errorFor('order_city') || $trans('Please enter the city') }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </b-col>
          <b-col cols="3" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Order type')"
              label-for="order_type"
            >
              <OrderTypesSelect
                v-if="(!isCreate && !isLoading) || isCreate"
                v-model="order.order_type"
              />
            </BFormGroup>
          </b-col>
          <b-col cols="3" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Required users')"
              label-for="required_users"
            >
              <BFormInput
                id="required_users"
                size="sm"
                v-model="order.required_users"
              ></BFormInput>
            </BFormGroup>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="2" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Reference')"
              label-for="order_reference"
            >
              <BFormInput
                id="order_reference"
                size="sm"
                v-model="order.order_reference"
              ></BFormInput>
            </BFormGroup>
          </b-col>
          <b-col cols="4" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Email')"
              label-for="order_email"
            >
              <BFormInput
                id="order_email"
                size="sm"
                v-model="order.order_email"
              ></BFormInput>
            </BFormGroup>
          </b-col>
          <b-col cols="3" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Mobile')"
              label-for="order_mobile"
            >
              <BFormInput
                id="order_mobile"
                size="sm"
                v-model="order.order_mobile"
              ></BFormInput>
            </BFormGroup>
          </b-col>
          <b-col cols="3" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Tel.')"
              label-for="order_tel"
            >
              <BFormInput
                id="order_tel"
                size="sm"
                v-model="order.order_tel"
              ></BFormInput>
            </BFormGroup>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="6" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Contacts')"
              label-for="order_contact"
            >
              <BFormTextarea
                id="order_contact"
                v-model="order.order_contact"
                rows="3"
              ></BFormTextarea>
            </BFormGroup>
          </b-col>
          <b-col cols="6" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Customer remarks')"
              label-for="customer_remarks"
            >
              <BFormTextarea
                id="customer_remarks"
                v-model="order.customer_remarks"
                rows="3"
              ></BFormTextarea>
            </BFormGroup>
          </b-col>
        </b-row>

        <div class="order-orderlines">
          <h4>{{ $trans('Order lines') }}</h4>
          <b-row>
            <b-col cols="12">
              <b-table v-if="order.orderlines.length > 0" small :fields="orderLineFields" :items="order.orderlines" responsive="md">
                <template #cell()="data">
                  {{ data.value }}
                </template>
                <template #cell(icons)="data">
                  <div class="float-right">
                    <BLink class="h5 mx-2" @click="editOrderLine(data.item, data.index)">
                      <IBiPencil></IBiPencil>
                    </BLink>
                    <BLink class="h5 mx-2" @click.prevent="deleteOrderLine(data.index)">
                      <IBiTrash></IBiTrash>
                    </BLink>
                  </div>
                </template>
              </b-table>
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="4" role="group">
              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Product')"
                label-for="order-orderline-product"
              >
                <BFormInput
                  id="order-orderline-product"
                  size="sm"
                  v-model="product"
                ></BFormInput>
              </BFormGroup>
            </b-col>
            <b-col cols="4" role="group">
              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Location')"
                label-for="order-orderline-location"
              >
                <BFormInput
                  id="order-orderline-location"
                  size="sm"
                  v-model="location"
                ></BFormInput>
              </BFormGroup>
            </b-col>
            <b-col cols="4" role="group">
              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Remarks')"
                label-for="order-orderline-remarks"
              >
                <BFormTextarea
                  id="order-orderline-remarks"
                  v-model="remarks"
                  rows="1"
                ></BFormTextarea>
              </BFormGroup>
            </b-col>
          </b-row>
          <footer class="modal-footer">
            <BButton v-if="isEditOrderLine" @click="doEditOrderLine" class="btn btn-primary" size="sm" type="button" variant="warning">
              {{ $trans('Edit orderline') }}
            </BButton>
            <BButton v-if="!isEditOrderLine" @click="addOrderLine" class="btn btn-primary" size="sm" type="button" variant="primary">
              {{ $trans('Add orderline') }}
            </BButton>
          </footer>
        </div>

        <div class="mx-auto">
          <footer class="modal-footer" v-if="!unaccepted">
            <BButton
              @click="cancelForm"
              class="btn btn-secondary"
              type="button"
              variant="secondary"
            >
              {{ $trans('Cancel') }}
            </BButton>
            <BButton
              @click="submitForm"
              :disabled="buttonDisabled"
              class="btn btn-primary"
              type="button"
              variant="primary"
            >
              {{ $trans('Submit') }}
            </BButton>
          </footer>
          <footer class="modal-footer" v-if="!isCreate && (unaccepted || !order.customer_order_accepted)">
            <BButton
              @click="reject"
              class="btn btn-danger"
              type="button"
              variant="danger"
            >
              {{ $trans('Reject') }}
            </BButton>
            <BButton
              @click="editAndAccept"
              :disabled="buttonDisabled"
              class="btn btn-primary"
              type="button"
              variant="primary"
            >
              {{ $trans('Edit and accept') }}
            </BButton>
          </footer>
        </div>
      </b-form>
    </div>
  </b-overlay>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import moment from 'moment'
import { nl } from 'date-fns/locale'
import VueMultiselect from 'vue-multiselect'
import { useToast } from 'bootstrap-vue-next'

import { OrderModel, OrderService } from '@/models/orders/Order'
import { SchemaValidationError, type FieldErrors } from '@/models/schema'
import type { OrderWriteContext } from '@/models/orders/order-schemas'
import { CustomerService } from '@/models/customer/Customer.js'
import { OrderlineService } from '@/models/orders/Orderline'

import OrderTypesSelect from '@/components/OrderTypesSelect.vue'

import { errorToast, infoToast, $trans } from '@/utils'
import { useCommon } from '@/mixins/common'
import { useMainStore } from '@/stores/main'

const props = withDefaults(
  defineProps<{ pk?: string | number | null; unaccepted?: boolean }>(),
  { pk: null, unaccepted: false },
)

const { create } = useToast()
const router = useRouter()
const mainStore = useMainStore()
const { hasBranches, isCustomer, isBranchEmployee } = useCommon()

const orderService = new OrderService()
const orderlineService = new OrderlineService()
const customerService = new CustomerService()

/**
 * The order the form binds to. `any` rather than `unknown`: every field is read
 * by name from the template. It is narrowed on the way out, by the write schema.
 */
const order = ref<any>(new OrderModel({}))

const isLoading = ref(false)
const buttonDisabled = ref(false)
const acceptOrder = ref(false)
const countries = ref<unknown[]>([])
const orderTypes = ref<unknown[]>([])
const customers = ref<any[]>([])

/** A row of the order-lines table, posted to its own endpoint after the order. */
interface Orderline {
  id?: number | null
  order?: number | string | null
  product?: string
  location?: string
  remarks?: string
}

const editIndex = ref<number | null>(null)
const isEditOrderLine = ref(false)
const product = ref('')
const location = ref('')
const remarks = ref('')
const deletedOrderlines = ref<Orderline[]>([])

const orderLineFields = [
  { key: 'product', label: $trans('Product') },
  { key: 'location', label: $trans('Location') },
  { key: 'remarks', label: $trans('Remarks') },
  { key: 'icons', label: '' },
]

/**
 * Validation state. This form declares no rules of its own; it renders what
 * `orderService.insert`/`update` refused, one message per field.
 */
const errors = ref<FieldErrors>({})
const submitClicked = ref(false)

/**
 * Who the backend will read this write as. Derived, not fixed: `OrderForm`
 * picks this form on member *type*, so every role lands here. Same order of
 * checks as `OrderViewSet.create`.
 */
const writeContext = computed<OrderWriteContext>(() => {
  if (isCustomer.value) {
    return { role: 'customer' }
  }

  if (isBranchEmployee.value) {
    return { role: 'branchEmployee' }
  }

  return { role: 'planning', hasBranches: hasBranches.value }
})

const isSubmitClicked = computed(() => submitClicked.value)
const isCreate = computed(() => !props.pk)

/** The message to show under a field, or `''` while the form is still clean. */
function errorFor(field: string): string {
  return submitClicked.value ? (errors.value[field] ?? '') : ''
}

/** A b-form `:state`: `null` (neutral) until submit, then false/true. */
function stateOf(field: string): boolean | null {
  return submitClicked.value ? !errors.value[field] : null
}

// Keep the range consistent: moving one end past the other drags the other with
// it, rather than letting the user submit an end date before its start.
watch(
  () => order.value?.start_date,
  (start) => {
    if (start && order.value.end_date && new Date(order.value.end_date) < new Date(start)) {
      order.value.end_date = start
    }
  },
)

watch(
  () => order.value?.end_date,
  (end) => {
    if (end && order.value.start_date && new Date(end) < new Date(order.value.start_date)) {
      order.value.start_date = end
    }
  },
)

// order lines
function deleteOrderLine(index: number | string) {
  deletedOrderlines.value.push(order.value.orderlines[index])
  order.value.orderlines.splice(Number(index), 1)
}

function editOrderLine(item: Orderline, index: number | string) {
  editIndex.value = Number(index)
  isEditOrderLine.value = true

  product.value = item.product ?? ''
  location.value = item.location ?? ''
  remarks.value = item.remarks ?? ''
}

function emptyOrderLine() {
  product.value = ''
  location.value = ''
  remarks.value = ''
}

function doEditOrderLine() {
  order.value.orderlines.splice(editIndex.value, 1, {
    product: product.value,
    location: location.value,
    remarks: remarks.value,
  })

  editIndex.value = null
  isEditOrderLine.value = false
  emptyOrderLine()
}

function addOrderLine() {
  order.value.orderlines.push({
    product: product.value,
    location: location.value,
    remarks: remarks.value,
  })

  emptyOrderLine()
}

function customerLabel({ name, city }: { name: string; city: string }) {
  return `${name} - ${city}`
}

function selectCustomer(option: any) {
  // `customer_relation` as well as `customer_id`: the id is the customer's own
  // reference string, the relation is the FK the create serializer wants. Only
  // the string was copied before, so the order could never validate.
  order.value.customer_relation = option.id
  order.value.customer_id = option.customer_id
  order.value.order_name = option.name
  order.value.order_address = option.address
  order.value.order_city = option.city
  order.value.order_postal = option.postal
  order.value.order_country_code = option.country_code
  order.value.order_tel = option.tel
  order.value.order_mobile = option.mobile
  order.value.order_email = option.email
  order.value.order_contact = option.contact
  order.value.customer_remarks = option.remarks
}

async function getCustomers(query: string) {
  isLoading.value = true

  try {
    customers.value = await customerService.search(query)
  } catch (error) {
    console.log('Error fetching customers', error)
    errorToast(create, $trans('Error fetching customers'))
  }

  isLoading.value = false
}

/**
 * Report a rejected payload next to the inputs, and say whether that is what
 * this was. Anything else is a request failure and belongs in a toast.
 */
function reportSchemaErrors(error: unknown): boolean {
  if (!(error instanceof SchemaValidationError)) {
    return false
  }

  errors.value = error.errors
  console.log('invalid order', error.errors)
  return true
}

/** Save the orderlines against their order, and delete the ones removed here. */
async function saveOrderlines(orderlines: Orderline[], orderPk: number | string) {
  for (const orderline of orderlines) {
    orderline.order = orderPk

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
}

async function submitForm() {
  submitClicked.value = true
  errors.value = {}

  buttonDisabled.value = true
  isLoading.value = true

  const orderlines: Orderline[] = order.value.orderlines

  if (isCreate.value) {
    try {
      // The order goes in as the form holds it; the model validates it against
      // this user's serializer and shapes the payload.
      const newOrder = await orderService.insert(order.value, writeContext.value)

      try {
        await saveOrderlines(orderlines, newOrder.id)
      } catch (error) {
        console.log('Error creating orderlines', error)
      }

      infoToast(create, $trans('Created'), $trans('Order has been created'))
      buttonDisabled.value = false
      isLoading.value = false

      if (confirm($trans('Do you want to add documents to this order?'))) {
        await router.push({ name: 'order-document-add', params: { orderPk: newOrder.id } })
      } else {
        router.go(-1)
      }
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
    await orderService.update(props.pk!, order.value, writeContext.value)
    await saveOrderlines(orderlines, props.pk!)

    infoToast(create, $trans('Updated'), $trans('Order has been updated'))
  } catch (error) {
    isLoading.value = false
    buttonDisabled.value = false

    if (reportSchemaErrors(error)) {
      return
    }

    console.log('Error updating order', error)
    errorToast(create, $trans('Error updating order'))
    return
  }

  // The second half of "edit and accept", so it runs after the update
  // succeeded - not, as it used to, after a `try` whose every path returned.
  if (acceptOrder.value) {
    try {
      await orderService.setAccepted(props.pk!)
      infoToast(create, $trans('Accepted'), $trans('Order has been accepted'))
    } catch (error) {
      console.log('Error accepting order', error)
      errorToast(create, $trans('Error accepting order'))
    }
  }

  isLoading.value = false
  buttonDisabled.value = false
  router.go(-1)
}

async function editAndAccept() {
  buttonDisabled.value = true
  acceptOrder.value = true
  await submitForm()
}

async function reject() {
  await orderService.setRejected(props.pk!)
  cancelForm()
}

async function loadOrder() {
  isLoading.value = true

  try {
    const loaded = await orderService.detail(props.pk!)
    loaded.start_date = moment(loaded.start_date, 'DD/MM/YYYY').toDate()
    loaded.end_date = moment(loaded.end_date, 'DD/MM/YYYY').toDate()

    order.value = loaded
  } catch (error) {
    console.log('error fetching order', error)
    errorToast(create, $trans('Error fetching order'))
  }

  isLoading.value = false
}

function cancelForm() {
  router.go(-1)
}

async function load() {
  moment.locale(mainStore.getCurrentLanguage ?? undefined)

  countries.value = mainStore.getCountries
  orderTypes.value = await mainStore.getOrderTypes

  if (isCreate.value) {
    order.value = new OrderModel({})
    await getCustomers('')
  } else {
    await loadOrder()
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
  writeContext,
  submitForm,
  editAndAccept,
  reject,
  cancelForm,
  selectCustomer,
  getCustomers,
  customers,
  addOrderLine,
  doEditOrderLine,
  editOrderLine,
  emptyOrderLine,
  deleteOrderLine,
  deletedOrderlines,
  product,
  location,
  remarks,
  isEditOrderLine,
  editIndex,
})
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
