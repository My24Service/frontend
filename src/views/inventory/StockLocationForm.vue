<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New stock location') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit stock location') }}</h2>
        <b-row>
          <b-col cols="8" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Name')"
              label-for="stock-location-name"
            >
              <b-form-input
                v-model="stockLocation.name"
                id="stock-location-name"
                size="sm"
                :state="isSubmitClicked ? !$v.stockLocation.name.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !$v.stockLocation.name.$error : null">
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
import { required } from 'vuelidate/lib/validators'
import stockLocationModel from '@/models/inventory/StockLocation'

export default {
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
    submitForm() {
      this.submitClicked = true
      this.$v.$touch()
      if (this.$v.$invalid) {
        console.log('invalid?', this.$v.$invalid)
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
        return this.$store.dispatch('getCsrfToken').then((token) => {
          stockLocationModel.insert(token, this.stockLocation).then((stockLocation) => {
            this.flashMessage.show({
              status: 'info',
              title: this.$trans('Created'),
              message: this.$trans('Stock location has been created')
            })

            this.buttonDisabled = false
            this.isLoading = false
            this.$router.go(-1)
          }).catch(() => {
            this.flashMessage.show({
              status: 'error',
              title: this.$trans('Error'),
              message: this.$trans('Error creating stock location')
            })

            this.buttonDisabled = false
            this.isLoading = false
          })
        })
      }

      this.$store.dispatch('getCsrfToken').then((token) => {
        stockLocationModel.update(token, this.pk, this.stockLocation).then(() => {
          this.flashMessage.show({
            status: 'info',
            title: this.$trans('Updated'),
            message: this.$trans('Stock location has been updated')
          })

          this.buttonDisabled = false
          this.isLoading = false
          this.$router.go(-1)
        }).catch(() => {
          this.flashMessage.show({
            status: 'error',
            title: this.$trans('Error'),
            message: this.$trans('Error updating stock location')
          })

          this.buttonDisabled = false
          this.isLoading = false
        })
      })
    },
    loadData() {
      this.isLoading = true

      stockLocationModel.detail(this.pk).then((stockLocation) => {
        this.stockLocation = stockLocation
        this.isLoading = false
      }).catch((error) => {
        console.log('error fetching stock location', error)
        this.flashMessage.show({
          status: 'error',
          title: this.$trans('Error'),
          message: this.$trans('Error fetching stock location')
        })

        this.isLoading = false
      })
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
