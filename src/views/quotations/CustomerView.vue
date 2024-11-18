<template>
  <b-container>
    <h6>
      <b-icon icon="building"></b-icon> {{ $trans('Customer') }}
    </h6>
    <b-row>
      <b-col cols="4">
        {{ $trans('Customer') }}
      </b-col>
      <b-col cols="8">
        <p class="value">{{ checkValue(quotation.quotation_name) }}</p>
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="4">
        {{ $trans('Customer ID') }}
      </b-col>
      <b-col cols="8">
        <p class="value">{{ checkValue(quotation.customer_id) }}</p>
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="4">
        {{ $trans('Address') }}
      </b-col>
      <b-col cols="8">
        <p class="value">{{ checkValue(quotation.quotation_address) }}</p>
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="4">
        {{ $trans('Postal') }}
      </b-col>
      <b-col cols="8">
        <p class="value">{{ quotation.quotation_country_code }}-{{ checkValue(quotation.quotation_postal) }}</p>
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="4">
        {{ $trans('City') }}
      </b-col>
      <b-col cols="8">
        <p class="value">{{ checkValue(quotation.quotation_city) }}</p>
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="4">
        {{ $trans('Contacts') }}
      </b-col>
      <b-col cols="8">
        <p class="value">{{ checkValue(quotation.quotation_contact) }}</p>
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="4">
        {{ $trans('Email') }}
      </b-col>
      <b-col cols="8">
        <p class="value">{{ checkValue(quotation.quotation_email) }}</p>
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="4">
        {{ $trans('Mobile') }}
      </b-col>
      <b-col cols="8">
        <p class="value">{{ checkValue(quotation.quotation_mobile) }}</p>
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="4">
        {{ $trans('Phone') }}
      </b-col>
      <b-col cols="8">
        <p class="value">{{ checkValue(quotation.quotation_tel) }}</p>
      </b-col>
    </b-row>
  </b-container>
</template>
<script>
import {QuotationModel} from "@/models/quotations/Quotation";

import quotationMixin from "./quotation_form/mixin";

export default {
  name: "CustomerView",
  mixins: [quotationMixin],
  props: {
    quotation: {
      type: QuotationModel,
      default: null
    },
  }
}
</script>

<style scoped>
p.value {
  width: 100%;
  border-bottom: 1px dotted gray;
}

</style>
