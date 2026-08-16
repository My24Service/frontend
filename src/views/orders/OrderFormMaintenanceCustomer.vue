<template>
  <b-overlay :show="isLoading" rounded="sm" v-if="order">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New order') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit order') }}</h2>
        <b-row>
          <b-col cols="2" role="group">
            <BFormGroup
              label-size="sm"
              label-class="p-sm-0"
              v-bind:label="$trans('Start date')"
              label-for="start_date"
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
          </b-col>
          <b-col cols="2" role="group">
            <BFormGroup
              label-size="sm"
              label-class="p-sm-0"
              :label="$trans('Start time')"
              label-for="start_time"
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
              >
                <template #trigger>
                  <p class="clock-icon">
                    <IBiClock></IBiClock>
                  </p>
                </template>
              </VueDatePicker>
              <b-form-invalid-feedback :state="stateOf('start_time')">
                {{ errorFor('start_time') || $trans('Please enter a valid start time HH:mm') }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </b-col>
          <b-col cols="2" role="group">
            <BFormGroup
              label-size="sm"
              label-class="p-sm-0"
              :label="$trans('End date')"
              label-for="end_date"
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
          </b-col>
          <b-col cols="2" role="group">
            <BFormGroup
              label-size="sm"
              :label="$trans('End time')"
              label-class="p-sm-0"
              label-for="end_time"
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
                {{ errorFor('end_time') || $trans('Please enter a valid end time HH:mm') }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </b-col>
          <b-col cols="4" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Customer ID')"
              label-class="p-sm-0"
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
        </b-row>
        <b-row>
          <b-col cols="6" role="group">
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
              <b-form-invalid-feedback :state="stateOf('order_name')">
                {{ errorFor('order_name') || $trans('Please enter the customer') }}
              </b-form-invalid-feedback>
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
              <b-form-invalid-feedback :state="stateOf('order_address')">
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
              <b-form-invalid-feedback :state="stateOf('order_postal')">
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
              <b-form-invalid-feedback :state="stateOf('order_city')">
                {{ errorFor('order_city') || $trans('Please enter the city') }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </b-col>
          <b-col cols="3" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Order type')"
              label-for="order_type"
              :state="stateOf('order_type')"
            >
              <OrderTypesSelect
                v-if="(!isCreate && !isLoading) || isCreate"
                v-model="order.order_type"
              />
              <b-form-invalid-feedback :state="stateOf('order_type')">
                {{ errorFor('order_type') }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </b-col>
          <b-col cols="3" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Order number')"
              label-for="service_number"
            >
              <BFormInput
                id="service_number"
                size="sm"
                v-model="order.service_number"
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
          <b-col cols="4" role="group">
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
          <b-col cols="4" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Remarks')"
              label-for="remarks"
            >
              <BFormTextarea
                id="remarks"
                v-model="order.remarks"
                rows="3"
              ></BFormTextarea>
            </BFormGroup>
          </b-col>
          <b-col cols="4" role="group">
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

        <div class="order-lines section">
          <Collapse
            :title="$trans('Order lines')"
          >
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
                  v-bind:label="$trans('Equipment')"
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
          </Collapse>
        </div>

        <div class="order-documents section">
          <div class="documents section">
            <DocumentsComponent
              :order="order"
              :is-view="false"
              ref="documentsComponent"
            />
          </div>
        </div>

        <div class="mx-auto">
          <footer class="modal-footer">
            <BButton @click="cancelForm" class="btn btn-secondary" type="button" variant="secondary">
              {{ $trans('Cancel') }}
            </BButton>
            <BButton @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
              {{ $trans('Submit') }}
            </BButton>
          </footer>
        </div>
      </b-form>
      <div class="bottom"></div>
    </div>
  </b-overlay>
</template>

<script lang="ts" setup>
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import moment from 'moment'
import { nl } from 'date-fns/locale'
import { useToast } from 'bootstrap-vue-next'

import { OrderService, OrderModel } from '@/models/orders/Order'
import { SchemaValidationError, type FieldErrors } from '@/models/schema'
import { CustomerService } from '@/models/customer/Customer.js'
import { OrderlineService } from '@/models/orders/Orderline'

import OrderTypesSelect from '@/components/OrderTypesSelect.vue'
import Collapse from '@/components/Collapse.vue'
import DocumentsComponent from '@/views/orders/order_form/DocumentsComponent.vue'

import { errorToast, infoToast, $trans } from '@/utils'
import { useMainStore } from '@/stores/main'
import { useAuthStore } from '@/stores/auth'

const props = withDefaults(defineProps<{ pk?: string | number | null }>(), { pk: null })

const { create } = useToast()
const router = useRouter()
const mainStore = useMainStore()
const authStore = useAuthStore()

const orderService = new OrderService()
const orderlineService = new OrderlineService()
const customerService = new CustomerService()

/**
 * The order the form binds to.
 *
 * `any` rather than `unknown` deliberately: every field is read and written by
 * name straight from the template, and the model it comes from
 * (`OrderModel`/the detail endpoint) is only partly typed. Narrowing happens on
 * the way out, where `orderService.insert`/`update` parse it against the
 * generated write schema.
 */
const order = ref<any>(null)
const isLoading = ref(false)
const buttonDisabled = ref(false)
const countries = ref<unknown[]>([])
const customer = ref<any>(null)

/**
 * A row of the order-lines table. Small and fully known, so it is stated rather
 * than left as `any`: the orderlines are posted to their own endpoint after the
 * order, and `id` is what decides insert vs update.
 */
interface Orderline {
  id?: number | null
  order?: number | string | null
  product?: string
  location?: string
  remarks?: string
}

// orderline entry fields
const editIndex = ref<number | null>(null)
const isEditOrderLine = ref(false)
const orderline_pk = ref<number | null>(null)
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

const start_time_date = ref(null)
const end_time_date = ref(null)

const documentsComponent = useTemplateRef<any>('documentsComponent')

/**
 * Validation state, produced by the generated Order write schema rather than by
 * a hand-maintained rule set.
 *
 * `orderService.insert`/`update` check the payload against the serializer the
 * backend will actually read it with - for this form always the *customer*
 * variant, since only a customer user reaches it - and refuse to send one that
 * fails. This form has no rules of its own; it renders what the model refused.
 *
 * Empty until the first submit: most fields arrive prefilled from the customer
 * record, and flagging them red before the user has done anything is noise.
 */
const errors = ref<FieldErrors>({})
const submitClicked = ref(false)

const isSubmitClicked = computed(() => submitClicked.value)
const isCreate = computed(() => !props.pk)

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

// Keep the range consistent: moving one end past the other drags the other with
// it, rather than letting the user submit an end date before its start.
watch(
  () => order.value?.start_date,
  (start) => {
    if (start && new Date(order.value.end_date) < new Date(start)) {
      order.value.end_date = start
    }
  },
)

watch(
  () => order.value?.end_date,
  (end) => {
    if (end && new Date(end) < new Date(order.value.start_date)) {
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

  orderline_pk.value = item.id ?? null
  product.value = item.product ?? ''
  location.value = item.location ?? ''
  remarks.value = item.remarks ?? ''
}

function emptyOrderLine() {
  orderline_pk.value = null
  product.value = ''
  location.value = ''
  remarks.value = ''
}

function doEditOrderLine() {
  order.value.orderlines.splice(editIndex.value, 1, {
    id: orderline_pk.value,
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

/**
 * Set the form's field errors from a failed save, and say whether the failure
 * was one.
 *
 * A `SchemaValidationError` carries one message per field and means nothing was
 * sent; anything else is a real request failure and belongs in an error toast.
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

  const orderlines: Orderline[] = order.value.orderlines

  if (isCreate.value) {
    try {
      // Only a customer user reaches this form, so the view reads the POST with
      // OrderCreateCustomerSerializer: no owner field, and the customer is
      // derived from the request. The schema shapes the payload too - the
      // form-only keys (orderlines, documents, service_number) are dropped and
      // the datepicker's Dates become `YYYY-MM-DD`.
      const newOrder = await orderService.insert(order.value, { role: 'customer' })

      // add orderlines
      try {
        for (const orderline of orderlines) {
          orderline.order = newOrder.id
          await orderlineService.insert(orderline)
        }
      } catch (error) {
        console.log('Error creating orderlines', error)
      }

      // add documents
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
    await orderService.update(props.pk!, order.value, { role: 'customer' })

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

/** Copy the customer's own details onto a new order as its contact block. */
function prefillFrom(record: any) {
  order.value.customer_relation = record.id
  order.value.customer_id = record.customer_id
  order.value.order_name = record.name
  order.value.order_address = record.address
  order.value.order_postal = record.postal
  // `order_city`, not `city`: the old code assigned `this.order.city`, a key no
  // schema and no input binds to, so the city arrived blank on every new order.
  order.value.order_city = record.city
  order.value.order_tel = record.tel
  order.value.order_mobile = record.mobile
  order.value.order_email = record.email
  order.value.order_contact = record.contact
  order.value.order_country_code = record.country_code
}

async function load() {
  isLoading.value = true

  moment.locale(mainStore.getCurrentLanguage ?? undefined)

  try {
    countries.value = mainStore.getCountries
    // The auth store's `userInfo` starts as null and is never typed beyond
    // that, so the shape this form needs from it is stated here. Only a
    // signed-in customer user routes to this view, so the pk is there in
    // practice; if it somehow is not, the throw lands in the catch below and
    // the user gets the same "could not load" toast as any other failure.
    const userInfo = authStore.userInfo as { user?: { customer_user?: { customer?: number } } } | null
    const customerPk = userInfo?.user?.customer_user?.customer

    if (!customerPk) {
      throw new Error('no customer on the signed-in user: cannot start an order')
    }

    customer.value = await customerService.detail(customerPk)

    if (isCreate.value) {
      order.value = new OrderModel()
      prefillFrom(customer.value)
    } else {
      order.value = await loadOrder()
      order.value.customer_relation = customer.value.id
      order.value.customer_id = customer.value.customer_id
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
  isSubmitClicked,
  submitForm,
  cancelForm,
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
<style scoped>
div.section {
  padding-bottom: 20px;
}
div.bottom {
  margin-bottom: 80px;
}
</style>
