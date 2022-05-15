<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2>{{ $trans('Move material') }}</h2>
        <b-row>
          <b-col cols="8" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Search material')"
              label-for="move-material-purchase-order-material-search"
            >
              <multiselect
                id="move-material-purchase-order-material-search"
                track-by="id"
                :placeholder="$trans('Type to search')"
                open-direction="bottom"
                :options="materials"
                :multiple="false"
                :internal-search="false"
                :clear-on-select="false"
                :close-on-select="true"
                :options-limit="30"
                :limit="10"
                :max-height="600"
                :show-no-results="false"
                :hide-selected="true"
                @search-change="getMaterials"
                @select="selectMaterial"
                :custom-label="materialLabel"
              >
                <span slot="noResult">{{ $trans('Oops! No elements found. Consider changing the search query.') }}</span>
              </multiselect>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Material')"
              label-for="move-material-material-name"
            >
              <b-form-input
                v-model="selectedMaterial.material_name"
                id="move-material-material-name"
                size="sm"
                readonly
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.selectedMaterialPk.$error : null">
                {{ $trans('Please select a material') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="8" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Search location')"
              label-for="move-material-from-location-search"
            >
              <multiselect
                id="move-material-from-location-search"
                track-by="id"
                open-direction="bottom"
                :options="fromLocations"
                :multiple="false"
                :searchable="false"
                :close-on-select="true"
                :options-limit="30"
                :limit="10"
                :max-height="600"
                :show-no-results="false"
                @select="selectFromLocation"
                :custom-label="fromLocationLabel"
              >
                <span slot="noResult">{{ $trans('Oops! No elements found. Consider changing the search query.') }}</span>
              </multiselect>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('From location')"
              label-for="move-material-from-location-name"
            >
              <b-form-input
                v-model="selectedFromLocation.location_name"
                id="move-material-from-location-name"
                size="sm"
                readonly
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.selectedFromLocationPk.$error : null">
                {{ $trans('Please select from location') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="6" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('To location')"
              label-for="move-material-to-location-search"
            >
              <multiselect
                id="move-material-to-location-search"
                track-by="id"
                :placeholder="$trans('Type to search')"
                open-direction="bottom"
                :options="toLocations"
                :multiple="false"
                :internal-search="true"
                :clear-on-select="false"
                :close-on-select="true"
                :options-limit="30"
                :limit="10"
                :max-height="600"
                :show-no-results="true"
                :hide-selected="true"
                @select="selectToLocation"
                :custom-label="toLocationLabel"
              >
                <span slot="noResult">{{ $trans('Oops! No elements found. Consider changing the search query.') }}</span>
              </multiselect>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('To location')"
              label-for="move-material-to-location-name"
            >
              <b-form-input
                v-model="selectedToLocation.name"
                id="move-material-to-location-name"
                size="sm"
                readonly
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.selectedToLocationPk.$error : null">
                {{ $trans('Please select to location') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Amount')"
              label-for="move-material-amount"
            >
              <b-form-input
                v-model="amount"
                id="move-material-amount"
                size="sm"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.amount.$error : null">
                {{ $trans('Please enter an amount') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
        </b-row>

        <div class="mx-auto">
          <footer class="modal-footer">
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

import inventoryModel from '@/models/inventory/Inventory.js'
import materialModel from '@/models/inventory/Material.js'
import stockLocationModel from '@/models/inventory/StockLocation.js'

const greaterThanZero = (value) => parseInt(value) > 0

export default {
  setup() {
    return { v$: useVuelidate() }
  },
  components: {
    Multiselect,
  },
  data() {
    return {
      isLoading: false,
      buttonDisabled: false,
      submitClicked: false,
      errorMessage: null,
      materials: [],
      toLocations: [],
      fromLocations: [],
      selectedMaterial: {},
      selectedMaterialPk: null,
      selectedFromLocation: {},
      selectedFromLocationPk: null,
      selectedToLocation: {},
      selectedToLocationPk: null,
      amount: null,
    }
  },
  validations: {
    selectedMaterialPk: {
      required,
    },
    selectedFromLocationPk: {
      required,
    },
    selectedToLocationPk: {
      required,
    },
    amount: {
      required,
      greaterThanZero
    },
  },
  computed: {
    isSubmitClicked() {
      return this.submitClicked
    }
  },
  created() {
    this.getToLocations()
    this.getMaterials('')
  },
  methods: {
    selectMaterial(option) {
      this.selectedMaterial = option
      this.selectedMaterialPk = option.material_id
      this.getFromLocations()
    },
    async getMaterials(query) {
      this.isLoading = true
      try {
        this.materials = await inventoryModel.getMaterials(query)
        this.isLoading = false
      } catch(error) {
        console.log('Error fetching materials', error)
        this.isLoading = false
        this.errorToast(this.$trans('Error fetching materials'))
      }
    },
    materialLabel(material) {
      const text = this.$trans('in stock')
      return `${material.material_name}, ${text}: ${material.total_amount}`
    },
    fromLocationLabel(location) {
      return `${location.location_name} (${location.total_amount})`
    },
    toLocationLabel(location) {
      return `${location.name}`
    },
    selectFromLocation(option) {
      this.selectedFromLocation = option
      this.selectedFromLocationPk = option.location_id
    },
    async getFromLocations() {
      this.isLoading = true
      try {
        this.fromLocations = await inventoryModel.getLocationsForMaterial(this.selectedMaterial.material_id)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching locations', error)
        this.errorToast(this.$trans('Error fetching locations'))
        this.isLoading = false
      }
    },
    selectToLocation(option) {
      this.selectedToLocation = option
      this.selectedToLocationPk = option.id
    },
    async getToLocations() {
      this.isLoading = true

      try {
        const data = await stockLocationModel.list()
        this.toLocations = data.results
        this.isLoading = false
      } catch(error) {
        console.log('Error fetching locations', error)
        this.errorToast(this.$trans('Error fetching locations'))
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

      try {
        await materialModel.move(this.selectedMaterialPk,
                                 this.selectedFromLocationPk,
                                 this.selectedToLocationPk,
                                 this.amount)
          this.infoToast(this.$trans('Moved'), this.$trans('Material moved'))
          this.buttonDisabled = false
          this.isLoading = false
          this.$router.push({name: 'mutation-list'})
      } catch(error) {
        console.log('error moving', error)
        this.errorToast(this.$trans('Error moving material'))
        this.buttonDisabled = false
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
