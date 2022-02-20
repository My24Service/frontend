<template>
  <b-overlay :show="isLoading" rounded="sm">
    <b-modal
      id="delete-assignedorder-material-modal"
      ref="delete-assignedorder-material-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this material?') }}</p>
    </b-modal>

    <div class="container app-form">
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

  </b-overlay>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import Multiselect from 'vue-multiselect'
import AwesomeDebouncePromise from 'awesome-debounce-promise'

import inventoryModel from '@/models/inventory/Inventory.js'
import materialModel from '@/models/inventory/Material.js'
import assignedOrderModel from '@/models/mobile/AssignedOrder.js'
import assignedOrderMaterialModel from '@/models/mobile/AssignedOrderMaterial.js'

import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'

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
  validations: {
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
    doDelete() {
      return this.$store.dispatch('getCsrfToken').then((token) => {
        assignedOrderMaterialModel.delete(token, this.assignedOrderMaterialPk).then(() => {
          this.flashMessage.show({
            status: 'info',
            title: this.$trans('Deleted'),
            message: this.$trans('Material has been deleted')
          })
          this.geAassignedOrderMaterials()
        }).catch(() => {
          this.flashMessage.show({
            status: 'error',
            title: this.$trans('Error'),
            message: this.$trans('Error deleting material')
          })
        })
      })
    },

    selectAssignedOrder(option) {
      this.selectedAssignedOrderPk = option.id
      this.selectedAssignedOrderInfo = `${option.order_date}, ${option.user_full_name} - ${option.order_name}, ${option.order_city}`
      this.geAassignedOrderMaterials()
    },
    getAssignedOrders(query) {
      this.isLoading = true
      assignedOrderModel.setSearchQuery(query ? query : '')
      assignedOrderModel.list().then((data) => {
        this.assignedOrders = data.results
        this.isLoading = false
      }).catch((error) => {
        console.log('Error fetching assigned orders', error)
        this.flashMessage.show({
          status: 'error',
          title: this.$trans('Error'),
          message: this.$trans('Error fetching assigned orders')
        })
        this.isLoading = false
      })
    },
    assignedOrderLabel(assignedOrder) {
      return `${assignedOrder.order_date}, ${assignedOrder.user_full_name} - ${assignedOrder.order_name}, ${assignedOrder.order_city}`
    },

    getMaterials(query) {
      inventoryModel.getMaterialsForLocation(this.selectedLocationPk, query).then((materials) => {
        this.materials = materials
      }).catch((error) => {
        console.log('Error fetching materials', error)
        this.flashMessage.show({
          status: 'error',
          title: this.$trans('Error'),
          message: this.$trans('Error fetching materials')
        })
      })
    },
    selectMaterial(option) {
      this.selectedMaterialName = option.material_name
      this.selectedMaterialPk = option.material_id
    },
    materialLabel(material) {
      const text = this.$trans('in stock')
      return `${material.material_name}, ${text}: ${material.total_amount}`
    },

    getLocations() {
      this.isLoading = true
      inventoryModel.getLocations().then((locations) => {
        this.locations = locations
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
    selectLocation(option) {
      this.selectedLocationName = option.location_name
      this.selectedLocationPk = option.location_id
      this.getMaterials('')
    },
    locationLabel(location) {
      return `${location.location_name} (${location.total_amount})`
    },

    geAassignedOrderMaterials() {
      this.isLoading = true
      assignedOrderMaterialModel.setListArgs(`assigned_order=${this.selectedAssignedOrderPk}`)
      assignedOrderMaterialModel.list().then((data) => {
        this.assignedOrderMaterials = data.results
        this.isLoading = false
      }).catch(() => {
        this.flashMessage.show({
          status: 'error',
          title: this.$trans('Error'),
          message: this.$trans('Error fetching assigned order materials')
        })
        this.isLoading = false
      })
    },

    loadAssignedOrderMaterial(pk) {
      this.isLoading = true

      assignedOrderMaterialModel.detail(pk).then((assignedOrderMaterial) => {
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
      }).catch((error) => {
        console.log('error fetching material', error)
        this.flashMessage.show({
          status: 'error',
          title: this.$trans('Error'),
          message: this.$trans('Error fetching material')
        })

        this.isLoading = false
      })
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

    submitForm() {
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
        return this.$store.dispatch('getCsrfToken').then((token) => {
          assignedOrderMaterialModel.update(
            token, this.assignedOrderMaterialPk, this.assignedOrderMaterial).then((assignedOrderMaterial) => {
            this.flashMessage.show({
              status: 'info',
              title: this.$trans('Updated'),
              message: this.$trans('Material has been updated')
            })

            this.buttonDisabled = false
            this.isLoading = false
            this.v$.$reset()
            this.submitClicked = false

            this.resetForm()
          }).catch(() => {
            this.flashMessage.show({
              status: 'error',
              title: this.$trans('Error'),
              message: this.$trans('Error updating material')
            })

            this.buttonDisabled = false
            this.isLoading = false
          })
        })

      }

      return this.$store.dispatch('getCsrfToken').then((token) => {
        assignedOrderMaterialModel.insert(token, this.assignedOrderMaterial).then((assignedOrderMaterial) => {
          this.flashMessage.show({
            status: 'info',
            title: this.$trans('Created'),
            message: this.$trans('Material has been created')
          })

          this.buttonDisabled = false
          this.isLoading = false
          this.v$.$reset()
          this.submitClicked = false

          this.resetForm()
        }).catch(() => {
          this.flashMessage.show({
            status: 'error',
            title: this.$trans('Error'),
            message: this.$trans('Error creating material')
          })

          this.buttonDisabled = false
          this.isLoading = false
        })
      })
    }
  }
}
</script>
