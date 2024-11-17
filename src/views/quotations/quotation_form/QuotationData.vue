<template>
  <div>
    <h6>{{ $trans('Details') }}</h6>

    <div v-if="!isView">
      <b-form-group
        v-bind:label="$trans('ID')"
        label-for="quotation_id"
        label-cols="3"
      >
        <b-form-input
          disabled
          v-model="quotationData.quotation_id"
          id="quotation_id"
          size="sm"
        ></b-form-input>
      </b-form-group>
      <b-form-group
        v-bind:label="$trans('Name')"
        label-for="name"
        label-cols="3"
      >
        <b-form-input
          v-model="quotationData.name"
          id="name"
          size="sm"
          :state="isSubmitClicked ? !v$.quotationData.name.$error: null"
        ></b-form-input>
        <b-form-invalid-feedback
          :state="isSubmitClicked ? !v$.quotationData.name.$error : null">
          {{ $trans('Please enter a quotation name') }}
        </b-form-invalid-feedback>
      </b-form-group>

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
    <div v-else>
      <b-container>
        <b-row>
          <b-col cols="4">
            {{ $trans('Name') }}
          </b-col>
          <b-col cols="8">
            <p class="value">{{ checkValue(quotationData.name) }}</p>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="4">
            {{ $trans('Reference') }}
          </b-col>
          <b-col cols="8">
            <p class="value">{{ checkValue(quotationData.quotation_reference) }}</p>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="4">
            {{ $trans('Expiry days') }}
          </b-col>
          <b-col cols="8">
            <p class="value">{{ checkValue(quotationData.quotation_expire_days) }}</p>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="4">
            {{ $trans('Description') }}
          </b-col>
          <b-col cols="8">
            <p class="value">{{ checkValue(quotationData.description) }}</p>
          </b-col>
        </b-row>
      </b-container>
    </div>

  </div>
</template>
<script>
import {useVuelidate} from "@vuelidate/core";
import {required} from "@vuelidate/validators";

import {QuotationModel} from '@/models/quotations/Quotation.js';

import quotationMixin from "./mixin";

export default {
  name: 'QuotationDataForm',
  mixins: [quotationMixin],
  setup() {
    return { v$: useVuelidate() }
  },
  validations() {
    return {
      quotationData: {
        name: {
          required,
        },
        quotation_expire_days: {
          required,
        },
      }
    }
  },
  props: {
    quotation: {
      type: QuotationModel,
      default: null
    },
    isView: {
      type: [Boolean],
      default: false
    }
  },
  data () {
    return {
      isLoading: false,
      isSubmitClicked: false,
      quotationData: {
        quotation_reference: null,
        quotation_expire_days: null,
        description: null,
        name: null
      }
    }
  },
  async created() {
    this.quotationData = {
      quotation_reference: this.quotation.quotation_reference,
      quotation_expire_days: this.quotation.quotation_expire_days,
      description: this.quotation.description,
      name: this.quotation.name,
      quotation_id: this.quotation.quotation_id
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
p.value {
  width: 100%;
  border-bottom: 1px dotted gray;
}
</style>
