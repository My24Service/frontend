<template>
  <b-overlay :show="isLoading" rounded="sm">
    <b-modal
      id="new-equipment-modal"
      ref="new-equipment-modal"
      v-bind:title="$trans('New equipment')"
      @ok="submitCreateEquipment"
      @cancel="cancelCreateEquipment"
    >
      <form ref="maintenance_equipment_new_equipment-form" @submit.stop.prevent="submitCreateEquipment">
        <b-container fluid>
          <b-row role="group">
            <b-col size="12">
              <b-form-group
                v-bind:label="$trans('Equipment name')"
                label-for="maintenance_equipment_new_equipment"
              >
                <b-form-input
                  id="maintenance_equipment_new_equipment"
                  size="sm"
                  v-model="newEquipmentName"
                ></b-form-input>
              </b-form-group>
            </b-col>
          </b-row>
        </b-container>
      </form>
    </b-modal>

    <b-modal
      id="new-location-modal"
      ref="new-location-modal"
      v-bind:title="$trans('New location')"
      @ok="submitCreateLocation"
      @cancel="cancelCreateLocation"
    >
      <form ref="new_location-form" @submit.stop.prevent="submitCreateLocation">
        <b-container fluid>
          <b-row role="group">
            <b-col size="12">
              <b-form-group
                v-bind:label="$trans('Location name')"
                label-for="new_location"
              >
                <b-form-input
                  id="new_location"
                  size="sm"
                  v-model="newLocationName"
                ></b-form-input>
              </b-form-group>
            </b-col>
          </b-row>
        </b-container>
      </form>
    </b-modal>

    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New order') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit order') }}</h2>
        <b-row>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              label-class="p-sm-0"
              v-bind:label="$trans('Start date')"
              label-for="start_date"
            >
              <b-form-datepicker
                id="start_date"
                size="sm"
                class="p-sm-0"
                v-model="order.start_date"
                v-bind:placeholder="$trans('Choose a date')"
                value="order.start_date"
                locale="nl"
                :state="isSubmitClicked ? !v$.order.start_date.$error : null"
                :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
              ></b-form-datepicker>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.order.start_date.$error : null">
                {{ $trans('Please enter a start date') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              label-class="p-sm-0"
              :label="$trans('Start time')"
              label-for="start_time"
            >
              <b-form-timepicker
                id="start_time"
                size="sm"
                v-model="order.start_time"
                :placeholder="$trans('Choose a time')"
                :hour12=false
              ></b-form-timepicker>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              label-class="p-sm-0"
              :label="$trans('End date')"
              label-for="end_date"
            >
              <b-form-datepicker
                id="end_date"
                size="sm"
                v-model="order.end_date"
                class="mb-2"
                :placeholder="$trans('Choose a date')"
                locale="nl"
                :state="isSubmitClicked ? !v$.order.end_date.$error : null"
                :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
              ></b-form-datepicker>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.order.end_date.$error : null">
                {{ $trans('Please enter an end date') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              :label="$trans('End time')"
              label-class="p-sm-0"
              label-for="end_time"
            >
              <b-form-timepicker
                id="end_time"
                size="sm"
                v-model="order.end_time"
                class="mb-2"
                :placeholder="$trans('Choose a time')"
                :hour12=false
              ></b-form-timepicker>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              label-class="p-sm-0"
              v-bind:label="$trans('Order type')"
              label-for="order_type"
            >
              <OrderTypesSelect
                v-if="(!isCreate && !isLoading) || isCreate"
                :orderTypeIn="order.order_type"
                :order-type.sync="order.order_type"
                :include-all="false"
              />
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Branch')"
              label-for="order_name"
            >
              <b-form-input
                v-model="order.order_name"
                id="order_name"
                size="sm"
                :state="isSubmitClicked ? !v$.order.order_name.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.order.order_name.$error : null">
                {{ $trans('Please enter the branch') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Address')"
              label-for="order_address"
            >
              <b-form-input
                id="order_address"
                size="sm"
                v-model="order.order_address"
                :state="isSubmitClicked ? !v$.order.order_address.$error: null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.order.order_address.$error : null">
                {{ $trans('Please enter the address') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Postal')"
              label-for="order_postal"
            >
              <b-form-input
                id="order_postal"
                size="sm"
                v-model="order.order_postal"
                :state="isSubmitClicked ? !v$.order.order_postal.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.order.order_postal.$error : null">
                {{ $trans('Please enter the postal') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('City')"
              label-for="order_city"
            >
              <b-form-input
                id="order_city"
                size="sm"
                v-model="order.order_city"
                :state="isSubmitClicked ? !v$.order.order_city.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.order.order_city.$error : null">
                {{ $trans('Please enter the city') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Country')"
              label-for="order_country_code"
            >
              <b-form-select v-model="order.order_country_code" :options="countries" size="sm"></b-form-select>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Order number')"
              label-for="service_number"
            >
              <b-form-input
                id="service_number"
                size="sm"
                v-model="order.service_number"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Reference')"
              label-for="order_reference"
            >
              <b-form-input
                id="order_reference"
                size="sm"
                v-model="order.order_reference"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Email')"
              label-for="order_email"
            >
              <b-form-input
                id="order_email"
                size="sm"
                v-model="order.order_email"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Mobile')"
              label-for="order_mobile"
            >
              <b-form-input
                id="order_mobile"
                size="sm"
                v-model="order.order_mobile"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Tel.')"
              label-for="order_tel"
            >
              <b-form-input
                id="order_tel"
                size="sm"
                v-model="order.order_tel"
              ></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="6" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Contacts')"
              label-for="order_contact"
            >
              <b-form-textarea
                id="order_contact"
                v-model="order.order_contact"
                rows="3"
              ></b-form-textarea>
            </b-form-group>
          </b-col>
          <b-col cols="6" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Remarks')"
              label-for="remarks"
            >
              <b-form-textarea
                id="remarks"
                v-model="order.remarks"
                rows="3"
              ></b-form-textarea>
            </b-form-group>
          </b-col>
        </b-row>

        <div class="order-lines section">
          <Collapse
            :title="$trans('Order lines')"
          >
            <b-row>
              <b-col cols="12">
                <b-table v-if="order.orderlines.length > 0" small :fields="orderLineFields" :items="order.orderlines" responsive="md">
                  <template #cell()="data">
                    {{ data.value }}
                  </template>
                  <template #cell(icons)="data">
                    <div class="float-right">
                      <b-link class="h5 mx-2" @click="editOrderLine(data.item, data.index)">
                        <b-icon-pencil></b-icon-pencil>
                      </b-link>
                      <b-link class="h5 mx-2" @click.prevent="deleteOrderLine(data.index)">
                        <b-icon-trash></b-icon-trash>
                      </b-link>
                    </div>
                  </template>
                </b-table>
              </b-col>
            </b-row>
            <b-row>
              <!-- equipment -->
              <b-col cols="4" role="group">
                <b-form-group
                  label-size="sm"
                  label-class="p-sm-2"
                  v-bind:label="$trans('Search equipment')"
                >
                  <multiselect
                    id="maintenance-contract-equipment-name"
                    ref="multiselect_equipment"
                    track-by="id"
                    label="name"
                    :placeholder="$trans('Type to search')"
                    open-direction="bottom"
                    :options="equipmentSearch"
                    :multiple="false"
                    :loading="isLoading"
                    :internal-search="false"
                    :clear-on-select="true"
                    :close-on-select="true"
                    :options-limit="30"
                    :limit="10"
                    :max-height="600"
                    :show-no-results="true"
                    :hide-selected="true"
                    @search-change="getEquipmentDebounced"
                    @select="selectEquipment"
                  >
                    <span slot="noResult">
                      <h5>{{ $trans('No equipment found') }}</h5>
                      <p v-if="canQuickCreateEquipment">
                        <b-button
                          @click="showAddEquipmentModal"
                          class="btn btn-primary"
                          size="sm"
                          type="button"
                          variant="primary"
                        >
                          {{ $trans("Add new equipment") }}
                        </b-button>
                      </p>
                    </span>
                  </multiselect>
                </b-form-group>
              </b-col>
              <b-col cols="2" role="group">
                <b-form-group
                  label-size="sm"
                  v-bind:label="$trans('Equipment')"
                  label-for="order-orderline-product"
                >
                  <b-input-group class="sm">
                    <b-form-input
                      id="order-orderline-product"
                      size="sm"
                      readonly
                      v-model="product"
                    ></b-form-input>
                    <b-input-group-append>
                      <b-button variant="outline-success" v-if="equipment" size="sm">
                        <b-icon-check></b-icon-check>
                      </b-button>
                    </b-input-group-append>
                  </b-input-group>
                </b-form-group>
              </b-col>
              <!-- end equipment -->

              <!-- equipment locations -->
              <b-col cols="4" role="group">
                <b-form-group
                  label-size="sm"
                  label-class="p-sm-2"
                  v-bind:label="$trans('Search location')"
                >
                  <multiselect
                    id="location-name"
                    ref="multiselect_location"
                    track-by="id"
                    label="name"
                    :placeholder="$trans('Type to search')"
                    open-direction="bottom"
                    :options="locationSearch"
                    :multiple="false"
                    :loading="isLoading"
                    :internal-search="false"
                    :clear-on-select="true"
                    :close-on-select="true"
                    :options-limit="30"
                    :limit="10"
                    :max-height="600"
                    :show-no-results="true"
                    :hide-selected="true"
                    @search-change="getLocationDebounced"
                    @select="selectLocation"
                    :disabled="locationSearchDisabled"
                  >
                    <span slot="noResult">
                      <h5>{{ $trans('No locations found') }}</h5>
                      <p v-if="canQuickCreateEquipmentLocation">
                        <b-button
                          @click="showAddLocationModal"
                          class="btn btn-primary"
                          size="sm"
                          type="button"
                          variant="primary"
                        >
                          {{ $trans("Add new location") }}
                        </b-button>
                      </p>
                    </span>
                  </multiselect>
                </b-form-group>
              </b-col>
              <b-col cols="2" role="group">
                <b-form-group
                  label-size="sm"
                  v-bind:label="$trans('Location')"
                  label-for="order-orderline-equipment-location"
                >
                  <b-input-group class="sm">
                    <b-form-input
                      id="order-orderline-equipment-location"
                      size="sm"
                      readonly
                      v-model="location"
                    ></b-form-input>
                    <b-input-group-append>
                      <b-button variant="outline-success" v-if="equipment_location" size="sm">
                        <b-icon-check></b-icon-check>
                      </b-button>
                    </b-input-group-append>
                  </b-input-group>
                </b-form-group>
              </b-col>
              <!-- end equipment locations -->
              <b-col cols="12" role="group">
                <b-form-group
                  label-size="sm"
                  v-bind:label="$trans('Remarks')"
                  label-for="order-orderline-remarks"
                >
                  <b-form-textarea
                    id="order-orderline-remarks"
                    v-model="remarks"
                    rows="1"
                  ></b-form-textarea>
                </b-form-group>
              </b-col>

            </b-row>
            <footer class="modal-footer">
              <b-button v-if="isEditOrderLine" @click="doEditOrderLine" class="btn btn-primary" size="sm" type="button" variant="warning">
                {{ $trans('Edit orderline') }}
              </b-button>
              <b-button v-if="!isEditOrderLine" @click="addOrderLine" class="btn btn-primary" size="sm" type="button" variant="primary">
                {{ $trans('Add orderline') }}
              </b-button>
            </footer>
          </Collapse>
        </div>

        <div class="order-documents section" v-if="isCreate">
          <Collapse
            :title="$trans('Documents')"
          >
            <b-row>
              <b-col cols="12" role="group">
                <b-form-group
                  label-size="sm"
                  v-bind:label="$trans('Choose files')"
                >
                  <b-form-file
                    v-model="files"
                    multiple
                    v-bind:placeholder="$trans('Choose a file or drop it here...')"
                    @input="filesSelected"
                  ></b-form-file>
                </b-form-group>
              </b-col>
            </b-row>

            <b-row>
              <b-col cols="12">
                <b-table v-if="documents.length > 0" small :fields="documentFields" :items="documents" responsive="md">
                  <template #cell(icons)="data">
                    <div class="float-right">
                      <b-link class="h5 mx-2" @click.prevent="deleteDocument(data.index)">
                        <b-icon-trash></b-icon-trash>
                      </b-link>
                    </div>
                  </template>
                </b-table>
              </b-col>
            </b-row>
          </Collapse>
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
      <div class="bottom"></div>
    </div>
  </b-overlay>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import moment from 'moment'

import orderModel from '../../models/orders/Order.js'
import branchModel from '../../models/company/Branch.js'
import documentModel from '../../models/orders/Document.js'
import accountModel from '../../models/account/Account.js'

import OrderTypesSelect from '@/components/OrderTypesSelect.vue'
import Collapse from '@/components/Collapse.vue'
import AwesomeDebouncePromise from "awesome-debounce-promise";
import equipmentModel from "../../models/equipment/equipment";
import locationModel from "../../models/equipment/location";
import Multiselect from "vue-multiselect";
import orderlineModel from "../../models/orders/Orderline";

export default {
  setup() {
    return { v$: useVuelidate() }
  },
  components: {
    Multiselect,
    OrderTypesSelect,
    Collapse
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  watch: {
    startDate(val) {
      if (new Date(this.endDate) < new Date(val)) {
        this.order.end_date = val
      }
    },
    endDate(val) {
      if (new Date(val) < new Date(this.startDate)) {
        this.order.start_date = val
      }
    }
  },
  data() {
    return {
      isLoading: false,
      buttonDisabled: false,
      editIndex: null,
      isEditOrderLine: false,

      product: '',
      equipment: null,
      location: '',
      equipment_location: null,
      remarks: '',

      info: '',
      orderLineFields: [
        { key: 'product', label: this.$trans('Product') },
        { key: 'location', label: this.$trans('Location') },
        { key: 'remarks', label: this.$trans('Remarks') },
        { key: 'icons', label: '' }
      ],
      documentFields: [
        { key: 'name', label: this.$trans('Name') },
        { key: 'icons', label: '' }
      ],
      submitClicked: false,
      countries: [],
      order: orderModel.getFields(),
      errorMessage: null,
      files: [],
      documents: [],
      orderPk: null,
      branch: null,

      getEquipmentDebounced: null,
      equipmentSearch: [],
      newEquipmentName: null,

      getLocationDebounced: null,
      locationSearch: [],
      newLocationName: null,
      locationSearchDisabled: false,

      isEditEquipment: false,

      deletedOrderlines: [],
    }
  },
  validations() {
    return {
      order: {
        order_name: {
          required,
        },
        order_address: {
          required,
        },
        order_postal: {
          required,
        },
        order_city: {
          required,
        },
        start_date: {
          required,
        },
        end_date: {
          required,
        },
      }
    }
  },
  computed: {
    canQuickCreateEquipment() {
      return this.$store.getters.getSettingEquipmentQuickCreate
    },
    canQuickCreateEquipmentLocation() {
      return this.$store.getters.getSettingEquipmentLocationQuickCreate
    },
    startDate() {
      return this.order.start_date
    },
    endDate() {
      return this.order.end_date
    },
    isCreate() {
      return !this.pk
    },
    isSubmitClicked() {
      return this.submitClicked
    }
  },
  methods: {
    // equipment
    showAddEquipmentModal() {
      this.$refs.multiselect_equipment.deactivate()
      this.newEquipmentName =this.$refs.multiselect_equipment.$refs.search.value
      this.$refs['new-equipment-modal'].show()
    },
    cancelCreateEquipment() {
      this.$refs['new-equipment-modal'].hide()
    },
    async submitCreateEquipment() {
      this.$refs.multiselect_equipment.deactivate()

      try {
        if (!this.hasBranches) {
          const response = this.isPlanning || this.isStaff || this.isSuperuser ?
            await equipmentModel.quickAddCustomerPlanning(this.newEquipmentName, this.order.customer_relation) :
            await equipmentModel.quickAddCustomerNonPlanning(this.newEquipmentName)

          this.equipment = response.id
          this.product = response.name
        } else {
          const response = this.isPlanning || this.isStaff || this.isSuperuser ?
            await equipmentModel.quickAddBranchPlanning(this.newEquipmentName, this.order.branch) :
            await equipmentModel.quickAddBranchNonPlanning(this.newEquipmentName)

          this.equipment = response.id
          this.product = response.name
        }
      }  catch(error) {
        console.log('Error adding equipment', error)
        this.errorToast(this.$trans('Error adding equipment'))
      }
    },
    async getEquipment(query) {
      try {
        this.equipmentSearch = await equipmentModel.searchBranchEmployee(query)

      } catch(error) {
        console.log('Error searching equipment', error)
        this.errorToast(this.$trans('Error searching equipment'))
      }
    },
    equipmentLabel({ name }) {
      return name
    },
    selectEquipment(option) {
      this.equipment = option.id
      this.product = option.name

      if (option.location) {
        this.equipment_location = option.location.id
        this.location = option.location.name
        this.locationSearchDisabled = true
      }
    },
    // equipment locations
    showAddLocationModal() {
      this.$refs.multiselect_location.deactivate()
      this.newLocationName =this.$refs.multiselect_location.$refs.search.value
      this.$refs['new-location-modal'].show()
    },
    cancelCreateLocation() {
      this.$refs['new-location-modal'].hide()
    },
    async submitCreateLocation() {
      this.$refs.multiselect_location.deactivate()

      try {
        if (!this.hasBranches) {
          const response = this.isPlanning || this.isStaff || this.isSuperuser ?
            await locationModel.quickAddCustomerPlanning(this.newLocationName, this.order.customer_relation) :
            await locationModel.quickAddCustomerNonPlanning(this.newLocationName)

          this.equipment_location = response.id
          this.location = response.name
        } else {
          const response = this.isPlanning || this.isStaff || this.isSuperuser ?
            await locationModel.quickAddBranchPlanning(this.newLocationName, this.order.branch) :
            await locationModel.quickAddBranchNonPlanning(this.newLocationName)

          this.equipment_location = response.id
          this.location = response.name
        }
      }  catch(error) {
        console.log('Error adding location', error)
        this.errorToast(this.$trans('Error adding location'))
      }
    },
    async getLocation(query) {
      try {
        this.locationSearch = await locationModel.searchBranchEmployee(query, this.order.branch)
      } catch(error) {
        console.log('Error searching location', error)
        this.errorToast(this.$trans('Error searching location'))
      }
    },
    locationLabel({ name }) {
      return name
    },
    selectLocation(option) {
      this.equipment_location = option.id
      this.location = option.name
    },

    // documents
    filesSelected(files) {
      for (let i=0;i<files.length; i++) {
        const reader = new FileReader()
        reader.onload = (f) => {
          const b64 = f.target.result
          this.documents.push({
            file: b64,
            name: files[i].name,
            description: ''
          })
        }

        reader.readAsDataURL(files[i])
      }
    },
    async deleteDocument(index) {
      const deleted = this.documents.splice(index, 1)
      try {
        for (const document of deleted) {
          await documentModel.delete(document.id)
        }
      } catch(error) {
        console.log('Error deleting documents', error)
      }
    },
    // order lines
    deleteOrderLine(index) {
      this.deletedOrderlines.push(this.order.orderlines[index])
      this.order.orderlines.splice(index, 1)
    },
    editOrderLine(item, index) {
      this.editIndex = index
      this.isEditOrderLine = true

      this.product = item.product
      this.location = item.location
      this.remarks = item.remarks

      if (item.equipment && item.equipment_location) {
        this.equipment_location = item.equipment_location
        this.equipment = item.equipment
        this.isEditEquipment = true
      }
    },
    emptyOrderLine() {
      this.product = ''
      this.location = ''
      this.remarks = ''
      this.equipment_location = null
      this.equipment = null
    },
    doEditOrderLine() {
      const orderLine = {
        product: this.product,
        location: this.location,
        remarks: this.remarks,
        equipment_location: this.equipment_location,
        equipment: this.equipment,
      }
      this.order.orderlines.splice(this.editIndex, 1, orderLine)
      this.editIndex = null
      this.isEditOrderLine = false
      this.isEditEquipment = false
      this.emptyOrderLine()
    },
    addOrderLine() {
      this.order.orderlines.push({
        product: this.product,
        location: this.location,
        remarks: this.remarks,
        equipment_location: this.equipment_location,
        equipment: this.equipment,
      })
      this.emptyOrderLine()
    },

    async submitForm() {
      this.submitClicked = true
      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid, this.v$.$errors)
        return
      }

      // remove null fields
      const null_fields = ['start_time', 'end_time']
      for (let i=0; i<null_fields.length; i++) {
        if (this.order[null_fields[i]] === null) {
          delete this.order[null_fields[i]]
        }
      }

      this.buttonDisabled = true
      this.isLoading = true

      if (this.isCreate) {
        this.order.customer_order_accepted = false

        try {
          const orderlines = this.order.orderlines
          this.order.orderlines = []

          const newOrder = await orderModel.insert(this.order)

          // add orderlines
          try {
            for (const orderline of orderlines) {
              orderline.order = newOrder.id
              await orderlineModel.insert(orderline)
            }
          } catch(error) {
            console.log('Error creating infolines', error)
          }

          // insert documents
          try {
            for (const document of this.documents) {
              document.order = newOrder.id
              await documentModel.insert(document)
            }
          } catch(error) {
            console.log('Error creating documents', error)
          }

          this.infoToast(this.$trans('Created'), this.$trans('Order has been created'))
          this.buttonDisabled = false
          this.isLoading = false
          this.$router.go(-1)
        } catch(error) {
          console.log('Error creating order', error)
          this.errorToast(this.$trans('Error creating order'))
          this.isLoading = false
          this.buttonDisabled = false
          return
        }

        return
      }

      try {
        const orderlines = this.order.orderlines
        this.order.orderlines = []
        await orderModel.update(this.pk, this.order)

        for (let orderline of orderlines) {
          orderline.order = this.pk
          if (orderline.id) {
            await orderlineModel.update(orderline.id, orderline)
            // this.infoToast(this.$trans('Orderline updated'), this.$trans('Orderline has been updated'))
          } else {
            await orderlineModel.insert(orderline)
            // this.infoToast(this.$trans('Orderline created'), this.$trans('Orderline has been created'))
          }
        }

        for (const orderline of this.deletedOrderlines) {
          if (orderline.id) {
            await orderlineModel.delete(orderline.id)
            // this.infoToast(this.$trans('Orderline removed'), this.$trans('Orderline has been removed'))
          }
        }

        this.infoToast(this.$trans('Updated'), this.$trans('Order has been updated'))
        this.isLoading = false
        this.buttonDisabled = false
        this.$router.go(-1)
      } catch(error) {
        console.log('Error updating order', error)
        this.errorToast(this.$trans('Error updating order'))
        this.isLoading = false
        this.buttonDisabled = false
      }
    },
    async loadOrder() {
      const order = await orderModel.detail(this.pk)
      this.order.start_date = this.$moment(this.order.start_date, 'DD/MM/YYYY').toDate()
      this.order.end_date = this.$moment(this.order.end_date, 'DD/MM/YYYY').toDate()

      return order
    },
    cancelForm() {
      this.$router.go(-1)
    }
  },
  async created () {
    this.isLoading = true

    this.getEquipmentDebounced = AwesomeDebouncePromise(this.getEquipment, 500)
    this.getLocationDebounced = AwesomeDebouncePromise(this.getLocation, 500)

    const lang = this.$store.getters.getCurrentLanguage
    this.$moment = moment
    this.$moment.locale(lang)

    try {
      this.countries = await this.$store.dispatch('getCountries')
      const branch = await branchModel.getMyBranch()

      if (this.isCreate) {
        this.order = orderModel.getFields()
        this.order.branch = branch.id
        this.order.order_name = branch.name
        this.order.order_address = branch.address
        this.order.order_postal = branch.postal
        this.order.order_city = branch.city
        this.order.order_country_code = branch.country_code
      } else {
        this.order = await this.loadOrder()
        this.order.start_date = this.$moment(this.order.start_date, 'DD/MM/YYYY').toDate()
        this.order.end_date = this.$moment(this.order.end_date, 'DD/MM/YYYY').toDate()
        this.order.branch = branch.id
      }
      this.isLoading = false
    } catch (error) {
      console.log('error loading order', error)
      this.errorToast(this.$trans('Error fetching order data'))
      this.isLoading = false
    }
  },
}
</script>
<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
<style scoped>
div.section {
  padding-bottom: 20px;
}
div.section-header {
  padding: 4px;
  background-color: lightblue;
}
div.section-header-icon {
  margin-top: -34px;
}
div.bottom {
  margin-bottom: 80px;
}
</style>
