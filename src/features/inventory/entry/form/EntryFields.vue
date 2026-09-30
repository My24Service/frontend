<template>
  <b-row>
    <b-col cols="3" role="group">
      <BFormGroup
        label-size="sm"
        :label="$trans('Name')"
        label-for="purchaseorder-entry-material-name"
      >
        <BFormInput
          id="purchaseorder-entry-material-name"
          v-model="entry.material_name"
          readonly
          size="sm"
        />
      </BFormGroup>
    </b-col>
    <b-col cols="1" role="group">
      <BFormGroup
        label-size="sm"
        :label="$trans('Ordered')"
        label-for="purchaseorder-entry-material-amount"
      >
        <BFormInput
          id="purchaseorder-entry-material-amount"
          :model-value="entry.ordered_amount ?? ''"
          readonly
          size="sm"
        />
      </BFormGroup>
    </b-col>
    <b-col cols="2" role="group">
      <BFormGroup
        label-size="sm"
        :label="$trans('Unit')"
        label-for="purchaseorder-entry-material-unit"
      >
        <BFormInput
          id="purchaseorder-entry-material-unit"
          v-model="entry.unit"
          readonly
          size="sm"
        />
      </BFormGroup>
    </b-col>
    <b-col cols="1" role="group">
      <BFormGroup
        label-size="sm"
        :label="$trans('Entry')"
        label-for="purchaseorder-entry-amount"
      >
        <BFormInput
          id="purchaseorder-entry-amount"
          ref="amountInput"
          v-model="entry.amount"
          size="sm"
          :state="state('amount')"
        />
        <b-form-invalid-feedback :state="state('amount')">
          {{ errors.amount }}
        </b-form-invalid-feedback>
      </BFormGroup>
    </b-col>
    <b-col cols="2" role="group">
      <BFormGroup
        label-size="sm"
        :label="$trans('Date')"
        label-for="purchaseorder-entry-date"
      >
        <VueDatePicker
          id="purchaseorder-entry-date"
          v-model="entry.entry_date"
          size="sm"
          class="p-sm-0"
          :placeholder="$trans('Choose a date')"
          :state="state('entry_date')"
          :locale="nl"
          auto-apply
          arrow-navigation
          :formats="{ input: 'dd/MM/yyyy' }"
        />
        <b-form-invalid-feedback :state="state('entry_date')">
          {{ errors.entry_date }}
        </b-form-invalid-feedback>
      </BFormGroup>
    </b-col>
    <b-col cols="3" role="group">
      <BFormGroup
        label-size="sm"
        :label="$trans('Move to location')"
        label-for="purchaseorder-entry-location"
      >
        <BFormSelect
          id="purchaseorder-entry-location"
          v-model="entry.stock_location"
          :options="stockLocations"
          size="sm"
          value-field="id"
          text-field="name"
        />
      </BFormGroup>
    </b-col>
  </b-row>
</template>

<script setup lang="ts">
import { nl } from 'date-fns/locale'

import type { EntryFieldErrors, EntryValues } from './schemas'

/**
 * The entry's fields: the product as read-only display, then the three the
 * user edits - amount, date and location. The create form's row editor and
 * the edit form share it.
 */
const props = defineProps<{
  stockLocations: readonly Api.StockLocation[]
  errors: EntryFieldErrors
  /** Errors show only once a save was tried, as the legacy form did. */
  submitted: boolean
}>()
const entry = defineModel<EntryValues>({required: true})

const amountInput = useTemplateRef<{focus: () => void}>('amountInput')

function state(field: keyof EntryFieldErrors) {
  return props.submitted ? !props.errors[field] : null
}

// The parent focuses the amount once a product is picked.
defineExpose({focusAmount: () => amountInput.value?.focus()})
</script>
