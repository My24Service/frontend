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
                :state="isSubmitClicked ? !$v.selectedMaterialPk.$error : null">
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
                :state="isSubmitClicked ? !$v.selectedFromLocationPk.$error : null">
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
                :state="isSubmitClicked ? !$v.selectedToLocationPk.$error : null">
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
                :state="isSubmitClicked ? !$v.amount.$error : null">
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
import Multiselect from 'vue-multiselect'
import { required } from 'vuelidate/lib/validators'
import inventoryModel from '@/models/inventory/Inventory'
import materialModel from '@/models/inventory/Material'
import stockLocationModel from '@/models/inventory/StockLocation'

const greaterThanZero = (value) => parseInt(value) > 0

export default {
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
    getMaterials(query) {
      this.isLoading = true
      inventoryModel.getMaterials(query).then((materials) => {
        this.materials = materials
        this.isLoading = false
      }).catch((error) => {
        console.log('Error fetching materials', error)
        this.flashMessage.show({
          status: 'error',
          title: this.$trans('Error'),
          message: this.$trans('Error fetching materials')
        })
        this.isLoading = false
      })
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
    getFromLocations() {
      this.isLoading = true
      inventoryModel.getLocationsForMaterial(this.selectedMaterial.material_id).then((locations) => {
        this.fromLocations = locations
        this.isLoading = false
      }).catch(() => {
        this.flashMessage.show({
          status: 'error',
          title: this.$trans('Error'),
          message: this.$trans('Error fetching locations')
        })
        this.isLoading = false
      })
    },
    selectToLocation(option) {
      this.selectedToLocation = option
      this.selectedToLocationPk = option.id
    },
    getToLocations() {
      this.isLoading = true
      stockLocationModel.list().then((data) => {
        this.toLocations = data.results
        this.isLoading = false
      }).catch(() => {
        this.flashMessage.show({
          status: 'error',
          title: this.$trans('Error'),
          message: this.$trans('Error fetching locations')
        })
        this.isLoading = false
      })
    },
    submitForm() {
      this.submitClicked = true
      this.$v.$touch()
      if (this.$v.$invalid) {
        console.log('invalid?', this.$v.$invalid)
        return
      }

      this.buttonDisabled = true
      this.isLoading = true

      return this.$store.dispatch('getCsrfToken').then((token) => {
        materialModel.move(token,
                           this.selectedMaterialPk,
                           this.selectedFromLocationPk,
                           this.selectedToLocationPk,
                           this.amount).then((result) => {
          this.flashMessage.show({
            status: 'info',
            title: this.$trans('Moved'),
            message: this.$trans('Material moved')
          })

          this.buttonDisabled = false
          this.isLoading = false
          this.$router.push({name: 'mutation-list'})
        }).catch((error) => {
          console.log('error moving', error)
          this.flashMessage.show({
            status: 'error',
            title: this.$trans('Error'),
            message: this.$trans('Error moving material')
          })

          this.buttonDisabled = false
          this.isLoading = false
        })
      })
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
