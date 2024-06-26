<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3><b-icon icon="box-arrow-right"></b-icon>{{ $trans('Move materials') }}</h3>
        <div class="flex-columns" style="z-index:1000">
          <b-dropdown split :text="$trans('Submit')" class="m-2" variant="primary" @click="submitForm" :disabled="canSubmit">
            <b-dropdown-item-button
              @click="submitFormBulk"
              :disabled="canSubmit"
              title="Submit and move another material">
              {{ $trans('Bulk') }}
            </b-dropdown-item-button>
          </b-dropdown>
          <!--
          <b-button @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
              {{ $trans('Submit') }}
            </b-button>
            <b-button @click="submitFormBulk" :disabled="buttonDisabled" type="button" variant="success">
              {{ $trans('Bulk') }}
            </b-button>
            -->
        </div>
      </div>
    </header>
    <div class="page-detail">
      <b-form class="flex-columns">

        <div class="panel col-1-3">
          <h6>{{ $trans("Material") }}</h6>

            <div v-if="selectedMaterial.material_name">
              <h3>{{ selectedMaterial.material_name }}</h3>
              <dl>
                <dt>{{ $trans("In stock") }}</dt>
                <dd>{{ selectedMaterial.total_amount }}</dd>
                <dt>{{ $trans("Supplier") }}</dt>
                <dd>{{ selectedMaterial.supplier_name }}</dd>
                <dt v-if="selectedMaterial.material_identifier">{{ $trans("Identifier") }}</dt>
                <dd v-if="selectedMaterial.material_identifier">{{ selectedMaterial.material_identifier }}</dd>
              </dl>
              <h6>{{$trans('Amount')}}</h6>
              <b-form-group
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Number of items to move')"
                label-for="move-material-amount"
              >
                <b-form-input
                  ref="amount"
                  v-model="amount"
                  id="move-material-amount"
                  size="sm"
                  type="number"
                  :max="selectedMaterial.total_amount"
                  min="1"
                ></b-form-input>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.amount.$error : null">
                  {{ $trans('Please enter an amount') }}
                </b-form-invalid-feedback>
              </b-form-group>
            </div>
            <div v-else class="dimmed">
              <h3>
                <span class='h1'><br><b-icon icon="box"></b-icon></span>
                <br><br>{{ $trans("Material") }}</h3>
            </div>
            <b-form-group
              label-size="sm"
              label-for="move-material-purchase-order-material-search"
              >
              <multiselect
              id="move-material-purchase-order-material-search"
              track-by="id"
                  :placeholder="$trans('Select material (type to search)')"
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
                  ref="searchMaterial"
                  >
                <span slot="noResult">{{ $trans('Oops! No elements found. Consider changing the search query.') }}</span>
              </multiselect>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.selectedMaterialPk.$error : null">
                {{ $trans('Please select a material') }}
              </b-form-invalid-feedback>
            </b-form-group>
        </div>

        <div class="panel col-1-3">
          <h6>{{$trans('Move from')}}</h6>

          <div v-if="selectedFromLocation.location_name">
            <h3>
              <span class="h1 text-danger"><br><b-icon icon="box-arrow-up-right"></b-icon></span>
              <br/><br/>{{ selectedFromLocation.location_name }}
            </h3>
          </div>
          <div v-else class="dimmed">
            <h3>
              <span class='h1'><br><b-icon icon="box-arrow-right"></b-icon></span>
              <br/><br/>{{ $trans('Departure location') }}
            </h3>
          </div>

          <b-form-group
            label-size="sm"
            label-for="move-material-from-location-search"
            >
            <multiselect
              id="move-material-from-location-search"
              track-by="id"
              open-direction="bottom"
              placeholder="Select location (type to search)"
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
            <b-form-invalid-feedback
              :state="isSubmitClicked ? !v$.selectedFromLocationPk.$error : null">
              {{ $trans('Please select from location') }}
            </b-form-invalid-feedback>
          </b-form-group>

        </div>

        <div class="panel col-1-3">
          <h6> {{ $trans('Move to')}}</h6>

          <div v-if="selectedToLocation.name">
            <h3>
              <span class="h1 text-success"><br><b-icon icon="box-arrow-in-down-right"></b-icon></span>
              <br/><br/>{{ selectedToLocation.name }}
            </h3>
          </div>

          <div v-else class="dimmed">
            <h3>
              <span class="h1"><br><b-icon icon="box-arrow-in-right"></b-icon></span>
              <br/><br/>{{ $trans('Arrival location') }}
            </h3>
          </div>

          <b-form-group
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
            <b-form-invalid-feedback
              :state="isSubmitClicked ? !v$.selectedToLocationPk.$error : null">
              {{ $trans('Please select to location') }}
            </b-form-invalid-feedback>
          </b-form-group>

        </div>
      </b-form>
    </div>
  </div>
</template>
<style scoped>
header {
  position: relative !important;
}

.col-1-3 {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

</style>
<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import Multiselect from 'vue-multiselect'

import inventoryModel from '@/models/inventory/Inventory.js'
import materialService from '@/models/inventory/Material.js'
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
      buttonDisabled: true,
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
      isBulk: false
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
    },
    canSubmit() {
      return !this.selectedFromLocationPk || !this.selectedToLocationPk;

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
      if (!this.isBulk) {
        this.getFromLocations()
      } else {
        this.$refs.amount.focus()
      }
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
      await this._submitForm(false)
    },
    async submitFormBulk() {
      await this._submitForm(true)
    },
    async _submitForm(isBulk) {
      this.submitClicked = true
      this.v$.$touch()
      if (this.v$.$invalid) {
        return
      }

      this.buttonDisabled = true
      this.isLoading = true

      try {
        await materialService.move(this.selectedMaterialPk,
          this.selectedFromLocationPk,
          this.selectedToLocationPk,
          this.amount)
        this.infoToast(this.$trans('Moved'), this.$trans('Material moved'))
        this.buttonDisabled = true
        this.isLoading = false

        if (isBulk) {
          this.amount = 0
          this.selectedMaterial = {
            material_name: ''
          }
          this.selectedMaterialPk = null
          this.isBulk = true
          this.v$.$reset()
          this.$refs.searchMaterial.$el.focus()
        } else {
          this.$router.push({name: 'mutation-list'})
        }
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
