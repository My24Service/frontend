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

        <div class="reservation-materials">
          <h4>{{ $trans('Materials') }}</h4>
          <b-row>
            <b-col cols="12">
              <b-table
                v-if="supplierReservation.materials.length > 0"
                small
                :fields="materialFields"
                :items="supplierReservation.materials" responsive="md"
              >
                <template #cell(icons)="data">
                  <div class="float-right">
                    <b-link class="h5 mx-2" @click="editMaterial(data.item, data.index)">
                      <b-icon-pencil></b-icon-pencil>
                    </b-link>
                    <b-link class="h5 mx-2" @click.prevent="deleteMaterial(data.index)">
                      <b-icon-trash></b-icon-trash>
                    </b-link>
                  </div>
                </template>
              </b-table>
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="12" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Search product')"
              >
                <multiselect
                  id="reservation-material-name"
                  track-by="id"
                  label="name"
                  :placeholder="$trans('Type to search')"
                  open-direction="bottom"
                  :options="materialsSearch"
                  :multiple="false"
                  :loading="isLoading"
                  :internal-search="false"
                  :clear-on-select="true"
                  :close-on-select="true"
                  :options-limit="30"
                  :limit="10"
                  :max-height="600"
                  :show-no-results="false"
                  :hide-selected="true"
                  @search-change="getMaterials"
                  @select="selectMaterial"
                >
                  <span slot="noResult">{{ $trans('Oops! No elements found. Consider changing the search query.') }}</span>
                </multiselect>
              </b-form-group>
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="4" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Name')"
                label-for="reservation-material-name"
              >
                <b-form-input
                  id="reservation-material-name"
                  size="sm"
                  v-model="material.material_name"
                  readonly
                  :state="!v$.material.material.$error"
                ></b-form-input>
                <b-form-invalid-feedback
                  :state="!v$.material.material.$error">
                  {{ $trans('Please select a product') }}
                </b-form-invalid-feedback>
              </b-form-group>
            </b-col>
            <b-col cols="4" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Amount')"
                label-for="reservation-material-amount"
              >
                <b-form-input
                  id="reservation-material-amount"
                  size="sm"
                  v-model="material.amount"
                  :state="!v$.material.amount.$error"
                  ref="amount"
                ></b-form-input>
                <b-form-invalid-feedback
                  :state="!v$.material.amount.$error">
                  {{ $trans('Please enter an amount') }}
                </b-form-invalid-feedback>
              </b-form-group>
            </b-col>
            <b-col cols="4" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Remarks')"
                label-for="reservation-material-remarks"
              >
                <b-form-textarea
                  id="reservation-material-remarks"
                  v-model="material.remarks"
                  rows="1"
                ></b-form-textarea>
              </b-form-group>
            </b-col>
          </b-row>
          <footer class="modal-footer">
            <b-button
              v-if="isEditMaterial"
              @click="doEditMaterial"
              class="btn btn-primary"
              size="sm"
              type="button"
              variant="warning">
              {{ $trans('Edit product') }}
            </b-button>
            <b-button
              v-if="!isEditMaterial"
              @click="addMaterial"
              class="btn btn-primary"
              size="sm"
              type="button"
              variant="primary"
              :disabled="!isMaterialValid"
            >
              {{ $trans('Add product') }}
            </b-button>
          </footer>
        </div>

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
import supplierReservationMaterialModel from '@/models/inventory/SupplierReservationMaterial.js'
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
      isLoading: true,
      buttonDisabled: false,
      submitClicked: false,
      model: supplierReservationModel,
      supplierReservation: supplierReservationModel.getFields(),
      material: supplierReservationMaterialModel.getFields(),
      errorMessage: null,

      suppliers: [],
      materialsSearch: [],

      selectedSupplier: {},

      isEditMaterial: false,

      materialFields: [
        { key: 'material_name', label: this.$trans('Name') },
        { key: 'amount', label: this.$trans('Amount') },
        { key: 'remarks', label: this.$trans('Remarks') },
        { key: 'icons', label: '' }
      ],
    }
  },
  validations() {
    return {
      supplierReservation: {
        supplier: {
          required,
        },
      },
      material: {
        material: {
          required
        },
        amount: {
          required,
          greaterThanZero
        },
      }
    }
  },
  computed: {
    isCreate() {
      return !this.pk
    },
    isSubmitClicked() {
      return this.submitClicked
    },
    isMaterialValid() {
      this.v$.material.material.$touch()
      this.v$.material.amount.$touch()
      return !this.v$.material.amount.$invalid && !this.v$.material.material.$invalid;
    }
  },
  async created() {
    this.isLoading = true

    await this.getSuppliers('')

    if (!this.isCreate) {
      await this.loadData()
    } else {
      this.supplierReservation = this.model.getFields()
    }
    this.emptyMaterial()

    this.isLoading = false
  },
  methods: {
    // materials
    deleteMaterial(index) {
      this.supplierReservation.materials.splice(index, 1)
    },
    editMaterial(item, index) {
      this.editIndex = index
      this.isEditMaterial = true

      this.material = item
    },
    emptyMaterial() {
      this.material = supplierReservationMaterialModel.getFields()
    },
    doEditMaterial() {
      this.supplierReservation.materials.splice(this.editIndex, 1, this.material)
      this.editIndex = null
      this.isEditMaterial = false
      this.emptyMaterial()
    },
    addMaterial() {
      if (!this.isMaterialValid) {
        return
      }
      this.supplierReservation.materials.push(this.material)
      this.emptyMaterial()
      this.v$.$reset()
    },
    selectMaterial(option) {
      this.material.material = option.id
      this.material.material_name = option.name
      this.material.amount = 0
      this.material.remarks = ''
      this.v$.material.material.$touch()
      this.v$.material.amount.$touch()
      this.$refs.amount.focus()
    },
    materialLabel(material) {
      return `${material.name}`
    },

    selectSupplier(option) {
      this.supplierReservation.supplier = option.id
      this.selectedSupplier = option

      this.getMaterials('')
    },
    async getSuppliers(query) {
      this.isLoading = true

      try {
        supplierModel.setSearchQuery(query)
        const data = await supplierModel.list()
        this.suppliers = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching suppliers', error)
        this.errorToast(this.$trans('Error fetching suppliers'))
        this.isLoading = false
      }
    },
    supplierLabel (supplier) {
      return `${supplier.name}, - ${supplier.city}`
    },
    async getMaterials(query) {
      if (!this.selectedSupplier.id) {
        return
      }

      try {
        this.isLoading = true
        materialModel.setListArgs(`supplier_relation=${this.selectedSupplier.id}`)
        materialModel.setSearchQuery(query)
        const data = await materialModel.list()
        this.materialsSearch = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching materials', error)
        this.errorToast(this.$trans('Error fetching materials'))
        this.isLoading = false
      }
    },

    async submitForm() {
      this.submitClicked = true
      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

      this.buttonDisabled = true
      this.isLoading = true

      if (this.isCreate) {
        try {
          const reservation = await this.model.insert(this.supplierReservation)
          for (let material of this.supplierReservation.materials) {
            material.reservation = reservation.id
            await supplierReservationMaterialModel.insert(material)
          }

          this.infoToast(this.$trans('Created'), this.$trans('Reservation has been created'))
          this.buttonDisabled = false
          this.isLoading = false
          this.$router.go(-1)
        } catch(error) {
          console.log('Error creating reservation', error)
          this.errorToast(this.$trans('Error creating reservation'))
          this.buttonDisabled = false
          this.isLoading = false
        }

        return
      }

      try {
        await supplierReservationModel.update(this.pk, this.supplierReservation)
        this.infoToast(this.$trans('Updated'), this.$trans('Reservation has been updated'))
        this.buttonDisabled = false
        this.isLoading = false
        this.$router.go(-1)
      } catch(error) {
        console.log('Error updating reservation', error)
        this.errorToast(this.$trans('Error updating reservation'))
        this.buttonDisabled = false
        this.isLoading = false
      }
    },
    async loadData() {
      try {
        this.supplierReservation = await supplierReservationModel.detail(this.pk)
        this.selectedSupplier = this.supplierReservation.supplier_view

        await this.getMaterials('')
      } catch(error) {
          console.log('error fetching reservation', error)
          this.errorToast(this.$trans('Error fetching reservation'))
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
