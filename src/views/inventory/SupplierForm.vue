<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New supplier') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit supplier') }}</h2>
        <b-row>
          <b-col cols="1" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Identifier')"
              label-for="supplier-identifier"
            >
              <b-form-input
                id="supplier-identifier"
                size="sm"
                v-model="supplier.identifier"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Name')"
              label-for="supplier-name"
            >
              <b-form-input
                v-model="supplier.name"
                id="supplier-name"
                size="sm"
                :state="isSubmitClicked ? !v$.supplier.name.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.supplier.name.$error : null">
                {{ $trans('Please enter a name') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Address')"
              label-for="supplier-address"
            >
              <b-form-input
                v-model="supplier.address"
                id="supplier-address"
                size="sm"
                :state="isSubmitClicked ? !v$.supplier.address.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.supplier.address.$error : null">
                {{ $trans('Please enter an address') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="1" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Postal')"
              label-for="supplier-postal"
            >
              <b-form-input
                id="supplier-postal"
                size="sm"
                v-model="supplier.postal"
                :state="isSubmitClicked ? !v$.supplier.postal.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.supplier.postal.$error : null">
                {{ $trans('Please enter the postal') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('City')"
              label-for="supplier-city"
            >
              <b-form-input
                id="supplier-city"
                size="sm"
                v-model="supplier.city"
                :state="isSubmitClicked ? !v$.supplier.city.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.supplier.city.$error : null">
                {{ $trans('Please enter the city') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Country')"
              label-for="supplier-city"
            >
              <b-form-select v-model="supplier.country_code" :options="countries" size="sm"></b-form-select>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Email')"
              label-for="supplier-email"
            >
              <b-form-input
                id="supplier-email"
                size="sm"
                v-model="supplier.email"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Tel.')"
              label-for="supplier-tel"
            >
              <b-form-input
                id="supplier-tel"
                size="sm"
                v-model="supplier.tel"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Mobile')"
              label-for="supplier-mobile"
            >
              <b-form-input
                id="supplier-mobile"
                size="sm"
                v-model="supplier.mobile"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Contact')"
              label-for="supplier-contact"
            >
              <b-form-textarea
                id="supplier-contact"
                v-model="supplier.contact"
                rows="2"
              ></b-form-textarea>
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

import supplierModel from '@/models/inventory/Supplier.js'

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
      countries: [],
      supplier: supplierModel.getFields(),
      errorMessage: null,
    }
  },
  validations: {
    supplier: {
      name: {
        required,
      },
      address: {
        required,
      },
      postal: {
        required,
      },
      city: {
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
    this.$store.dispatch('getCountries')
      .then((countries) => {
        this.countries = countries

        if (!this.isCreate) {
          this.loadData()
        } else {
          this.supplier = supplierModel.getFields()
        }
      })
  },
  methods: {
    submitForm() {
      this.submitClicked = true
      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

      // remove null fields
      const null_fields = []
      for (let i=0; i<null_fields.length; i++) {
        if (this.purchaseOrder[null_fields[i]] === null) {
          delete this.purchaseOrder[null_fields[i]]
        }
      }

      this.buttonDisabled = true
      this.isLoading = true

      if (this.isCreate) {
        return this.$store.dispatch('getCsrfToken').then((token) => {
          supplierModel.insert(token, this.supplier).then((order) => {
            this.infoToast(this.$trans('Created'), this.$trans('Supplier has been created'))
            this.buttonDisabled = false
            this.isLoading = false
            this.$router.go(-1)
          }).catch(() => {
            this.errorToast(this.$trans('Error creating supplier'))
            this.buttonDisabled = false
            this.isLoading = false
          })
        })
      }

      this.$store.dispatch('getCsrfToken').then((token) => {
        supplierModel.update(token, this.pk, this.supplier).then(() => {
          this.infoToast(this.$trans('Updated'), this.$trans('Supplier has been updated'))
          this.buttonDisabled = false
          this.isLoading = false
          this.$router.go(-1)
        }).catch(() => {
          this.errorToast(this.$trans('Error updating supplier'))
          this.buttonDisabled = false
          this.isLoading = false
        })
      })
    },
    loadData() {
      this.isLoading = true

      supplierModel.detail(this.pk).then((supplier) => {
        this.supplier = supplier
        this.isLoading = false
      }).catch((error) => {
        console.log('error fetching supplier', error)
        this.errorToast(this.$trans('Error fetching supplier'))
        this.isLoading = false
      })
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
