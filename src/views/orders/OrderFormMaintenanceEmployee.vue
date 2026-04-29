<template>
  <div class="app-page" v-if="order">
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
              <BFormGroup
                v-bind:label="$trans('Equipment name')"
                label-for="maintenance_equipment_new_equipment"
              >
                <BFormInput
                  id="maintenance_equipment_new_equipment"
                  size="sm"
                  v-model="newEquipmentName"
                ></BFormInput>
              </BFormGroup>
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
              <BFormGroup
                v-bind:label="$trans('Location name')"
                label-for="new_location"
              >
                <BFormInput
                  id="new_location"
                  size="sm"
                  v-model="newLocationName"
                ></BFormInput>
              </BFormGroup>
            </b-col>
          </b-row>
        </b-container>
      </form>
    </b-modal>

    <header>
      <div class="page-title">
        <h3 v-if="!pk">
          <IBiFileEarmarkPlus></IBiFileEarmarkPlus>
          <router-link :to="{name:'order-list'}">{{ $trans("Orders") }}</router-link> /
          <strong>{{ $trans("new") }}</strong>
        </h3>
        <h3 v-if="pk">
          <IBiFileEarmarkTextFill></IBiFileEarmarkTextFill>
          <router-link :to="{name:'order-list'}">{{ $trans("Orders") }}</router-link> /
          <router-link :to="{name: 'order-view', pk:pk}">#<strong>{{ pk }}</strong></router-link>
          / {{ $trans("edit") }}
        </h3>

        <div class="flex-columns">
          <BButton
            @click="cancelForm"
            type="button"
            variant="secondary"
          >
            {{ $trans('Cancel') }}
          </BButton>
          <BButton
            type="submit"
            @click="submitForm"
            variant="primary">
            {{ $trans('Submit') }}
          </BButton>
        </div>
      </div>
    </header>

    <div class="page-detail">
      <ApiResult
        class="app-detail"
        v-if="order.hasOwnProperty('apiOk')"
        :error="order.error"
        :success-message='$trans("Order created")'
      />
      <div class="flex-columns">
        <div class="panel col-1-3">
          <h6>{{ $trans('Contact') }}</h6>

          <BFormGroup
            :label="$trans('Branch')"
            label-for="order_name"
            label-cols="3"
          >
            <b-input-group>
              <BFormInput
                v-model="order.order_name"
                id="order_name"
                readonly="readonly"
              ></BFormInput>
            </b-input-group>
          </BFormGroup>

        </div>
        <div class="panel col-1-3">
          <h6>{{ $trans("Order details") }}</h6>
          <BFormGroup
            v-bind:label="$trans('Order type')"
            label-for="order_type"
            label-cols="3"
          >
            <OrderTypesSelect
              v-model="order.order_type"
            />
          </BFormGroup>

          <BFormGroup
            v-bind:label="$trans('Reference')"
            label-for="order_reference"
            label-cols="3">
            <BFormInput
              id="order_reference"
              v-model="order.order_reference"
            >
            </BFormInput>
          </BFormGroup>

          <BFormGroup
            v-bind:label="$trans('Customer reference')"
            label-for="customer_reference"
            label-cols="3">
            <BFormInput
              id="customer_reference"
              v-model="order.customer_reference"
            >
            </BFormInput>
          </BFormGroup>

          <BFormGroup
            v-bind:label="$trans('Remarks')"
            label-for="remarks"
            label-cols="3"
          >
            <BFormTextarea
              id="remarks"
              v-model="order.remarks"
              rows="3"
            ></BFormTextarea>
          </BFormGroup>

          <!-- order start/end times -->
          <h6>{{ $trans('Planning') }}</h6>
          <b-container>
            <b-row>
              <BFormGroup
                :label="$trans('Start date')"
                label-for="start_date"
                label-cols="3"
                :state="isSubmitClicked ? !v$.order.start_date.$error : null"
              >
                <VueDatePicker
                  id="start_date"
                  v-model="order.start_date"
                  :placeholder="$trans('Select date')"
                  :locale="nl"
                  auto-apply
                  arrow-navigation
                  :state="isSubmitClicked ? !v$.order.start_date.$error : null"
                  :formats="{ input: 'dd/MM/yyyy' }"
                ></VueDatePicker>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.order.start_date.$error : null">
                  {{ $trans('Please enter a start date') }}
                </b-form-invalid-feedback>
              </BFormGroup>

              <b-col cols="2"></b-col>

              <BFormGroup
                :label="$trans('Start time')"
                label-for="start_time"
                label-cols="3"
              >
                <BFormInput
                  id="start_time"
                  v-model="order.start_time"
                  type="text"
                  placeholder="HH:mm"
                  class="time-input"
                ></BFormInput>
                <VueDatePicker
                  v-model="start_time_date"
                  id="start_time"
                  :placeholder="$trans('Set time')"
                  time-picker
                  arrow-navigation
                  :formats="{ input: 'HH:mm' }"
                >
                  <template #trigger>
                    <p class="clock-icon">
                      <IBiClock></IBiClock>
                    </p>
                  </template>
                </VueDatePicker>
              </BFormGroup>
            </b-row>
          </b-container>

          <b-container>
            <b-row>
              <BFormGroup
                label-class=""
                v-bind:label="$trans('End date')"
                label-for="end_date"
                label-cols="3"
              >
                <VueDatePicker
                  id="end_date"
                  v-model="order.end_date"
                  :placeholder="$trans('Select date')"
                  :locale="nl"
                  auto-apply
                  arrow-navigation
                  :state="isSubmitClicked ? !v$.order.end_date.$error : null"
                  :formats="{ input: 'dd/MM/yyyy' }"
                ></VueDatePicker>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.order.end_date.$error : null">
                  {{ $trans('Please enter an end date') }}
                </b-form-invalid-feedback>
              </BFormGroup>

              <b-col cols="2"></b-col>

              <BFormGroup
                :label="$trans('End time')"
                label-class=""
                label-for="end_time"
                label-cols="3"
              >
                <BFormInput
                  id="end_time"
                  v-model="order.end_time"
                  type="text"
                  class="time-input"
                  placeholder="HH:mm"
                ></BFormInput>
                <VueDatePicker
                  v-model="end_time_date"
                  id="end_time"
                  class="mb-2"
                  :placeholder="$trans('Set time')"
                  time-picker
                  arrow-navigation
                  :formats="{ input: 'HH:mm' }"
                >
                  <template #trigger>
                    <p class="clock-icon">
                      <IBiClock></IBiClock>
                    </p>
                  </template>
                </VueDatePicker>
              </BFormGroup>
            </b-row>
          </b-container>
        </div>

        <div class="panel col-1-3">
          <div class="documents section">
            <DocumentsComponent
              :order="order"
              :is-view="false"
              ref="documents-component"
            />
          </div>

          <div class="order-lines section">
            <h6>{{$trans('Order lines')}}</h6>
            <b-container fluid="sm">
              <b-row
                v-for="(orderline, index) of order.orderlines"
                :key="orderline.id"
                no-gutters
                style="padding-bottom: 10px"
              >
                <b-col cols="9">
                  <b-container>
                    <b-row>
                      <b-col cols="12">{{ $trans("Product") }}: <b>{{ orderline.product }}</b></b-col>
                    </b-row>
                    <b-row>
                      <b-col cols="12">{{ $trans("Location") }}: <b>{{ orderline.location }}</b></b-col>
                    </b-row>
                    <b-row>
                      <b-col cols="12">{{ $trans("Remarks") }}: <b>{{ orderline.remarks }}</b></b-col>
                    </b-row>
                  </b-container>
                </b-col>
                <b-col cols="3">
                  <div class="float-right">
                    <BLink class="h5 mx-2" @click.prevent="editOrderLine(orderline, index)">
                      <IBiPencil></IBiPencil>
                    </BLink>
                    <BLink class="h5 mx-2" @click.prevent="deleteOrderLine(index)">
                      <IBiTrash></IBiTrash>
                    </BLink>
                  </div>
                </b-col>
                <b-col v-if="orderline.hasOwnProperty('apiOk')" cols="12">
                  <ApiResult
                    :error="orderline.error"
                    :success-message='$trans("Orderline created")'
                  />
                </b-col>
              </b-row>
            </b-container>

            <hr v-if="order.orderlines.length > 0"/>

            <div>
              <!-- equipment -->
              <h5 v-if="isEditOrderLine">{{ $trans("Edit") }}</h5>
              <h5 v-else>{{ $trans("New") }}</h5>
              <BFormGroup
                v-bind:label="$trans('Equipment')"
                cols="12">
                <VueMultiselect
                  id="maintenance-contract-equipment-name"
                  ref="multiselect_equipment"
                  track-by="id"
                  label="name"
                  :placeholder="$trans('(type to search)')"
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
                  :disabled="!equipmentFormSearchOk"
                >
                    <template #noResult>
                      <h5>{{ $trans('No equipment found') }}</h5>
                      <p v-if="canQuickCreateEquipment">
                        <BButton
                          @click="showAddEquipmentModal"
                          class="btn btn-primary"

                          type="button"
                          variant="primary"
                        >
                          {{ $trans("Add new equipment") }}
                        </BButton>
                      </p>
                    </template>
                </VueMultiselect>

                <span>
                    <strong>{{ product }}</strong>
                    <IBiCheck v-if="equipment"></IBiCheck>
                  </span>

              </BFormGroup>

              <!-- equipment locations -->
              <BFormGroup
                v-bind:label="$trans('Location')"
                cols="12"
              >
                <VueMultiselect
                  id="location-name"
                  ref="multiselect_location"
                  track-by="id"
                  label="name"
                  :placeholder="$trans('(type to search)')"
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
                  :disabled="!equipmentFormSearchOk || locationSearchDisabled"
                >
                    <template #noResult>
                      <h5>{{ $trans('No locations found') }}</h5>
                      <p v-if="canQuickCreateEquipmentLocation">
                        <BButton
                          @click="showAddLocationModal"
                          class="btn btn-primary"

                          type="button"
                          variant="primary"
                        >
                          {{ $trans("Add new location") }}
                        </BButton>
                      </p>
                    </template>
                </VueMultiselect>

                <span>
                    <strong>{{ location }}</strong>
                    <IBiCheck v-if="equipment_location"></IBiCheck>
                  </span>
              </BFormGroup>

              <!-- else: equipment remarks -->
              <BFormGroup
                  label-for="order-orderline-remarks"
                  v-bind:label="$trans('Remarks')"
              >
                <BFormTextarea
                  id="order-orderline-remarks"
                  v-model="remarks"
                  rows="1"
                ></BFormTextarea>
              </BFormGroup>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import moment from 'moment'
import { nl } from "date-fns/locale"

import {OrderService, OrderModel} from '@/models/orders/Order'
import {BranchService} from '@/models/company/Branch'

import OrderTypesSelect from '@/components/OrderTypesSelect.vue'
import Collapse from '@/components/Collapse.vue'
import AwesomeDebouncePromise from "awesome-debounce-promise";
import {EquipmentService} from "@/models/equipment/equipment";
import {LocationService} from "@/models/equipment/location";
import VueMultiselect from "vue-multiselect";
import {OrderlineService} from "@/models/orders/Orderline";
import DocumentsComponent from "@/views/orders/order_form/DocumentsComponent.vue";
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";
import componentMixin from "@/mixins/common";
import {useMainStore} from "@/stores/main";

export default {
  setup() {
    const {create} = useToast()
    const mainStore = useMainStore()
    return {
      v$: useVuelidate(),
      create,
      mainStore
    }
  },
  mixins: [componentMixin],
  components: {
    DocumentsComponent,
    VueMultiselect,
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
  },
  data() {
    return {
      isLoading: false,
      buttonDisabled: false,
      editIndex: null,
      isEditOrderLine: false,

      orderline_pk: null,
      product: '',
      equipment: null,
      location: '',
      equipment_location: null,
      remarks: '',

      info: '',
      orderLineFields: [
        { key: 'product', label: $trans('Product') },
        { key: 'location', label: $trans('Location') },
        { key: 'remarks', label: $trans('Remarks') },
        { key: 'icons', label: '' }
      ],
      submitClicked: false,
      countries: [],
      order: null,
      errorMessage: null,
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

      equipmentService: new EquipmentService(),
      orderService: new OrderService(),
      branchService: new BranchService(),
      locationService: new LocationService(),
      orderlineService: new OrderlineService(),
      nl,
      start_time_date: null,
      end_time_date: null,
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
    equipmentFormSearchOk() {
      return this.order.branch !== null
    },
    canQuickCreateEquipment() {
      return this.mainStore.getSettingEquipmentQuickCreate
    },
    canQuickCreateEquipmentLocation() {
      return this.mainStore.getSettingEquipmentLocationQuickCreate
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
          const response = this.isPlanning || this.isAdmin ?
            await this.equipmentService.quickAddCustomerPlanning(this.newEquipmentName, this.order.customer_relation) :
            await this.equipmentService.quickAddCustomerNonPlanning(this.newEquipmentName)

          this.equipment = response.id
          this.product = response.name
        } else {
          const response = this.isPlanning || this.isAdmin ?
            await this.equipmentService.quickAddBranchPlanning(this.newEquipmentName, this.order.branch) :
            await this.equipmentService.quickAddBranchNonPlanning(this.newEquipmentName)

          this.equipment = response.id
          this.product = response.name
        }
      }  catch(error) {
        console.log('Error adding equipment', error)
        errorToast(this.create, $trans('Error adding equipment'))
      }
    },
    async getEquipment(query) {
      try {
        this.equipmentSearch = await this.equipmentService.searchBranchEmployee(query)

      } catch(error) {
        console.log('Error searching equipment', error)
        errorToast(this.create, $trans('Error searching equipment'))
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
          const response = this.isPlanning || this.isAdmin ?
            await this.locationService.quickAddCustomerPlanning(this.newLocationName, this.order.customer_relation) :
            await this.locationService.quickAddCustomerNonPlanning(this.newLocationName)

          this.equipment_location = response.id
          this.location = response.name
        } else {
          const response = this.isPlanning || this.isAdmin ?
            await this.locationService.quickAddBranchPlanning(this.newLocationName, this.order.branch) :
            await this.locationService.quickAddBranchNonPlanning(this.newLocationName)

          this.equipment_location = response.id
          this.location = response.name
        }
      }  catch(error) {
        console.log('Error adding location', error)
        errorToast(this.create, $trans('Error adding location'))
      }
    },
    async getLocation(query) {
      try {
        this.locationSearch = await this.locationService.searchBranchEmployee(query, this.order.branch)
      } catch(error) {
        console.log('Error searching location', error)
        errorToast(this.create, $trans('Error searching location'))
      }
    },
    locationLabel({ name }) {
      return name
    },
    selectLocation(option) {
      this.equipment_location = option.id
      this.location = option.name
    },

    // order lines
    deleteOrderLine(index) {
      this.deletedOrderlines.push(this.order.orderlines[index])
      this.order.orderlines.splice(index, 1)
    },
    editOrderLine(item, index) {
      this.editIndex = index
      this.isEditOrderLine = true

      this.orderline_pk = item.id
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
      this.orderline_pk = null
      this.product = ''
      this.location = ''
      this.remarks = ''
      this.equipment_location = null
      this.equipment = null
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

          const newOrder = await this.orderService.insert(this.order)

          // add orderlines
          try {
            for (const orderline of orderlines) {
              orderline.order = newOrder.id
              await this.orderlineService.insert(orderline)
            }
          } catch(error) {
            console.log('Error creating infolines', error)
          }

          // insert documents
          this.$refs['documents-component'].orderCreated(newOrder)

          infoToast(this.create, $trans('Created'), $trans('Order has been created'))
          this.buttonDisabled = false
          this.isLoading = false
          this.$router.go(-1)
        } catch(error) {
          console.log('Error creating order', error)
          errorToast(this.create, $trans('Error creating order'))
          this.isLoading = false
          this.buttonDisabled = false
          return
        }

        return
      }

      try {
        const orderlines = this.order.orderlines
        this.order.orderlines = []
        await this.orderService.update(this.pk, this.order)

        for (let orderline of orderlines) {
          orderline.order = this.pk
          if (orderline.id) {
            await this.orderlineService.update(orderline.id, orderline)
            // infoToast(this.create, $trans('Orderline updated'), $trans('Orderline has been updated'))
          } else {
            await this.orderlineService.insert(orderline)
            // infoToast(this.create, $trans('Orderline created'), $trans('Orderline has been created'))
          }
        }

        for (const orderline of this.deletedOrderlines) {
          if (orderline.id) {
            await this.orderlineService.delete(orderline.id)
            // infoToast(this.create, $trans('Orderline removed'), $trans('Orderline has been removed'))
          }
        }

        infoToast(this.create, $trans('Updated'), $trans('Order has been updated'))
        this.isLoading = false
        this.buttonDisabled = false
        this.$router.go(-1)
      } catch(error) {
        console.log('Error updating order', error)
        errorToast(this.create, $trans('Error updating order'))
        this.isLoading = false
        this.buttonDisabled = false
      }
    },
    async loadOrder() {
      const order = await this.orderService.detail(this.pk)
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

    const lang = this.mainStore.getCurrentLanguage
    this.$moment = moment
    this.$moment.locale(lang)

    try {
      this.countries = this.mainStore.getCountries
      const branch = await this.branchService.getMyBranch()

      if (this.isCreate) {
        this.order = new OrderModel()
        this.order.branch = branch.id
        this.order.order_name = branch.name
        this.order.order_address = branch.address
        this.order.order_postal = branch.postal
        this.order.order_city = branch.city
        this.order.order_country_code = branch.country_code
        this.order.order_tel = branch.tel
        this.order.order_mobile = branch.mobile
        this.order.order_email = branch.email
        this.order.order_contact = branch.contact
      } else {
        this.order = await this.loadOrder()
        this.order.start_date = this.$moment(this.order.start_date, 'DD/MM/YYYY').toDate()
        this.order.end_date = this.$moment(this.order.end_date, 'DD/MM/YYYY').toDate()
        this.order.branch = branch.id
      }
      this.isLoading = false
    } catch (error) {
      console.log('error loading order', error)
      errorToast(this.create, $trans('Error fetching order data'))
      this.isLoading = false
    }
  },
}
</script>
<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
<style scoped>
.time-input {
  width: 100px !important;
  float:left !important;
}
.clock-icon {
  margin: .5em auto auto;
}
</style>
