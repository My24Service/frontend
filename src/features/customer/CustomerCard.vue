<template>
  <div>
    <h3>{{ customer.name || 'Loading'}}</h3>
    <dl>
      <dt>{{  $trans('Address') }}</dt>
      <dd>
        <address>
          {{ customer.address }}, {{ customer.city }} {{  customer.country_code }},
          {{ customer.postal ? customer.postal.toUpperCase() : ''}}
        </address>
      </dd>
      <dt>{{ $trans('Contact') }}</dt>
      <dd>
        {{ customer.contact ?  customer.contact + ' &middot; ' : ''}}
        {{ customer.email || `(${$trans('email unknown')})` }} <br>
        <span v-if="customer.tel">{{ customer.tel }} <br></span>
        <span v-if="customer.mobile">{{ customer.mobile }}</span>
      </dd>

      <dt>{{ $trans('Customer ID') }}</dt>
      <dd>{{ customer.customer_id }}</dd>

      <dt v-if="customer.external_identifier">{{ $trans('Ext. ID') }}</dt>
      <dd v-if="customer.external_identifier">{{ customer.external_identifier }}</dd>
      <dt v-if="customer.remarks">{{ $trans('Remarks') }}</dt>
      <dd v-if="customer.remarks" class="remarks">{{ customer.remarks.trim() }}</dd>
    </dl>
  </div>
</template>

<script lang="ts" setup>
import { $trans } from '@/services/i18n'
import type { Customer } from '@/api/types.gen'

/**
 * The identity block the customer detail view and the two contract screens
 * mount. It replaces `@/components/CustomerCard.vue` in this Slice: that one
 * type-checks its prop against `CustomerModel`, the legacy Shim in
 * `src/models/customer/`, which is what dragged the Slice back into the model
 * layer. This card takes the record's display fields instead — partial, since
 * the contract form mounts it with the customer it has loaded so far.
 */
type CustomerCardRecord = Partial<Pick<Customer,
  | 'name' | 'address' | 'city' | 'country_code' | 'postal' | 'contact'
  | 'email' | 'tel' | 'mobile' | 'customer_id' | 'external_identifier' | 'remarks'
>>

defineProps<{ customer: CustomerCardRecord }>()
</script>

<style scoped>
.remarks {
  white-space: pre;
}
</style>
