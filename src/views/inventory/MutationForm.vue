<template>
  <div class="app-page">
    <header>
      <div class='page-title'>
        <h3><b-icon icon="arrow-left-right"></b-icon>{{ $trans("Mutations") }}</h3>
        <b-button-toolbar>
          <b-button @click="cancelForm" class="btn btn-secondary" type="button" variant="secondary">
            {{ $trans('Cancel') }}
          </b-button>
          <b-button @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
            {{ $trans('Submit') }}
          </b-button>
        </b-button-toolbar>
      </div>
    </header>
    <div class="page-detail">
      <b-overlay :show="isLoading" rounded="sm">
        <b-form class="flex-columns">
          <div class="panel col-1-3">
            <h6>{{ $trans('Add mutation') }}</h6>

            <b-form-group
              label-size="sm"
              label-cols="12"
              label-for="add-mutation-material-search"
            >
              <multiselect
                id="add-mutation-material-search"
                track-by="id"
                :placeholder="`${$trans('Select product')} ${$trans('(type to search)')}`"
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


            <b-form-group
              label-size="sm"
              label-cols="12"
              label-for="add-mutation-material-name"
            >
              <h3>{{ mutation.material_name || '&nbsp;' }}</h3>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.mutation.material.$error : null">
                {{ $trans('Please select a material') }}
              </b-form-invalid-feedback>
            </b-form-group>

            <div class="flex-columns">
              <b-form-group
                label-cols="3"
                v-bind:label="$trans('Amount')"
                label-for="add-mutation-amount"
              >
                <b-form-input
                  v-model="mutation.amount"
                  id="add-mutation-amount"
                  type="number"
                  ref="amount"
                  style="width: 6rem"
                ></b-form-input>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.mutation.amount.$error : null">
                  {{ $trans('Please enter an amount') }}
                </b-form-invalid-feedback>
              </b-form-group>

              <b-form-group
                label-cols="3"
                label-align="right"
                v-bind:label="$trans('Type')"
                label-for="add-mutation-mutation_type"
              >
                <b-form-select v-model="mutation.mutation_type" :options="mutationTypes"></b-form-select>
              </b-form-group>
            </div>

            <h6>{{ $trans(locationText)}}</h6>
            <b-form-group
              label-size="sm"
              label-cols="12"
              label-for="add-mutation-location-search"
            >
              <multiselect
                id="add-mutation-location-search"
                track-by="id"
                open-direction="bottom"
                :options="locations"
                :multiple="false"
                :searchable="false"
                :close-on-select="true"
                :options-limit="30"
                :limit="10"
                :max-height="600"
                :show-no-results="false"
                @select="selectLocation"
                :custom-label="locationLabel"
              >
                <span slot="noResult">{{ $trans('Oops! No elements found. Consider changing the search query.') }}</span>
              </multiselect>
            </b-form-group>

            <b-form-group
              label-for="add-mutation-location-name"
            >
              <b-form-input
                v-model="mutation.location_name"
                id="add-mutation-location-name"
                readonly
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.mutation.location.$error : null">
                {{ $trans('Please select a location') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </div>
        </b-form>
      </b-overlay>
    </div>
  </div>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import Multiselect from 'vue-multiselect'

import inventoryModel from '../../models/inventory/Inventory.js'
import mutationModel from "../../models/inventory/Mutation";

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

      fromLocationText: this.$trans('From location'),
      toLocationText: this.$trans('To location'),

      mutation: mutationModel.getFields(),
      mutationTypes: [{
        value: 'correction-in',
        text: this.$trans('Correction in')
      }, {
        value: 'correction-out',
        text: this.$trans('Correction out')
      }],

      materials: [],
      locations: [],

      selectedMaterial: {},
      selectedMaterialPk: null,

      selectedLocation: {},
      selectedLocationPk: null,
    }
  },
  validations: {
    mutation: {
      material: {
        required
      },
      location: {
        required
      },
      amount: {
        required,
        greaterThanZero
      },
    }
  },
  computed: {
    isSubmitClicked() {
      return this.submitClicked
    },
    locationText() {
      return this.mutation.mutation_type === 'correction-in' ? this.toLocationText : this.fromLocationText
    }
  },
  created() {
    this.getMaterials('')
  },
  methods: {
    // materials
    selectMaterial(option) {
      this.mutation.material = option.material_id
      this.mutation.material_name = option.material_name
      this.getLocations()
      this.$refs.amount.focus()
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
    // locations
    async getLocations() {
      this.isLoading = true
      try {
        this.locations = await inventoryModel.getLocationsForMaterial(this.mutation.material)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching locations', error)
        this.errorToast(this.$trans('Error fetching locations'))
        this.isLoading = false
      }
    },
    locationLabel(location) {
      return `${location.location_name} (${location.total_amount})`
    },
    selectLocation(option) {
      console.log('location', option)
      this.mutation.location = option.location_id
      this.mutation.location_name = option.location_name
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
        await mutationModel.insert(this.mutation)
        this.infoToast(this.$trans('Created'), this.$trans('Mutation created'))
        this.buttonDisabled = false
        this.isLoading = false
        await this.$router.push({name: 'mutation-list'})
      } catch(error) {
        console.log('error creating mutation', error)
        this.errorToast(this.$trans('Error creating mutation'))
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
