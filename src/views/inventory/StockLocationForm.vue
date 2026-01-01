<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
      <header>
        <div class="page-title">
          <h3>
            <b-icon icon="bookshelf"></b-icon>
            <span v-if="isCreate">{{ $trans('New stock location') }}</span>
            <span v-if="!isCreate">{{ $trans('Edit stock location') }}</span>
          </h3>
          <div class="flex-columns">
            <BButton @click="cancelForm" class="btn btn-secondary" type="button" variant="secondary">
              {{ $trans('Cancel') }}
            </BButton>
            <BButton @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
              {{ $trans('Submit') }}
            </BButton>
          </div>
        </div>
      </header>
      <div class="page-detail panel">
        <b-form>
          <b-row>
            <b-col cols="4" role="group">
              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Name')"
                label-for="stock-location-name"
              >
                <BFormInput
                  v-model="stockLocation.name"
                  id="stock-location-name"
                  size="sm"
                  :state="isSubmitClicked ? !v$.stockLocation.name.$error : null"
                ></BFormInput>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.stockLocation.name.$error : null">
                  {{ $trans('Please enter a name') }}
                </b-form-invalid-feedback>
              </BFormGroup>
            </b-col>
            <b-col cols="4" role="group">
              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Identifier')"
                label-for="stock-location-identifier"
              >
                <BFormInput
                  id="stock-location-identifier"
                  size="sm"
                  v-model="stockLocation.identifier"
                ></BFormInput>
              </BFormGroup>
            </b-col>
            <b-col cols="4" role="group">
              <BFormGroup
                label-size="sm"
                label-for="stock-location-show_in_stats"
                v-bind:label="$trans('Stats')"
              >
                <BFormCheckbox v-model="stockLocation.show_in_stats">{{ $trans('Show in stats') }}</BFormCheckbox>
              </BFormGroup>
            </b-col>
          </b-row>
        </b-form>
      </div>
    </div>
  </b-overlay>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'

import stockLocationModel from '@/models/inventory/StockLocation.js'
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";
const {create} = useToast()

export default {
  setup() {
    return { v$: useVuelidate() }
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  data() {
    return {
      isLoading: false,
      buttonDisabled: false,
      submitClicked: false,
      stockLocation: stockLocationModel.getFields(),
    }
  },
  validations: {
    stockLocation: {
      name: {
        required,
      },
    },
  },
  computed: {
    isCreate() {
      return !this.pk
    },
    isSubmitClicked() {
      return this.submitClicked
    }
  },
  created() {
    if (!this.isCreate) {
      this.loadData()
    } else {
      this.stockLocation = stockLocationModel.getFields()
    }
  },
  methods: {
    async submitForm() {
      this.submitClicked = true
      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

      // remove null fields
      const null_fields = []
      for (let i=0; i<null_fields.length; i++) {
        if (this.material[null_fields[i]] === null) {
          delete this.material[null_fields[i]]
        }
      }

      this.buttonDisabled = true
      this.isLoading = true

      if (this.isCreate) {
        try {
          await stockLocationModel.insert(this.stockLocation)
          infoToast(create, $trans('Created'), $trans('Stock location has been created'))
          this.buttonDisabled = false
          this.isLoading = false
          this.$router.go(-1)
        } catch(error) {
          console.log('Error creating stock location', error)
          errorToast(create, $trans('Error creating stock location'))
          this.buttonDisabled = false
          this.isLoading = false
        }

        return
      }

      try {
        await stockLocationModel.update(this.pk, this.stockLocation)
        infoToast(create, $trans('Updated'), $trans('Stock location has been updated'))
        this.buttonDisabled = false
        this.isLoading = false
        this.$router.go(-1)
      } catch(error) {
        console.log('Error updating stock location', error)
        errorToast(create, $trans('Error updating stock location'))
        this.buttonDisabled = false
        this.isLoading = false
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        this.stockLocation = await stockLocationModel.detail(this.pk)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching stock location', error)
        errorToast(create, $trans('Error fetching stock location'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
