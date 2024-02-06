<template>
  <b-overlay :show="isLoading" rounded="sm">
    <h4>{{ $trans('Quotation data')}} </h4>
    <b-row>
      <b-col cols="2" role="group">
        <b-form-group
          label-size="sm"
          v-bind:label="$trans('Reference')"
          label-for="quotation_reference"
        >
          <b-form-input
            v-model="quotation.quotation_reference"
            id="quotation_reference"
            size="sm"
          ></b-form-input>
        </b-form-group>
      </b-col>
      <b-col cols="6" role="group">
        <b-form-group
          label-size="sm"
          v-bind:label="$trans('Description')"
          label-for="quotation_description"
        >
          <b-form-textarea
            id="quotation_description"
            v-model="quotation.description"
            rows="1"
          ></b-form-textarea>
        </b-form-group>
      </b-col>
      <b-col cols="2" role="group">
        <b-form-group
          label-size="sm"
          v-bind:label="$trans('Accepted')"
          label-for="quotation_accepted"
        >
          <b-form-checkbox
            id="quotation_accepted"
            v-model="quotation.accepted"
            value="true"
            unchecked-value="false"
          >
          </b-form-checkbox>
        </b-form-group>
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="3" role="group">
        <b-form-group
          label-size="sm"
          v-bind:label="$trans('Signature name engineer')"
          label-for="signature_name_engineer"
        >
          <b-form-input
            v-model="quotation.signature_name_engineer"
            id="signature_name_engineer"
            size="sm"
          ></b-form-input>
        </b-form-group>
      </b-col>
      <b-col cols="3">
        <b-form-group
          label-size="sm"
          v-bind:label="$trans('Signature engineer')"
          label-for="signature_engineer"
        >
          <b-form-file
            id="signature_engineer"
            accept="image/*"
            :placeholder="$trans('Choose a file or drop it here...')"
            @input="engineerImageSignatureSelected"
          ></b-form-file>
        </b-form-group>
      </b-col>
      <b-col cols="3">
        <h3>{{ $trans('Current image') }}</h3>
        <img width="200px" :src="engineer_signature_current_image" alt=""/>
      </b-col>
      <b-col cols="3">
        <h3>{{ $trans('Upload preview') }}</h3>
        <img width="200px" :src="engineer_signature_upload_preview" alt=""/>
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="3" role="group">
        <b-form-group
          label-size="sm"
          v-bind:label="$trans('Signature name customer')"
          label-for="signature_name_customer"
        >
          <b-form-input
            v-model="quotation.signature_name_customer"
            id="signature_name_customer"
            size="sm"
          ></b-form-input>
        </b-form-group>
      </b-col>
      <b-col cols="3">
        <b-form-group
          label-size="sm"
          v-bind:label="$trans('Signature customer')"
          label-for="signature_customer"
        >
          <b-form-file
            id="signature_customer"
            accept="image/*"
            :placeholder="$trans('Choose a file or drop it here...')"
            @input="customerImageSignatureSelected"
          ></b-form-file>
        </b-form-group>
      </b-col>
      <b-col cols="3">
        <h3>{{ $trans('Current image') }}</h3>
        <img width="200px" :src="customer_signature_current_image" alt=""/>
      </b-col>
      <b-col cols="3">
        <h3>{{ $trans('Upload preview') }}</h3>
        <img width="200px" :src="customer_signature_upload_preview" alt=""/>
      </b-col>
    </b-row>
  </b-overlay>
</template>
<script>
import {INVOICE_LINE_TYPE_MANUAL} from "./constants";
import {useVuelidate} from "@vuelidate/core";
import quotationService from '@/models/quotations/Quotation.js';
import {NO_IMAGE_URL} from "../../../constants"


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
    submitQuotationLineform: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    quotationData: {
      handler(newValue) {
        this.quotation = newValue
      },
      deep: true
    },
    submitQuotationLineform (val) {
      if (val) {
        this.submitQuotation()
      }
    }
  },
  data () {
    return {
      isLoading: false,
      quotation: this.quotationData,
      quotationService,
      INVOICE_LINE_TYPE_MANUAL,
      engineer_signature_current_image: NO_IMAGE_URL,
      engineer_signature_upload_preview: NO_IMAGE_URL,
      customer_signature_upload_preview: NO_IMAGE_URL,
      customer_signature_current_image: NO_IMAGE_URL
    }
  },
  async created() {
    this.isLoading = true
    this.engineer_signature_current_image = this.quotation.signature_engineer ?
      this.quotation.signature_engineer : NO_IMAGE_URL
    this.customer_signature_current_image = this.quotation.signature_customer ?
      this.quotation.signature_customer : NO_IMAGE_URL
    this.isLoading = false
  },
  methods: {
    engineerImageSignatureSelected(file) {
      const reader = new FileReader()
      reader.onload = (f) => {
        const b64 = f.target.result
        this.engineer_signature_upload_preview = b64
        this.quotation.signature_engineer = b64
      }
      reader.readAsDataURL(file)
    },
    customerImageSignatureSelected(file) {
      const reader = new FileReader()
      reader.onload = (f) => {
        const b64 = f.target.result
        this.customer_signature_upload_preview = b64
        this.quotation.signature_customer = b64
      }
      reader.readAsDataURL(file)
    },
    async submitQuotation () {
      this.isLoading = true
      this.$emit('quotationSubmitted', true)

      try {
          await this.quotationService.update(this.quotation.id, this.quotation)
          this.infoToast(this.$trans('Updated'), this.$trans('quotation has been updated'))
          this.isLoading = false
          this.$emit('quotationSubmitted', false)
          this.$router.push({ name: 'quotation-list'})
        } catch(error) {
          console.log('error fetching quotation', error)
          this.errorToast(this.$trans('Error updating quotation'))
          this.isLoading = false
          this.$emit('quotationSubmitted', false)
      }
    }
  }
}
</script>
<style scoped>
.flex {
  display : flex;
  margin-top: auto;
}
.value-container {
  padding-top: 4px;
  padding-right: 4px;
  padding-left: 4px;
}
.update-button {
  margin-bottom: 8px;
}
.header {
  font-size: 14px;
  font-weight: bold;
}
.total-text {
  font-weight: bold;
}
.quotation-total {
  margin-bottom: 20px;
}
</style>
