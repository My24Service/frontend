<template>
  <div>
    <h4>{{ $trans('Quotation data')}} </h4>

      <b-form-group
        v-bind:label="$trans('Reference')"
        label-for="quotation_reference"
        label-cols="3"
      >
        <b-form-input
          v-model="quotationData.quotation_reference"
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
          v-model="quotationData.quotation_expire_days"
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
          v-model="quotationData.description"
          rows="1"
        ></b-form-textarea>
      </b-form-group>

    <footer
      class="modal-footer"
      v-if="!quotation.id"
    >
      <i>{{ $trans('Save quotation to start adding chapters') }}</i>
    </footer>

  </div>
</template>
<script>
import {useVuelidate} from "@vuelidate/core";
import {QuotationModel} from '@/models/quotations/Quotation.js';
import eventBus from "@/eventBus";

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
    quotation: {
      type: QuotationModel,
      default: null
    },
  },
  data () {
    return {
      isLoading: false,
      quotationData: {
        quotation_reference: null,
        quotation_expire_days: null,
        description: null
      }
    }
  },
  async created() {
    this.quotationData = {
      quotation_reference: this.quotation.quotation_reference,
      quotation_expire_days: this.quotation.quotation_expire_days,
      description: this.quotation.description
    }

    if (!this.quotationData.quotation_expire_days) {
      this.quotationData.quotation_expire_days = this.$store.getters.getQuotationDefaultExpireDays
    }
  },
  methods: {
    getQuotationData() {
      return this.quotationData
    },
  },
}
</script>
<style scoped>
</style>
