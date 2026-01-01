<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
      <header>
        <h3>{{ $trans("Materials") }}</h3>
      </header>
      <b-modal
        id="delete-assignedorder-material-modal"
        ref="delete-assignedorder-material-modal"
        v-bind:title="$trans('Delete?')"
        @ok="doDelete"
      >
        <p class="my-4">{{ $trans('Are you sure you want to delete this material?') }}</p>
      </b-modal>


      <div class="panel">
        <b-form>
          <h2 v-if="!editMode">{{ $trans('Register material') }}</h2>
          <h2 v-if="editMode">{{ $trans('Edit material') }}</h2>
          <b-row v-if="!editMode">
            <b-col cols="6" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Search assigned orders')"
                label-for="assignedorder-search"
              >
                <multiselect
                  id="assignedorder-search"
                  track-by="id"
                  :placeholder="$trans('Type to search')"
                  open-direction="bottom"
                  :options="assignedOrders"
                  :multiple="false"
                  :internal-search="false"
                  :clear-on-select="false"
                  :close-on-select="true"
                  :options-limit="30"
                  :limit="10"
                  :max-height="600"
                  :show-no-results="false"
                  :hide-selected="true"
                  @search-change="getAssignedOrdersDebounced"
                  @select="selectAssignedOrder"
                  :custom-label="assignedOrderLabel"
                >
                  <span slot="noResult">{{ $trans('Oops! No elements found. Consider changing the search query.') }}</span>
                </multiselect>
              </b-form-group>
            </b-col>
            <b-col cols="6" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Assigned order')"
                label-for="assignedorder-material-order-info"
              >
                <b-form-input
                  v-model="selectedAssignedOrderInfo"
                  id="assignedorder-material-order-info"
                  size="sm"
                  readonly
                ></b-form-input>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.selectedAssignedOrderPk.$error : null">
                  {{ $trans('Please select an order') }}
                </b-form-invalid-feedback>
              </b-form-group>
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="6" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Search location')"
                label-for="assignedorder-material-location-search"
              >
                <multiselect
                  id="assignedorder-material-location-search"
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
            </b-col>
            <b-col cols="6" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Location')"
                label-for="assignedorder-material-location-name"
              >
                <b-form-input
                  v-model="selectedLocationName"
                  id="assignedorder-material-location-name"
                  size="sm"
                  readonly
                ></b-form-input>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.selectedLocationPk.$error : null">
                  {{ $trans('Please select a location') }}
                </b-form-invalid-feedback>
              </b-form-group>
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="6" role="group">
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
                  v-model="selectedMaterialName"
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
            <b-col cols="2" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Amount')"
                label-for="assignedorder-material-amount"
              >
                <b-form-input
                  v-model="amount"
                  id="assignedorder-material-amount"
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
              <b-button @click="cancelEdit" v-if="editMode" class="btn btn-primary" type="button" variant="primary">
                {{ $trans('Cancel') }}
              </b-button>
              <b-button @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
                {{ editMode ? $trans('Update') : $trans('Submit') }}
              </b-button>
            </footer>
          </div>
        </b-form>

        <b-table
          id="assignedorder-material-table"
          small
          :busy='isLoading'
          :fields="fields"
          :items="assignedOrderMaterials"
          responsive="md"
          class="data-table"
        >
          <template #table-busy>
            <div class="text-center text-danger my-2">
              <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
              <strong>{{ $trans('Loading...') }}</strong>
            </div>
          </template>
          <template #cell(icons)="data">
            <div class="h2 float-right">
              <IconLinkEdit
                v-bind:method="function() { loadAssignedOrderMaterial(data.item.id) }"
                v-bind:title="$trans('Edit')"
              />
              <IconLinkDelete
                v-bind:title="$trans('Delete')"
                v-bind:method="function() { showDeleteModal(data.item.id) }"
              />
            </div>
          </template>
        </b-table>
      </div>
    </div>
  </b-overlay>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import Multiselect from 'vue-multiselect'
import AwesomeDebouncePromise from 'awesome-debounce-promise'

import inventoryModel from '@/models/inventory/Inventory.js'
import assignedOrderModel from '@/models/mobile/AssignedOrder.js'
import assignedOrderMaterialModel from '@/models/mobile/AssignedOrderMaterial.js'

import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast} from "@/utils";
const {create} = useToast()

const greaterThanZero = (value) => parseInt(value) > 0

export default {
  setup() {
    return { v$: useVuelidate() }
  },
  components: {
    Multiselect,
    IconLinkEdit,
    IconLinkDelete,
  },
  data() {
    return {
      isLoading: false,
      buttonDisabled: false,
      submitClicked: false,
      errorMessage: null,
      editMode: false,
      getMaterialsDebounced: null,

      assignedOrderMaterial: assignedOrderMaterialModel.getFields(),
      assignedOrderMaterialPk: null,
      assignedOrderMaterials: [],
      fields: [
        {key: 'material_name', label: this.$trans('Name'), sortable: true, thAttr: {width: '50%'}},
        {key: 'location_name', label: this.$trans('Location'), sortable: true, thAttr: {width: '30%'}},
        {key: 'amount', label: this.$trans('Amount'), sortable: true, thAttr: {width: '10%'}},
        {key: 'icons', thAttr: {width: '10%'}}
      ],

      assignedOrders: [],
      locations: [],
      materials: [],

      selectedAssignedOrderInfo: null,
      selectedAssignedOrderPk: null,

      selectedLocationName: null,
      selectedLocationPk: null,

      selectedMaterialName: null,
      selectedMaterialPk: null,

      amount: null,
    }
  },
  validations() {
    return {
      selectedAssignedOrderPk: {
        required,
      },
      selectedLocationPk: {
        required,
      },
      selectedMaterialPk: {
        required,
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
    }
  },
  created() {
    this.getLocations()
    this.getAssignedOrders('')
    this.getAssignedOrdersDebounced = AwesomeDebouncePromise(this.getAssignedOrders, 500)
  },
  methods: {
    showDeleteModal(id) {
      this.assignedOrderMaterialPk = id
      this.$refs['delete-assignedorder-material-modal'].show()
    },
    async doDelete() {
      try {
        await assignedOrderMaterialModel.delete(this.assignedOrderMaterialPk)
        infoToast(create, this.$trans('Deleted'), this.$trans('Material has been deleted'))
        this.geAassignedOrderMaterials()
      } catch(error) {
        console.log('Error deleting material', error)
        errorToast(create, this.$trans('Error deleting material'))
      }
    },
    selectAssignedOrder(option) {
      this.selectedAssignedOrderPk = option.id
      this.selectedAssignedOrderInfo = `${option.order_date}, ${option.user_full_name} - ${option.order_name}, ${option.order_city}`
      this.geAassignedOrderMaterials()
    },
    async getAssignedOrders(query) {
      this.isLoading = true

      try {
        assignedOrderModel.setSearchQuery(query ? query : '')
        const data = await assignedOrderModel.list()
        this.assignedOrders = data.results
        this.isLoading = false
      } catch(error) {
        console.log('Error fetching assigned orders', error)
        errorToast(create, this.$trans('Error fetching assigned orders'))
        this.isLoading = false
      }
    },
    assignedOrderLabel(assignedOrder) {
      return `${assignedOrder.order_date}, ${assignedOrder.user_full_name} - ${assignedOrder.order_name}, ${assignedOrder.order_city}`
    },
    async getMaterials(query) {
      try {
        this.materials = await inventoryModel.getMaterialsForLocation(this.selectedLocationPk, query)
      } catch(error) {
        console.log('Error fetching materials', error)
        errorToast(create, this.$trans('Error fetching materials'))
      }
    },
    selectMaterial(option) {
      this.selectedMaterialName = option.material_name
      this.selectedMaterialPk = option.material_id
    },
    materialLabel(material) {
      const text = this.$trans('in stock')
      return `${material.material_name}, ${text}: ${material.total_amount}`
    },
    async getLocations() {
      this.isLoading = true

      try {
        this.locations = await inventoryModel.getLocations()
        this.isLoading = false
      } catch(error) {
        console.log('Error fetching locations', error)
        errorToast(create, this.$trans('Error fetching locations'))
        this.isLoading = false
      }
    },
    selectLocation(option) {
      this.selectedLocationName = option.location_name
      this.selectedLocationPk = option.location_id
      this.getMaterials('')
    },
    locationLabel(location) {
      return `${location.location_name} (${location.total_amount})`
    },
    async geAassignedOrderMaterials() {
      this.isLoading = true

      try {
        assignedOrderMaterialModel.setListArgs(`assigned_order=${this.selectedAssignedOrderPk}`)
        const data = await assignedOrderMaterialModel.list()
        this.assignedOrderMaterials = data.results
        this.isLoading = false
      } catch(error) {
        console.log('Error fetching assigned order materials', error)
        errorToast(create, this.$trans('Error fetching assigned order materials'))
        this.isLoading = false
      }
    },
    async loadAssignedOrderMaterial(pk) {
      this.isLoading = true

      try {
        const assignedOrderMaterial = await assignedOrderMaterialModel.detail(pk)
        this.assignedOrderMaterialPk = assignedOrderMaterial.id
        this.assignedOrderMaterial = assignedOrderMaterial
        this.selectedLocationPk = assignedOrderMaterial.location
        this.selectedLocationName = assignedOrderMaterial.location_name
        this.selectedAssignedOrderPk = assignedOrderMaterial.assigned_order
        this.selectedMaterialPk = assignedOrderMaterial.material
        this.selectedMaterialName = assignedOrderMaterial.material_name
        this.amount = assignedOrderMaterial.amount

        this.isLoading = false
        this.editMode = true
      } catch(error) {
        console.log('error fetching material', error)
        errorToast(create, this.$trans('Error fetching material'))
        this.isLoading = false
      }
    },
    cancelEdit() {
      this.resetForm()
    },
    resetForm() {
      this.assignedOrderMaterial = assignedOrderMaterialModel.getFields()
      this.selectedMaterialPk = null
      this.selectedMaterialName = null
      this.amount = 0
      this.editMode = false
    },
    async submitForm() {
      this.submitClicked = true
      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

      this.assignedOrderMaterial.assigned_order = this.selectedAssignedOrderPk
      this.assignedOrderMaterial.material = this.selectedMaterialPk
      this.assignedOrderMaterial.material_name = this.selectedMaterialName
      this.assignedOrderMaterial.location = this.selectedLocationPk
      this.assignedOrderMaterial.amount = this.amount

      this.buttonDisabled = true
      this.isLoading = true

      if (this.editMode) {
        try {
          await assignedOrderMaterialModel.update(this.assignedOrderMaterialPk, this.assignedOrderMaterial)
          errorToast(create, this.$trans('Material has been updated'))
          this.buttonDisabled = false
          this.isLoading = false
          this.v$.$reset()
          this.submitClicked = false
          this.resetForm()
        } catch(error) {
          console.log('Error updating material', error)
          errorToast(create, this.$trans('Error updating material'))
          this.buttonDisabled = false
          this.isLoading = false
        }

        return
      }

      try {
        await assignedOrderMaterialModel.insert(this.assignedOrderMaterial)
        infoToast(create, this.$trans('Created'), this.$trans('Material has been created'))
        this.buttonDisabled = false
        this.isLoading = false
        this.v$.$reset()
        this.submitClicked = false

        this.resetForm()
      } catch(error) {
        console.log('Error creating material', error)
        errorToast(create, this.$trans('Error creating material'))
        this.buttonDisabled = false
        this.isLoading = false
      }
    }
  }
}
</script>
