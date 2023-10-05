<template>
  <div>
    <h3>{{ customer.name || 'Loading'}}</h3>
    <dl>
      <dt>{{  $trans('Address') }}</dt>
      <dd>
        <address>
          {{ customer.address }}, {{ customer.city }} {{  customer.country_code }},
          {{ customer.postal.toUpperCase() }}
        </address>
      </dd>
      <dt>{{ $trans('Contact') }}</dt>
      <dd>
        {{ customer.contact }} <br />
        {{ customer.email || '(email unknown)' }} <br>
        <span v-if="customer.tel">{{ customer.tel }} <br></span>
        <span v-if="customer.mobile">{{ customer.mobile }}</span>
      </dd>

      <dt>Customer ID</dt>
      <dd>{{ customer.customer_id }}</dd>
      
      <dt v-if="customer.external_identifier">Ext. ID</dt>
      <dd v-if="customer.external_identifier">{{ customer.external_identifier }}</dd>
      <dt :v-if="customer.remarks.trim()">{{ $trans('Remarks') }}</dt>
      <dd v-if="customer.remarks" class="remarks">{{ customer.remarks }}</dd>
    </dl>
  </div>
  </template>
  
  <script>
  // import customerModel from '../models/customer/Customer.js'
  export default {
    name: "customerCard",
    props: {
      pk: { 
        type: [Number],
        default: null
      },
      customer: {
        type: [Object],
        default: null
      }
    }
  }
  </script>
  
  <style scope>
.remarks {
  white-space: pre;
}
  </style>