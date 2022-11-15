<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New stock location') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit stock location') }}</h2>
        <b-row>
          <b-col cols="6" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Name')"
              label-for="stock-location-name"
            >
              <b-form-input
                v-model="stockLocation.name"
                id="stock-location-name"
                size="sm"
                :state="isSubmitClicked ? !v$.stockLocation.name.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.stockLocation.name.$error : null">
                {{ $trans('Please enter a name') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Identifier')"
              label-for="stock-location-identifier"
            >
              <b-form-input
                id="stock-location-identifier"
                size="sm"
                v-model="stockLocation.identifier"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Show in stats?')"
              label-for="stock-location-show_in_stats"
            >
              <b-form-checkbox
                v-model="stockLocation.show_in_stats"
              >
              </b-form-checkbox>
            </b-form-group>
          </b-col>
        </b-row>
        <div class="mx-auto">
          <footer class="modal-footer">
            <b-button @click="cancelForm" class="btn btn-secondary" type="button" variant="secondary">
              {{ $trans('Cancel') }}
            </b-button>
            <b-button @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
              {{ $trans('Submit') }}
            </b-button>
          </footer>
        </div>
      </b-form>
    </div>
  </b-overlay>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'

import stockLocationModel from '@/models/inventory/StockLocation.js'

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
          this.infoToast(this.$trans('Created'), this.$trans('Stock location has been created'))
          this.buttonDisabled = false
          this.isLoading = false
          this.$router.go(-1)
        } catch(error) {
          console.log('Error creating stock location', error)
          this.errorToast(this.$trans('Error creating stock location'))
          this.buttonDisabled = false
          this.isLoading = false
        }

        return
      }

      try {
        await stockLocationModel.update(this.pk, this.stockLocation)
        this.infoToast(this.$trans('Updated'), this.$trans('Stock location has been updated'))
        this.buttonDisabled = false
        this.isLoading = false
        this.$router.go(-1)
      } catch(error) {
        console.log('Error updating stock location', error)
        this.errorToast(this.$trans('Error updating stock location'))
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
        this.errorToast(this.$trans('Error fetching stock location'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
