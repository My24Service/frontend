<template>
  <b-overlay :show="isLoading" rounded="sm">
    <h4>{{ $trans('Quotation data')}} </h4>

      <b-form-group
        v-bind:label="$trans('Reference')"
        label-for="quotation_reference"
        label-cols="3"
      >
        <b-form-input
          v-model="quotation.quotation_reference"
          id="quotation_reference"
          size="sm"
        ></b-form-input>
      </b-form-group>

      <b-form-group
        label-cols="3"
        v-bind:label="$trans('Expiry days')"
        label-for="quotation_expiry"
      >
        <b-form-input
          v-model="quotation.quotation_expire_days"
          :type="'number'"
          id="quotation_reference"
          size="sm"
        ></b-form-input>
      </b-form-group>

      <b-form-group
        label-cols="3"
        v-bind:label="$trans('Description')"
        label-for="quotation_description"
      >
        <b-form-textarea
          id="quotation_description"
          v-model="quotation.description"
          rows="1"
        ></b-form-textarea>
      </b-form-group>

  </b-overlay>
</template>
<script>
import {INVOICE_LINE_TYPE_MANUAL} from "./constants";
import {useVuelidate} from "@vuelidate/core";
import quotationService from '@/models/quotations/Quotation.js';


export default {
  name: 'QuotationDataForm',
  setup() {
    return { v$: useVuelidate() }
  },
  validations() {
    return {
      invoice: {}
    }
  },
  props: {
    quotationData: {
      type: Object,
      default: null
    },
  },
  watch: {
    quotationData: {
      handler(newValue) {
        this.quotation = newValue
      },
      deep: true
    },
  },
  data () {
    return {
      isLoading: false,
      quotation: this.quotationData,
      quotationService,
      INVOICE_LINE_TYPE_MANUAL,
    }
  },
  async created() {
  },
  methods: {
  }
}
</script>
<style scoped>
</style>
