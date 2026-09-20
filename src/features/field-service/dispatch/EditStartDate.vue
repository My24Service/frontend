<template>
  <div>
    <b-modal
      id="edit-start-date-modal-wide"
      ref="edit-start-date-modal-wide"
      v-bind:title="$trans('Edit Order Dates')"
      @ok="editStartDateDone"
      @cancel="editStartDateCancel"
      :ok-title="$trans('Save')">
      <p>{{ $trans('Edit the dates for this order.')}}</p>
      <form ref="start-date-form">
        <b-container>
          <BFormGroup
            :label="$trans('Start date')"
            label-for="start_date"
            cols="1">
            <VueDatePicker
              id="start_date"
              v-model="start_date"
              class="mb-2"
              :placeholder="$trans('Select date')"
              :state="error == null"
              :locale="nl"
              auto-apply
              arrow-navigation
              :formats="{ input: 'dd/MM/yyyy' }"
              @input="check_date_start()"
            ></VueDatePicker>
          </BFormGroup>

          <BFormGroup
            label-class=""
            v-bind:label="$trans('End date')"
            label-for="end_date"
            cols="2">
              <VueDatePicker
                id="end_date"
                v-model="end_date"
                class="mb-2"
                :placeholder="$trans('Select date')"
                :state="error == null"
                :locale="nl"
                auto-apply
                arrow-navigation
                :formats="{ input: 'dd/MM/yyyy' }"
                @input="check_date_end()"
              ></VueDatePicker>
            </BFormGroup>
        </b-container>
      </form>
    </b-modal>
  </div>
</template>

<script setup lang="ts">
import moment from 'moment/moment'
import { nl } from 'date-fns/locale'

import { $trans } from '@/services/i18n'

/**
 * The order's dates, edited in place from the search results.
 *
 * Two rules, and they are the whole of the component: a start moved past the
 * end drags the end along, and an end moved before the start blocks the save
 * with a reason instead of sending a range the backend would refuse.
 *
 * The parent drives it through the three handles at the bottom — `setFromOrder`
 * to fill it, `show`/`hide` to open and close it — which is the contract the
 * search modal relies on.
 */
const emit = defineEmits<{
  (event: 'edit-start-date-done', orderId: number | null, startDate: Date, endDate: Date): void
}>()

const modal = useTemplateRef<{show: () => void; hide: () => void}>('edit-start-date-modal-wide')

const start_date = ref<Date | null>(null)
const end_date = ref<Date | null>(null)
const order_id = ref<number | null>(null)
const error = ref<string | null>(null)

/** Seed from the row the editor was opened on: its dates are display strings. */
function setFromOrder(order: {id: number; start_date: string; end_date: string}) {
  order_id.value = order.id
  start_date.value = moment(order.start_date, 'DD/MM/YYYY').toDate()
  end_date.value = moment(order.end_date, 'DD/MM/YYYY').toDate()
  error.value = null
}

function check_date_start() {
  error.value = null
  if (start_date.value && end_date.value && end_date.value < start_date.value) {
    end_date.value = start_date.value
  }
}

function check_date_end() {
  error.value = start_date.value && end_date.value && end_date.value < start_date.value
    ? $trans('The end date cannot lie before start date')
    : null
}

function editStartDateCancel() {
  hide()
}

/** The modal's OK: a blocked range keeps the modal open and sends nothing. */
function editStartDateDone(event?: {preventDefault: () => void}) {
  if (error.value != null) {
    event?.preventDefault()
    return
  }

  if (order_id.value === null || start_date.value === null || end_date.value === null) {
    event?.preventDefault()
    return
  }

  emit('edit-start-date-done', order_id.value, start_date.value, end_date.value)
  hide()
}

function show() {
  modal.value?.show()
}

function hide() {
  modal.value?.hide()
}

defineExpose({setFromOrder, show, hide})
</script>
