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
                  :internal-search="false"
                  :options-limit="30"
                  :limit="10"
                  :max-height="600"
                  :hide-selected="true"
                  :custom-label="addressLabel"
                  @search-change="(newTerm: string) => (term = newTerm)"
                  @select="selectCustomer"
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
import * as v from 'valibot'
import moment from 'moment'
import VueMultiselect from 'vue-multiselect'

import {
  companyEngineereventCreateOrderCreateMutation,
  companyEngineerRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { Engineer } from '@/api/types.gen'
import { vEngineerEventCreateOrderRequestRequest } from '@/api/valibot.gen'
import { companyEngineerevent } from '@/api/resources.gen'
import { invalidateReads } from '@/features/forms/use-resource-form'
import { errorToast, $trans } from '@/services/i18n'
import { addressLabel, useOwnerPicker } from '@/features/order/form/use-order-pickers'

import { invalidateDispatchBoard } from '../invalidation'

/**
 * The "Attach order" modal the events list mounts: pick the customer whose
 * address the order is for, and the modal creates the order, assigns it to the
 * engineer the event belongs to, and writes the assignment onto the event —
 * in **one** request (`companyEngineereventCreateOrderCreate`).
 *
 * It used to be three, in sequence: the order create (`orderOrderCreate`), the
 * assign through `useOrderAssignment` (the Shim `src/models/mobile/Assign.js`
 * before it), and this modal's own attach PATCH. A failure in the second or
 * third left the order the first had created behind — attached to nothing and
 * reachable from nowhere — while the modal stayed open with the values the
 * user had typed, so the retry created a second one.
 * `EngineerEventCreateOrderView` (my24service `apps/user/views.py`) does the
 * three writes in one transaction, which is why there is nothing here to clean
 * up after a failure: a failed attempt leaves no order to duplicate.
 *
 * The body is the order-create body this modal already sent. It carries no
 * `order` envelope and no `engineer` field: the event itself names the
 * engineer, and the endpoint always assigns that engineer. Its `notify_user`
 * defaults to true — the websocket notification the assign step used to send —
 * and is sent explicitly, the way the assign request sent `notify_user=1`.
 */
const emit = defineEmits<{(event: 'assigned'): void}>()

const queryClient = useQueryClient()
const {create: toast} = useToast()

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

// The customer type-ahead: the canonical owner picker on its customer branch,
// the debounced search-as-you-type read the order form's contact panel shares,
// and the fill a pick lands with. An empty term asks for nothing — the shared
// read only queries while a term is typed — and the pick fills the order's
// twelve contact fields through the shared fill.
//
// The local order holds those twelve fields with the same shapes as the
// order's contact block, so it satisfies the picker's contract directly. The
// one line it shapes differently is `order_country_code`, where the shared
// fill keeps the current value when the pick names none and the local fill
// blanked it.
const {term, options: customers, select: selectCustomer} = useOwnerPicker(
  order,
  false,
)

// The one write -------------------------------------------------------------

const createOrder = useMutation({...companyEngineereventCreateOrderCreateMutation()})

/**
 * The body of the order this modal means: what it filled, today's dates, and
 * the notification the assign step used to send.
 *
 * Parsed through the endpoint's own request component rather than annotated:
 * the body is the `customer_relation` variant of a two-way union, and the
 * generated union is the thing that says so — `customer_relation` is
 * `number | null` until a customer is picked, which no annotation of the
 * variant could spell.
 */
function orderBody(values: OrderValues) {
  const today = moment().format('YYYY-MM-DD')
  return v.parse(vEngineerEventCreateOrderRequestRequest, {
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
    notify_user: true,
  })
}

/**
 * Open the modal for one event and its engineer.
 *
 * The engineer is read through the generated query rather than held: the row
 * carries the engineer's *user* id, and `/api/company/engineer/{id}/` is the
 * `auth_models.User` viewset (my24service `apps/user/views.py:590`).
 *
 * It is the modal's open-time step, not part of the write: the endpoint below
 * resolves the engineer from the event itself and takes no engineer field, so
 * nothing below sends this id. The read stays because it is what `show` was
 * always handed and what says the modal is open on a live event.
 */
async function show(eventId_: number, engineerUserId: number) {
  eventId.value = eventId_
  engineer.value = await queryClient.fetchQuery(
    companyEngineerRetrieveOptions({path: {id: engineerUserId}}),
  )
  modalRef.value?.show()
}

function hide() {
  modalRef.value?.hide()
}

/**
 * The order-field errors a failed create came back with, or `null`.
 *
 * `EngineerEventCreateOrderView` nests order-field validation one level deeper
 * than the order-create endpoint's own 400 does — `{'order': {<field>: [...]}}`,
 * so a caller can tell an order-field error apart from anything the endpoint
 * might validate about the event itself — and this is the unwrap that puts them
 * back where the order-create errors were. The modal reports any failure with
 * one toast, so the log line below is where they are read.
 */
function orderFieldErrors(error: unknown): Record<string, string[]> | null {
  const data = (error as {response?: {data?: unknown}} | null)?.response?.data
  if (!data || typeof data !== 'object' || !('order' in data)) return null

  return (data as {order: Record<string, string[]>}).order
}

async function submitForm() {
  if (engineer.value === null || eventId.value === null) return

  isLoading.value = true
  try {
    await createOrder.mutateAsync({
      path: {id: eventId.value},
      body: orderBody(order.value),
    })

    // The assignment the endpoint made is the one the dispatch board shows, so
    // the board goes stale here exactly as it did while the assign was a
    // request of its own; the events list redraws the row with its order.
    await invalidateDispatchBoard(queryClient)
    await invalidateReads(companyEngineerevent)(queryClient)

    order.value = emptyOrder()
    isLoading.value = false
    emit('assigned')
    hide()
  } catch (error) {
    console.log('Error creating/assigning order', orderFieldErrors(error) ?? error)
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
