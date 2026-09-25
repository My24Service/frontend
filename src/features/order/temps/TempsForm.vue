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
          <BButton
            type="button"
            variant="primary"
            :disabled="buttonDisabled"
            @click="submit"
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
            role="planning"
            :has-branches="hasBranches"
            :from-quotation="false"
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
              :label="$trans('Required users')"
              label-for="required_users"
              label-cols="3"
            >
              <BFormInput
                id="required_users"
                v-model="order.required_users"
                inputmode="numeric"
                :state="submitClicked ? !errors.required_users : null"
              />
              <b-form-invalid-feedback :state="submitClicked ? !errors.required_users : null">
                {{ errors.required_users }}
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
          </div>

          <!-- Orderlines ---------------------------------------------------- -->
          <div class="panel col-1-3">
            <OrderlinesPanel
              ref="orderlines"
              v-model:order="order"
              :lines="recordOrderlines"
              role="planning"
              :has-branches="hasBranches"
              :uses-equipment="false"
              :maintenance="false"
            />
          </div>
        </div>
      </b-overlay>
    </div>
  </div>
</template>

<script lang="ts" setup>

import { useResourceForm } from '@/features/forms'
import {
  ContactPanel,
  DateTimeFields,
  OrderAcceptButtons,
  OrderlinesPanel,
  useOrderAcceptance,
  type FormVariant,
} from '@/features/order/form'
import { useDateClamp } from '../use-date-clamp'
import { useOrderTypeOptions } from '../use-order-type-options'
import {
  emptyTempsOrder,
  parseTempsBody,
  tempsFromRecord,
  validateTempsForm,
} from './schemas'

/**
 * The temps tenant's order form: the planning order's contact block,
 * type, reference and planning moments, plus how many people it needs,
 * and the typed orderlines. No engineers, infolines or documents — a
 * temps order is staffed from the dispatch screen. The orderlines go in
 * the order body, so the save is one write, then the acceptance for
 * "Save & accept".
 */
const props = withDefaults(defineProps<{
  pk?: string | number | null
}>(), {
  pk: null,
})

const router = useRouter()
const mainStore = useMainStore()

const hasBranches = computed(() => Boolean(mainStore.getMemberHasBranches))
const orderTypeOptions = useOrderTypeOptions()
const variant = computed<FormVariant>(() => ({role: 'planning', hasBranches: hasBranches.value}))

const orderlines = useTemplateRef<InstanceType<typeof OrderlinesPanel>>('orderlines')

const acceptOnSave = ref(false)

const {
  values: order,
  errors,
  record,
  isCreate,
  id,
  isLoading,
  buttonDisabled,
  submitClicked,
  saving,
  submitForm,
  cancelForm,
} = useResourceForm({
  pk: () => props.pk,
  resource: Api.OrderOrder,
  empty: emptyTempsOrder,
  fromRecord: tempsFromRecord,
  validate: (values, context) => validateTempsForm(values, variant.value, context),
  parse: (values, context) => parseTempsBody(values, variant.value, context, {orderlines: orderlines.value?.rows}),
  onSaved: async (result, context) => {
    const saved = result as Api.OrderCreate | Api.OrderUpdate
    if (saved.orderlines) orderlines.value?.adopt(saved.orderlines)

    if (acceptOnSave.value && !context.isCreate) {
      await accept(context.id)
    }
  },
  afterSave: async () => {
    router.go(-1)
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

const recordOrderlines = computed(() => record.value?.orderlines ?? [])

const {accept, reject} = useOrderAcceptance(id, cancelForm)

function submit() {
  if (saving.value) return
  acceptOnSave.value = false
  return submitForm()
}

function editAndAccept() {
  acceptOnSave.value = true
  return submitForm()
}

const canAccept = computed(() => !isCreate.value && record.value?.customer_order_accepted === false)

// The end may not precede the start; whichever moved drags the other along.
useDateClamp(order)
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
<style scoped>
:deep(.multiselect) {
  width: auto;
  flex-grow: 1;
}
</style>
