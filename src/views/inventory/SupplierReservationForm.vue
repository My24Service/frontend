<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New reservation') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit reservation') }}</h2>
        <b-row>
          <b-col cols="12" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Supplier')"
              label-for="supplier-reservation-supplier-search"
            >
              <multiselect
                id="supplier-reservation-supplier-search"
                track-by="id"
                :placeholder="$trans('Type to search')"
                open-direction="bottom"
                :options="suppliers"
                :multiple="false"
                :internal-search="false"
                :clear-on-select="true"
                :close-on-select="true"
                :options-limit="30"
                :limit="10"
                :max-height="600"
                :show-no-results="false"
                :hide-selected="true"
                @search-change="getSuppliers"
                @select="selectSupplier"
                :custom-label="supplierLabel"
              >
                <span slot="noResult">{{ $trans('Oops! No elements found. Consider changing the search query.') }}</span>
              </multiselect>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.supplierReservation.supplier.$error : null">
                {{ $trans('Please select a supplier') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Supplier')"
              label-for="supplier-reservation-supplier-name"
            >
              <b-form-input
                v-model="selectedSupplier.name"
                id="supplier-reservation-supplier-name"
                readonly
                size="sm"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Address')"
              label-for="supplier-reservation-supplier-address"
            >
              <b-form-input
                v-model="selectedSupplier.address"
                id="supplier-reservation-supplier-address"
                readonly
                size="sm"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('City')"
              label-for="supplier-reservation-supplier-city"
            >
              <b-form-input
                v-model="selectedSupplier.city"
                id="supplier-reservation-supplier-city"
                size="sm"
                readonly
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Email')"
              label-for="supplier-reservation-supplier-email"
            >
              <b-form-input
                v-model="selectedSupplier.email"
                id="supplier-reservation-supplier-email"
                size="sm"
                readonly
              ></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>

        <b-row>
          <b-col cols="12" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Material')"
              label-for="supplier-reservation-material-search"
            >
              <multiselect
                id="supplier-reservation-material-search"
                track-by="id"
                :placeholder="$trans('Type to search')"
                open-direction="bottom"
                :options="materials"
                :multiple="false"
                :internal-search="false"
                :clear-on-select="true"
                :close-on-select="true"
                :options-limit="30"
                :limit="10"
                :max-height="600"
                :show-no-results="false"
                :hide-selected="true"
                @select="selectMaterial"
                :custom-label="materialLabel"
              >
                <span slot="noResult">{{ $trans('Oops! No elements found. Consider changing the search query.') }}</span>
              </multiselect>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.supplierReservation.material.$error : null">
                {{ $trans('Please select a material') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Name')"
              label-for="supplier-reservation-material-name"
            >
              <b-form-input
                v-model="selectedMaterial.name"
                id="supplier-reservation-material-name"
                readonly
                size="sm"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Unit')"
              label-for="supplier-reservation-material-unit"
            >
              <b-form-input
                v-model="selectedMaterial.unit"
                id="supplier-reservation-material-unit"
                size="sm"
                readonly
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Amount')"
              label-for="supplier-reservation-amount"
            >
              <b-form-input
                v-model="supplierReservation.amount"
                id="supplier-reservation-amount"
                size="sm"
                :state="isSubmitClicked ? !v$.supplierReservation.amount.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.supplierReservation.amount.$error : null">
                {{ $trans('Please enter an amount') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Remarks')"
              label-for="supplier-reservation-remarks"
            >
              <b-form-textarea
                id="supplier-reservation-remarks"
                v-model="supplierReservation.remarks"
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
import Multiselect from 'vue-multiselect'

import supplierReservationModel from '@/models/inventory/SupplierReservation.js'
import supplierModel from '@/models/inventory/Supplier.js'
import materialModel from '@/models/inventory/Material.js'

const greaterThanZero = (value) => parseInt(value) > 0

export default {
  setup() {
    return { v$: useVuelidate() }
  },
  components: {
    Multiselect,
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
      supplierReservation: supplierReservationModel.getFields(),
      errorMessage: null,

      suppliers: [],
      materials: [],

      selectedSupplier: {},
      selectedMaterial: {},
    }
  },
  validations: {
    supplierReservation: {
      supplier: {
        required,
      },
      material: {
        required,
      },
      amount: {
        required,
        greaterThanZero
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
    this.getSuppliers('')

    if (!this.isCreate) {
      this.loadData()
    } else {
      this.supplierReservation = supplierReservationModel.getFields()
    }
  },
  methods: {
    selectSupplier(option) {
      this.supplierReservation.supplier = option.id
      this.selectedSupplier = option

      this.getMaterials('')
    },
    getSuppliers(query) {
      this.isLoading = true
      supplierModel.setSearchQuery(query)
      supplierModel.list().then((data) => {
          this.suppliers = data.results
          this.isLoading = false
        }).catch((error) => {
          console.log('error fetching suppliers', error)
          this.errorToast(this.$trans('Error fetching suppliers'))
          this.isLoading = false
        })
    },
    supplierLabel (supplier) {
      return `${supplier.name}, - ${supplier.city}`
    },

    getMaterials(query) {
      if (!this.selectedSupplier.id) {
        return
      }

      this.isLoading = true
      materialModel.setListArgs(`supplier_relation=${this.selectedSupplier.id}`)
      materialModel.setSearchQuery(query)
      materialModel.list().then((data) => {
          this.materials = data.results
          this.isLoading = false
        }).catch(() => {
          this.errorToast(this.$trans('Error fetching materials'))
          this.isLoading = false
        })
    },
    selectMaterial(option) {
      this.supplierReservation.material = option.id
      this.selectedMaterial = option
    },
    materialLabel(material) {
      return `${material.name}`
    },

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
        if (this.supplierReservation[null_fields[i]] === null) {
          delete this.supplierReservation[null_fields[i]]
        }
      }

      this.buttonDisabled = true
      this.isLoading = true

      if (this.isCreate) {
        return this.$store.dispatch('getCsrfToken').then((token) => {
          supplierReservationModel.insert(token, this.supplierReservation).then((supplierReservation) => {
            this.infoToast(this.$trans('Created'), this.$trans('Reservation has been created'))
            this.buttonDisabled = false
            this.isLoading = false
            this.$router.go(-1)
          }).catch(() => {
            this.errorToast(this.$trans('Error creating reservation'))
            this.buttonDisabled = false
            this.isLoading = false
          })
        })
      }

      this.$store.dispatch('getCsrfToken').then((token) => {
        supplierReservationModel.update(token, this.pk, this.supplierReservation).then(() => {
          this.infoToast(this.$trans('Updated'), this.$trans('Reservation has been updated'))
          this.buttonDisabled = false
          this.isLoading = false
          this.$router.go(-1)
        }).catch(() => {
          this.errorToast(this.$trans('Error updating reservation'))
          this.buttonDisabled = false
          this.isLoading = false
        })
      })
    },
    loadData() {
      this.isLoading = true
      supplierReservationModel.detail(this.pk).then((supplierReservation) => {
          this.supplierReservation = supplierReservation
          this.selectedSupplier = supplierReservation.supplier_view
          this.selectedMaterial = supplierReservation.material_view
          this.isLoading = false

          this.getMaterials('')
      }).catch((error) => {
          console.log('error fetching reservation', error)
          this.errorToast(this.$trans('Error fetching reservation'))
          this.isLoading = false
        })
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
