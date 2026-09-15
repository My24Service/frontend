<template>
  <div class="panel col-1-3">
    <h6>{{ $trans('Contact') }}</h6>

    <BFormGroup
      v-if="showPicker"
      label-cols="3"
      :label="hasBranches ? $trans('Branch') : $trans('Customer')"
      label-for="order-owner-search"
    >
      <VueMultiselect
        id="order-owner-search"
        track-by="id"
        :placeholder="$trans('Type to search name, address..')"
        open-direction="bottom"
        :options="options"
        :multiple="false"
        :internal-search="false"
        :options-limit="30"
        :limit="10"
        :max-height="600"
        :hide-selected="true"
        :custom-label="addressLabel"
        @search-change="(newTerm: string) => (term = newTerm)"
        @select="select"
      >
        <template #noResult>{{ $trans('Nothing found.') }}</template>
      </VueMultiselect>
    </BFormGroup>

    <BFormGroup
      :label="hasBranches ? $trans('Branch') : $trans('Customer')"
      label-for="order_name"
      label-cols="3"
    >
      <b-input-group>
        <BFormInput
          id="order_name"
          v-model="order.order_name"
          :state="submitClicked ? !(errors.order_name || ownerError) : null"
        />
        <template
          v-if="!hasBranches"
          #append
        >
          <BFormInput
            id="customer_id"
            v-model="order.customer_id"
            :readonly="true"
            :title="$trans('Customer ID')"
            style="max-width: 9ch"
          />
        </template>
      </b-input-group>
      <b-form-invalid-feedback :state="submitClicked ? !(errors.order_name || ownerError) : null">
        {{ ownerError || errors.order_name }}
      </b-form-invalid-feedback>
    </BFormGroup>

    <details
      v-if="order.customer_id || hasBranches || role !== 'planning'"
      open
    >
      <summary class="flex-columns space-between">
        <h6>{{ $trans('Customer details') }}</h6>
        <IBiChevronDown />
      </summary>

      <BFormGroup
        :label="$trans('Address')"
        label-for="order_address"
        label-cols="3"
      >
        <BFormInput
          id="order_address"
          v-model="order.order_address"
          :state="submitClicked ? !errors.order_address : null"
        />
        <b-form-invalid-feedback :state="submitClicked ? !errors.order_address : null">
          {{ errors.order_address }}
        </b-form-invalid-feedback>
      </BFormGroup>

      <BFormGroup
        :label="$trans('Postal')"
        label-for="order_postal"
        label-cols="3"
      >
        <BFormInput
          id="order_postal"
          v-model="order.order_postal"
          :state="submitClicked ? !errors.order_postal : null"
        />
        <b-form-invalid-feedback :state="submitClicked ? !errors.order_postal : null">
          {{ errors.order_postal }}
        </b-form-invalid-feedback>
      </BFormGroup>

      <BFormGroup
        :label="$trans('Country')"
        label-for="order_country_code"
        label-cols="3"
      >
        <BFormSelect
          id="order_country_code"
          v-model="order.order_country_code"
          :options="countries"
        />
      </BFormGroup>

      <BFormGroup
        :label="$trans('City')"
        label-for="order_city"
        label-cols="3"
      >
        <BFormInput
          id="order_city"
          v-model="order.order_city"
          :state="submitClicked ? !errors.order_city : null"
        />
        <b-form-invalid-feedback :state="submitClicked ? !errors.order_city : null">
          {{ errors.order_city }}
        </b-form-invalid-feedback>
      </BFormGroup>

      <BFormGroup
        :label="$trans('Contacts')"
        label-for="order_contact"
        label-cols="3"
      >
        <BFormInput
          id="order_contact"
          v-model="order.order_contact"
        />
      </BFormGroup>

      <BFormGroup
        :label="$trans('Email')"
        label-for="order_email"
        label-cols="3"
      >
        <BFormInput
          id="order_email"
          v-model="order.order_email"
          placeholder="email address"
        />
      </BFormGroup>

      <BFormGroup
        :label="$trans('Mobile')"
        label-for="order_mobile"
        label-cols="3"
      >
        <BFormInput
          id="order_mobile"
          v-model="order.order_mobile"
        />
      </BFormGroup>

      <BFormGroup
        :label="$trans('Phone')"
        label-for="order_tel"
        label-cols="3"
      >
        <BFormInput
          id="order_tel"
          v-model="order.order_tel"
        />
      </BFormGroup>

      <BFormGroup
        :label="$trans('Customer remarks')"
        label-for="customer_remarks"
        label-cols="3"
      >
        <BFormTextarea
          id="customer_remarks"
          v-model="order.customer_remarks"
          rows="3"
        />
      </BFormGroup>
    </details>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import VueMultiselect from 'vue-multiselect'

import { $trans } from '@/services/i18n'
import { useMainStore } from '@/stores/main'
import type { FormRole, OrderFieldErrors, OrderFormValues } from './schemas'
import { addressLabel, useOwnerPicker } from './use-order-pickers'

/**
 * Who the order is for and where: the owner picker a planning user
 * searches with, and the contact block it fills (which stays editable).
 */
const props = defineProps<{
  role: FormRole
  hasBranches: boolean
  fromQuotation: boolean
  errors: OrderFieldErrors
  submitClicked: boolean
}>()

const order = defineModel<OrderFormValues>('order', {required: true})

const mainStore = useMainStore()
const countries = computed(() => mainStore.getCountries ?? [])
const showPicker = computed(() => props.role === 'planning' && (!props.hasBranches || !props.fromQuotation))

// The search and the fill come as a pair, typed on the tenant's shape;
// the template binds them without naming a customer or a branch.
const {term, options, select} = useOwnerPicker(order, props.hasBranches)

const ownerError = computed(() => props.errors.customer_relation ?? props.errors.branch ?? '')
</script>
