<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3 v-if="isCreate">
          <IBiFileEarmarkPlus />
          <router-link :to="{name: 'order-list'}">{{ $trans("Orders") }}</router-link> /
          <strong>{{ $trans("new") }}</strong>
        </h3>
        <h3 v-else>
          <IBiFileEarmarkTextFill />
          <router-link :to="{name: 'order-list'}">{{ $trans("Orders") }}</router-link> /
          <router-link :to="{name: 'order-view', params: {pk: id}}">#<strong>{{ record?.order_id ?? id }}</strong></router-link>
          / {{ $trans("edit") }}
        </h3>

        <div class="flex-columns">
          <OrderAcceptButtons
            :can-accept="canAccept"
            :button-disabled="buttonDisabled"
            @reject="reject"
            @accept="editAndAccept"
          />

          <BButton
            type="button"
            variant="secondary"
            @click="cancelForm"
          >
            {{ $trans('Cancel') }}
          </BButton>

          <b-dropdown
            v-if="role === 'planning'"
            split
            :text="$trans('Submit')"
            variant="primary"
            :disabled="buttonDisabled"
            @click="submit('back')"
          >
            <b-dropdown-item-button
              name="nextPage"
              @click="submit('dispatch')"
            >{{ $trans('Submit') }} {{ $trans('and open dispatch') }}</b-dropdown-item-button>
          </b-dropdown>
          <BButton
            v-else
            type="button"
            variant="primary"
            :disabled="buttonDisabled"
            @click="submit('back')"
          >
            {{ $trans('Submit') }}
          </BButton>
        </div>
      </div>
    </header>

    <div class="page-detail">
      <b-overlay
        :show="isLoading"
        rounded="sm"
      >
        <div class="flex-columns">
          <ContactPanel
            v-model:order="order"
            :role="role"
            :has-branches="hasBranches"
            :from-quotation="fromQuotation"
            :errors="errors"
            :submit-clicked="submitClicked"
          />

          <!-- Order details ------------------------------------------------ -->
          <div class="panel col-1-3">
            <h6>{{ $trans("Order details") }}</h6>

            <BFormGroup
              :label="$trans('Order type')"
              label-for="order_type"
              label-cols="3"
            >
              <BFormSelect
                id="order_type"
                v-model="order.order_type"
                :options="orderTypeOptions"
                :state="submitClicked ? !errors.order_type : null"
              />
              <b-form-invalid-feedback :state="submitClicked ? !errors.order_type : null">
                {{ errors.order_type }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              :label="$trans('Reference')"
              label-for="order_reference"
              label-cols="3"
            >
              <BFormInput
                id="order_reference"
                v-model="order.order_reference"
              />
            </BFormGroup>

            <BFormGroup
              v-if="role !== 'customer'"
              :label="$trans('Customer reference')"
              label-for="customer_reference"
              label-cols="3"
            >
              <BFormInput
                id="customer_reference"
                v-model="order.customer_reference"
              />
            </BFormGroup>

            <BFormGroup
              :label="$trans('Remarks')"
              label-for="remarks"
              label-cols="3"
            >
              <BFormTextarea
                id="remarks"
                v-model="order.remarks"
                rows="3"
              />
            </BFormGroup>

            <h6>{{ $trans('Planning') }}</h6>
            <DateTimeFields
              v-model:date="order.start_date"
              v-model:time="order.start_time"
              date-id="start_date"
              :date-label="$trans('Start date')"
              time-id="start_time"
              :time-label="$trans('Start time')"
              :date-error="errors.start_date"
              :time-error="errors.start_time"
              :show-state="submitClicked"
            />
            <DateTimeFields
              v-model:date="order.end_date"
              v-model:time="order.end_time"
              date-id="end_date"
              :date-label="$trans('End date')"
              time-id="end_time"
              :time-label="$trans('End time')"
              :date-error="errors.end_date"
              :time-error="errors.end_time"
              :show-state="submitClicked"
            />

            <EngineersPanel
              v-if="role === 'planning' && !hasBranches"
              ref="engineers"
              :assignees="assignees"
            />

            <template v-if="role === 'planning'">
              <BFormGroup
                label-for="planning_remarks"
                :label="$trans('Planning remarks')"
              >
                <BFormTextarea
                  id="planning_remarks"
                  v-model="order.planning_remarks"
                  rows="1"
                />
              </BFormGroup>
              <ExtraRecipientsField v-model="order.order_email_extra" />
            </template>
          </div>

          <!-- Documents, orderlines, infolines ------------------------------ -->
          <div class="panel col-1-3">
            <div class="documents section">
              <OrderDocumentsPanel
                ref="documents"
                :documents="recordDocuments"
              />
            </div>

            <OrderlinesPanel
              ref="orderlines"
              v-model:order="order"
              :lines="recordOrderlines"
              :role="role"
              :has-branches="hasBranches"
              :uses-equipment="usesEquipment"
              :maintenance="maintenance"
            />

            <template v-if="role === 'planning' && !hasBranches">
              <hr>
              <InfolinesPanel
                ref="infolines"
                :lines="recordInfolines"
              />
            </template>
          </div>
        </div>
      </b-overlay>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { orderOrder } from '@/api/resources.gen'
import type { OrderCreate, OrderDetail, OrderUpdate } from '@/api/types.gen'
import { useResourceForm } from '@/features/forms'
import ContactPanel from './ContactPanel.vue'
import DateTimeFields from './DateTimeFields.vue'
import EngineersPanel from './EngineersPanel.vue'
import ExtraRecipientsField from './ExtraRecipientsField.vue'
import InfolinesPanel from './InfolinesPanel.vue'
import OrderAcceptButtons from './OrderAcceptButtons.vue'
import OrderDocumentsPanel from './OrderDocumentsPanel.vue'
import OrderlinesPanel from './OrderlinesPanel.vue'
import { useOrderAcceptance } from './use-order-acceptance'
import {
  emptyOrder,
  orderFromRecord,
  parseOrderBody,
  validateOrderForm,
  type FormRole,
  type OrderBody,
  type OrderFieldErrors,
  type OrderFormValues,
} from './schemas'
import { UnassignRefused } from './use-engineer-assignment'
import { useOrderSeeds } from './use-order-seeds'
import { useDateClamp } from '../use-date-clamp'
import { useOrderTypeOptions } from '../use-order-type-options'

/**
 * The order create/edit form. One screen; the user's role picks the
 * variant (see `FormRole` in ./schemas.ts), which decides the owner
 * picker, the engineer and infoline sections, and which generated request
 * body the save parses.
 *
 * The order's own fields bind here; its children — documents, orderlines,
 * infolines, engineers — are each a panel that stages its rows. The
 * orderlines and infolines go in the order body, so the order and its
 * lines are one atomic write. The save is a sequence: that write, then
 * the engineer assignments and the documents against the id, then — for
 * "Save & accept" — the acceptance. A failure past the order write
 * reports as a failed save and keeps the user on the form with what
 * they entered.
 */
const props = withDefaults(defineProps<{
  pk?: string | number | null
  /** Create with the maintenance-contract equipment the contract view staged in the store. */
  maintenance?: boolean
  /** Create from a quotation: its customer and reference are copied over. */
  fromQuotation?: boolean
  quotationId?: string | number | null
}>(), {
  pk: null,
  maintenance: false,
  fromQuotation: false,
  quotationId: null,
})

const router = useRouter()
const authStore = useAuthStore()
const mainStore = useMainStore()
const {create: toastCreate} = useToast()

const hasBranches = computed(() => Boolean(mainStore.getMemberHasBranches))
const usesEquipment = computed(() => Boolean(mainStore.getMemberUsesEquipment))

const role = computed<FormRole>(() => {
  if (authStore.isPlanning || authStore.isStaff || authStore.isSuperuser) return 'planning'
  if (authStore.isBranchEmployee) return 'employee'
  return 'customer'
})
const variant = computed(() => ({role: role.value, hasBranches: hasBranches.value}))
const orderTypeOptions = useOrderTypeOptions()

// The panels that stage the order's children -------------------------------

const documents = useTemplateRef<InstanceType<typeof OrderDocumentsPanel>>('documents')
const orderlines = useTemplateRef<InstanceType<typeof OrderlinesPanel>>('orderlines')
const infolines = useTemplateRef<InstanceType<typeof InfolinesPanel>>('infolines')
const engineers = useTemplateRef<InstanceType<typeof EngineersPanel>>('engineers')

// The order --------------------------------------------------------------

/** Where the save goes: back to the list, or on to the dispatch screen. */
const next = ref<'back' | 'dispatch'>('back')
const acceptOnSave = ref(false)

const {
  values: order,
  errors,
  record,
  isCreate,
  id,
  isLoading: baseIsLoading,
  buttonDisabled,
  submitClicked,
  saving,
  submitForm,
  cancelForm,
} = useResourceForm({
  pk: () => props.pk,
  resource: orderOrder,
  empty: emptyOrder,
  fromRecord: orderFromRecord,
  validate: (values, context) => validateOrderForm(values, variant.value, context),
  parse: (values, context) => parseOrderBody(values, variant.value, context, {
    orderlines: orderlines.value?.rows,
    infolines: infolines.value?.rows,
  }),
  onSaved: async (result, context) => {
    const saved = result as OrderCreate | OrderUpdate
    const orderId = context.isCreate ? saved.id : context.id
    const orderCode = saved.order_id ?? record.value?.order_id ?? ''

    // The rows now carry their stored ids: a retry after a failure below
    // updates them instead of replacing the set.
    if (saved.orderlines) orderlines.value?.adopt(saved.orderlines)
    if (saved.infolines) infolines.value?.adopt(saved.infolines)

    // The child panels stage independently, so a clean one is skipped and
    // each dirty one is attempted on its own. A panel clears its rows as it
    // applies them (engineers drop each handled assignment, documents take
    // the ids the write returned), so a retry replays what is left rather
    // than duplicating what landed. A lone failure aborts the save the way
    // it always did; several failures each say where they happened before
    // the first one aborts it, which keeps the user on the form with what
    // they entered.
    const failures: {part: string; message: string; error: unknown}[] = []
    if (engineers.value?.hasChanges) {
      try {
        await engineers.value.replay(orderId, orderCode)
      } catch (error) {
        failures.push({part: 'engineers', message: $trans('Error saving engineers'), error})
      }
    }
    if (documents.value?.hasChanges) {
      try {
        await documents.value.replay(orderId)
      } catch (error) {
        failures.push({part: 'documents', message: $trans('Error saving documents'), error})
      }
    }
    if (failures.length > 1) {
      for (const failure of failures) errorToast(toastCreate, failure.message)
    }
    if (failures.length) throw failures[0].error

    if (acceptOnSave.value && !context.isCreate) {
      await accept(context.id)
    }
  },
  // A refused unassign names the engineer; every other failure keeps the
  // generic copy.
  reasonOf: (error, fallback) => (error instanceof UnassignRefused ? error.message : fallback),
  afterSave: async () => {
    if (next.value === 'dispatch') await router.push({name: 'mobile-dispatch'})
    else router.go(-1)
  },
  copy: {
    fetchError: $trans('Error fetching order'),
    created: $trans('Created'),
    createdDetail: $trans('Order has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Order has been updated'),
    createError: $trans('Error creating order'),
    updateError: $trans('Error updating order'),
  },
})

// The record's child rows seed the panels; a create starts them empty. Each
// is a computed so the empty set is one stable array, not a new one per
// render that would read as a reload.
const recordDocuments = computed(() => record.value?.documents ?? [])
const recordOrderlines = computed(() => record.value?.orderlines ?? [])
const recordInfolines = computed(() => record.value?.infolines ?? [])
const assignees = computed(() => record.value?.assigned_user_info ?? [])

const {accept, reject} = useOrderAcceptance(id, cancelForm)

/**
 * The submit button and its dropdown: where to go once saved. A click on
 * the dropdown item bubbles to the split button's own handler, so the
 * second call arrives while the first save is in flight and must not
 * overwrite the destination.
 */
function submit(destination: 'back' | 'dispatch') {
  if (saving.value) return
  next.value = destination
  acceptOnSave.value = false
  return submitForm()
}

/** Edit + accept, for a customer-placed order awaiting confirmation. */
function editAndAccept() {
  next.value = 'back'
  acceptOnSave.value = true
  return submitForm()
}

const canAccept = computed(
  () => !isCreate.value && !hasBranches.value && role.value === 'planning' && record.value?.customer_order_accepted === false,
)

// The end may not precede the start; whichever moved drags the other along.
useDateClamp(order)

// What a new order starts out with, by who opens it and from where.
const seeds = useOrderSeeds(order, {
  role: () => role.value,
  isCreate: () => isCreate.value,
  fromQuotation: () => props.fromQuotation,
  quotationId: () => props.quotationId,
  maintenance: () => props.maintenance,
  stageOrderline: (row) => orderlines.value?.stage(row),
})

const isLoading = computed(() => baseIsLoading.value || seeds.isLoading.value)
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
<style scoped>
/* every picker on the form, in whichever panel it sits */
:deep(.multiselect) {
  width: auto;
  flex-grow: 1;
}
</style>
