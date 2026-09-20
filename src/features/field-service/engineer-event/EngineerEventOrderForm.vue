<template>
  <b-modal
    id="attach-order-modal"
    ref="attach-order-modal"
    v-bind:title="$trans('Attach order')"
    @ok="submitForm"
    @cancel="cancelForm"
  >
    <div>
      <h4>{{ $trans("No order found, create one")}}</h4>
      <div class="container app-form">
        <b-form>
          <b-row>
            <b-col cols="8" role="group">
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
                  :loading="customersLoading"
                  :internal-search="false"
                  :options-limit="30"
                  :limit="10"
                  :max-height="600"
                  :hide-selected="true"
                  @search-change="onCustomerSearch"
                  @select="selectCustomer"
                  :custom-label="customerLabel"
                >
                  <template #noResult>{{ $trans('Nothing found.') }}</template>
                </VueMultiselect>
              </BFormGroup>
            </b-col>
            <b-col cols="4" role="group">
              <BFormGroup
                label-size="sm"
                label-class="p-sm-0"
                v-bind:label="$trans('Licence plate')"
                label-for="order_reference"
              >
                <BFormInput
                  id="order_reference"
                  size="sm"
                  class="p-sm-0"
                  v-model="order.order_reference"
                ></BFormInput>
              </BFormGroup>
            </b-col>
          </b-row>
        </b-form>
        <b-row>
          <b-col cols="12" role="group">
            <h5 v-if="order.order_name || order.order_reference">{{ order.order_name }} - {{ order.order_reference }}</h5>
          </b-col>
        </b-row>
      </div>
    </div>
  </b-modal>
</template>

<script lang="ts" setup>
import moment from 'moment'
import VueMultiselect from 'vue-multiselect'

import {
  companyEngineereventUpdatePartialUpdateMutation,
  companyEngineerRetrieveOptions,
  customerCustomerAutocompleteListOptions,
  orderOrderCreateMutation,
} from '@/api/@tanstack/vue-query.gen'
import type {
  CompanyEngineereventUpdatePartialUpdateData,
  CustomerAutocomplete,
  Engineer,
  OrderOrderCreateData,
  PatchedEngineerEventRequest,
} from '@/api/types.gen'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { errorToast, $trans } from '@/services/i18n'

import { useOrderAssignment } from '../assignment/use-order-assignment'
import { invalidateEngineerEvents } from './invalidation'

/**
 * The "Attach order" modal the events list mounts: pick the customer whose
 * address the order is for, and the modal creates the order, assigns it to the
 * engineer the event belongs to, and writes the assignment back onto the event.
 *
 * This is the form that retires `src/models/mobile/Assign.js`. The Shim was
 * one method over `mobileAssignUserCreate`; the assign now goes through
 * `useOrderAssignment`, the composable this Slice's dispatch board and trip
 * screens already share — same request, one declaration of it in
 * `assignment/` instead of one per caller, and the assign still makes the
 * dispatch board's queries stale, which the Shim never did.
 *
 * The order it creates goes out through the generated `orderOrderCreate`. The
 * one thing that keeps the body off the declared schema is `order_type`: every
 * variant of `vOrderCreateRequestRequest` (openapi/schema.yaml
 * `OrderCreate*Request`) requires a non-empty string, while the modal never
 * asks for one and the backend's own field is
 * `models.Order.order_type = CharField(max_length=30, null=True, blank=True)`
 * — `required=False, allow_null=True` on the serializer, so a create without
 * a type is what this modal means and what the API accepts (my24service
 * `apps/order/models/order.py:72`). The generated operation's request
 * validator runs outside its own try/catch, so it would reject the body before
 * it left, and `requestValidator: undefined` is the switch this call site
 * needs because of that gap. It is the last one in this Slice: the other call
 * sites that pulled it did so for parameters the backend has since declared
 * (Slice README, "The schema does not describe this Slice's endpoints").
 * **The fix is the document** — the field is optional —
 * and it belongs to the Order Slice, whose own form makes the user pick a type.
 */
const emit = defineEmits<{(event: 'assigned'): void}>()

const queryClient = useQueryClient()
const {create: toast} = useToast()
const {assignOrders} = useOrderAssignment()

const modalRef = useTemplateRef<{show: () => void; hide: () => void}>('attach-order-modal')

/** What the modal fills on the order it is about to create. */
interface OrderValues {
  order_name: string
  order_reference: string
  customer_id: string | null
  customer_relation: number | null
  order_address: string
  order_city: string
  order_postal: string
  order_country_code: string
  order_tel: string
  order_mobile: string
  order_email: string
  order_contact: string
  customer_remarks: string
}

function emptyOrder(): OrderValues {
  return {
    order_name: '',
    order_reference: '',
    customer_id: null,
    customer_relation: null,
    order_address: '',
    order_city: '',
    order_postal: '',
    order_country_code: '',
    order_tel: '',
    order_mobile: '',
    order_email: '',
    order_contact: '',
    customer_remarks: '',
  }
}

const eventId = ref<number | null>(null)
const engineer = ref<Engineer | null>(null)
const order = ref<OrderValues>(emptyOrder())
const isLoading = ref(false)

// The customer type-ahead ---------------------------------------------------

const customerSearch = ref('')
const customerQueryTerm = refDebounced(customerSearch, 500)

/**
 * The customers the picker offers.
 *
 * An empty term asks for nothing: VueMultiselect calls `search-change` with
 * `''` when the menu opens or the field is cleared, and the endpoint would
 * answer that with the tenant's first customers. The legacy screen debounced
 * the same call through `awesome-debounce-promise` at the same 500 ms.
 */
const customersQuery = useQuery(() => ({
  ...customerCustomerAutocompleteListOptions({query: {q: customerQueryTerm.value}}),
  enabled: customerQueryTerm.value.length > 0,
}))

useQueryErrorToast(customersQuery.error, $trans('Error fetching customers'))

const customers = computed<CustomerAutocomplete[]>(() => customersQuery.data.value ?? [])
const customersLoading = computed(() => customersQuery.isFetching.value)

function onCustomerSearch(term: string) {
  customerSearch.value = term
}

function customerLabel({name, address, city}: CustomerAutocomplete) {
  return `${name} - ${address} - ${city}`
}

function selectCustomer(option: CustomerAutocomplete) {
  order.value.customer_relation = option.id
  order.value.customer_id = option.customer_id
  order.value.order_name = option.name ?? ''
  order.value.order_address = option.address ?? ''
  order.value.order_city = option.city ?? ''
  order.value.order_postal = option.postal ?? ''
  order.value.order_country_code = option.country_code ?? ''
  order.value.order_tel = option.tel ?? ''
  order.value.order_mobile = option.mobile ?? ''
  order.value.order_email = option.email ?? ''
  order.value.order_contact = option.contact ?? ''
  order.value.customer_remarks = option.remarks ?? ''
}

// The two writes ------------------------------------------------------------

const createOrder = useMutation({...orderOrderCreateMutation()})
const attachOrder = useMutation({...companyEngineereventUpdatePartialUpdateMutation()})

/** The body of the order this modal means: what it filled, and today's dates. */
function orderBody(values: OrderValues) {
  const today = moment().format('YYYY-MM-DD')
  return {
    customer_relation: values.customer_relation,
    customer_id: values.customer_id,
    order_name: values.order_name,
    order_reference: values.order_reference || null,
    order_address: values.order_address,
    order_city: values.order_city,
    order_postal: values.order_postal,
    order_country_code: values.order_country_code,
    order_tel: values.order_tel || null,
    order_mobile: values.order_mobile || null,
    order_email: values.order_email || null,
    order_contact: values.order_contact || null,
    customer_remarks: values.customer_remarks || null,
    start_date: today,
    end_date: today,
  }
}

/**
 * Open the modal for one event and its engineer.
 *
 * The engineer is read through the generated query rather than held: the row
 * carries the engineer's *user* id, and `/api/company/engineer/{id}/` is the
 * `auth_models.User` viewset (my24service `apps/user/views.py:590`), so the
 * record is the one the assignment's path wants.
 */
async function show(eventId_: number, engineerUserId: number) {
  eventId.value = eventId_
  engineer.value = await queryClient.fetchQuery(
    companyEngineerRetrieveOptions({path: {id: engineerUserId}}),
  ) as unknown as Engineer
  modalRef.value?.show()
}

function hide() {
  modalRef.value?.hide()
}

async function submitForm() {
  const engineerId = engineer.value?.id
  if (engineerId === undefined || eventId.value === null) return

  isLoading.value = true
  try {
    const created = await createOrder.mutateAsync({
      body: orderBody(order.value),
      requestValidator: undefined,
    } as unknown as OrderOrderCreateData)

    const [assigned] = await assignOrders([engineerId], [created.order_id], true)

    await attachOrder.mutateAsync({
      path: {id: eventId.value},
      body: {assigned_order: assigned.assigned_data[created.order_id]} as unknown as PatchedEngineerEventRequest,
    } as CompanyEngineereventUpdatePartialUpdateData)

    await invalidateEngineerEvents(queryClient)

    order.value = emptyOrder()
    isLoading.value = false
    emit('assigned')
    hide()
  } catch (error) {
    console.log('Error creating/assigning order', error)
    errorToast(toast, $trans('Error creating/assigning order'))
    isLoading.value = false
  }
}

function cancelForm() {
  order.value = emptyOrder()
  hide()
}

defineExpose({show, hide})
</script>
