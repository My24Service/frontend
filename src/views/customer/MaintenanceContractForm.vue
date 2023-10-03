<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
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
      <header>
        <div class='page-title'>
          <h3>
            <b-icon icon="file-earmark-lock"></b-icon><router-link :to="{name: 'maintenance-contracts'}"> Maintenance Contracts </router-link> /
            <span v-if="isCreate">{{ $trans('New maintenance contract') }}</span>
            <span v-if="!isCreate">{{ $trans('Edit maintenance contract') }}</span>
          </h3>
          <div class='flex-columns'>
            <b-button @click="cancelForm" type="button" variant="secondary outline">
              {{ $trans('Cancel') }}</b-button>
            <b-button @click="submitForm" type="button" variant="primary">
              {{ $trans('Submit') }}</b-button>
          </div>
        </div>
      </header>
      <div class="page-detail">
        <b-form class="flex-columns">
          <div class='panel col-1-3'>
            <b-form-group
              label-cols="4"
              label-size="sm"
              v-bind:label="$trans('Contract name')"
              label-for="maintenance_contract_name">
              <b-form-input
                ref="contractName"
                id="maintenance_contract_name"
                size="sm"
                v-model="maintenanceContract.name"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="!v$.maintenanceContract.name.$error">
                {{ $trans('Please enter a contract name') }}
              </b-form-invalid-feedback>
            </b-form-group>

            <b-form-group
              label-cols="4"
              label-size="sm"
              v-bind:label="$trans('Contract value')"
              label-for="maintenance_contract_contract_value">
              <b-form-input
                ref="contract_value"
                id="maintenance_contract_contract_value"
                size="sm"
                v-model="maintenanceContract.contract_value">
              </b-form-input>
            </b-form-group>

            <b-form-group
              label-cols="4"
              label-size="sm"
              v-bind:label="$trans('Remarks')"
              label-for="maintenance_contract_remarks">
              <b-form-textarea
                id="maintenance_contract_remarks"
                v-model="maintenanceContract.remarks"
                rows="1"
              ></b-form-textarea>
            </b-form-group>
            <hr>
              <b-form-group
                v-if="isCreate"
                label-cols="4"
                label-size="sm"
                label-class="p-sm-0"
                v-bind:label="$trans('Search customer')"
                label-for="maintenance_contract_customer_search"
              >
                <multiselect
                  v-if="!isLoading"
                  id="maintenance_contract_customer_search"
                  track-by="id"
                  :placeholder="$trans('Type to search')"
                  open-direction="bottom"
                  :options="customers"
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
                  @search-change="getCustomersDebounced"
                  @select="selectCustomer"
                  :custom-label="customerLabel"
                >
                  <span slot="noResult">{{ $trans('No customers found. Consider changing the search query.') }}</span>
                </multiselect>
                <b-form-invalid-feedback
                  :state="!v$.maintenanceContract.customer.$error">
                  {{ $trans('Please select a customer') }}
                </b-form-invalid-feedback>
              </b-form-group>
            <b-form-group
              label-cols="4"
              label-size="sm"
              v-bind:label="$trans('Customer')"
              label-for="maintenance_contract_customer_name"
            >
              <b-form-input
                id="maintenance_contract_customer_name"
                size="sm"
                v-model="customer.name"
                readonly
              ></b-form-input>
            </b-form-group>

            <b-form-group
              label-cols="4"
              label-size="sm"
              v-bind:label="$trans('Address')"
              label-for="maintenance_contract_customer_address"
            >
              <b-form-input
                id="maintenance_contract_customer_address"
                size="sm"
                v-model="customer.address"
                readonly
              ></b-form-input>
            </b-form-group>
          
            <b-form-group
              label-cols="4"
              label-size="sm"
              v-bind:label="$trans('City')"
              label-for="maintenance_contract_customer_city"
            >
              <b-form-input
                id="maintenance_contract_customer_city"
                size="sm"
                v-model="customer.city"
                readonly
              ></b-form-input>
            </b-form-group>
          
            <b-form-group
              label-cols="4"
              label-size="sm"
              v-bind:label="$trans('Country')"
              label-for="maintenance_contract_customer_country_code"
            >
              <b-form-input
                id="maintenance_contract_customer_country_code"
                size="sm"
                v-model="customer.country_code"
                readonly
              ></b-form-input>
            </b-form-group>

            <b-form-group
              label-cols="4"
              label-size="sm"
              v-bind:label="$trans('Tel.')"
              label-for="maintenance_contract_customer_tel"
            >
              <b-form-input
                id="maintenance_contract_customer_tel"
                size="sm"
                v-model="customer.tel"
                readonly
              ></b-form-input>
            </b-form-group>
          
        <b-row v-if="maintenanceContractService.editItem">
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Contract name')"
              label-for="maintenance_contract_name"
            >
              <b-form-input
                ref="contractName"
                id="maintenance_contract_name"
                size="sm"
                v-model="maintenanceContractService.editItem.name"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="!v$.maintenanceContractService.editItem.name.$error">
                {{ $trans('Please enter a contract name') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Contract value')"
              label-for="maintenance_contract_value"
            >
              <b-form-input
                v-if="total_dinero"
                id="maintenance_contract_value"
                size="sm"
                readonly
                :value="total_dinero.toFormat('$0.00')"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Remarks')"
              label-for="maintenance_contract_remarks"
            >
                <b-form-textarea
                  id="maintenance_contract_remarks"
                  v-model="maintenanceContractService.editItem.remarks"
                  rows="1"
                ></b-form-textarea>
            </b-form-group>
          </b-col>
        </b-row>

        <div class="maintenance-contract-equipment" v-if="customer.id !== null && customer.id !== ''">
          <h4>{{ $trans('Equipment') }}</h4>
          <b-row>
            <b-col cols="12">
              <b-table
                v-if="maintenanceEquipmentService.collection.length > 0"
                small
                :fields="equipmentFields"
                :items="maintenanceEquipmentService.collection" responsive="md"
              >
                <template #cell(tariff)="data">
                  {{ data.item.tariff_dinero.toFormat('$0.00')}}
                </template>
                <template #cell(tariff_total)="data">
                  {{ data.item.tariff_total_dinero.toFormat('$0.00')}}
                </template>
                <template #cell(icons)="data">
                  <div class="float-right">
                    <b-link class="h5 mx-2" @click="editEquipment(data.item, data.index)">
                      <b-icon-pencil></b-icon-pencil>
                    </b-link>
                    <b-link class="h5 mx-2" @click.prevent="deleteEquipment(data.index)">
                      <b-icon-trash></b-icon-trash>
                    </b-link>
                  </div>
                </template>
              </b-table>
            </b-col>
          </b-row>

              <h6>{{ $trans('Add Equipment')}}</h6>
              <b-row>
                <b-col cols="12" role="group">
                  <b-form-group
                    label-size="sm"
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
                        <h3>{{ $trans('No equipment found. Consider changing the search query, or add a new equipment:')}}</h3>
                        <p>
                          <b-button
                            @click="showAddEquipmentModal"
                            class="btn btn-primary"
                            size="sm"
                            type="button"
                            variant="primary"
                          >
                            {{ $trans("Add equipment") }}
                          </b-button>
                        </p>

                      </span>
                    </multiselect>
                  </b-form-group>
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="3" role="group">
                  <b-form-group
                    label-size="sm"
                    v-bind:label="$trans('Name')"
                    label-for="maintenance-contract-equipment-name"
                  >
                    <b-form-input
                      readonly
                      id="maintenance-contract-equipment-name"
                      size="sm"
                      v-model="maintenanceEquipmentService.editItem.equipment_name"
                    ></b-form-input>
                    <b-form-invalid-feedback
                      :state="!v$.maintenanceEquipment.equipment_name.$error">
                      {{ $trans('Please select an equipment') }}
                    </b-form-invalid-feedback>
                  </b-form-group>
                </b-col>
                <b-col cols="1" role="group">
                  <b-form-group
                    label-size="sm"
                    v-bind:label="$trans('Amount')"
                    label-for="maintenance-contract-equipment-amount"
                  >
                    <b-form-input
                      ref="amount"
                      id="maintenance-contract-equipment-amount"
                      size="sm"
                      v-model="maintenanceEquipmentService.editItem.amount"
                    ></b-form-input>
                    <b-form-invalid-feedback
                      :state="!v$.maintenanceEquipment.amount.$error">
                      {{ $trans('Please enter an amount') }}
                    </b-form-invalid-feedback>
                  </b-form-group>
                </b-col>
                <b-col cols="2" role="group">
                  <b-form-group
                    label-size="sm"
                    v-bind:label="$trans('Times / year')"
                    label-for="maintenance-contract-equipment-times_per_year"
                  >
                    <b-form-input
                      id="maintenance-contract-equipment-times_per_year"
                      size="sm"
                      v-model="maintenanceEquipmentService.editItem.times_per_year"
                    ></b-form-input>
                    <b-form-invalid-feedback
                      :state="!v$.maintenanceEquipment.times_per_year.$error">
                      {{ $trans('Please enter an amount') }}
                    </b-form-invalid-feedback>
                  </b-form-group>
                </b-col>
                <b-col cols="2" role="group">
                  <b-form-group
                    label-size="sm"
                    v-bind:label="$trans('Tariff')"
                    label-for="maintenance-contract-equipment-tariff"
                  >
                    <PriceInput
                      v-model="maintenanceEquipmentService.editItem.tariff"
                      :currency="maintenanceEquipmentService.editItem.tariff_currency"
                      @priceChanged="(val) => tariffChanged(val)"
                    />
                  </b-form-group>
                </b-col>
                <b-col cols="4" role="group">
                  <b-form-group
                    label-size="sm"
                    v-bind:label="$trans('Remarks')"
                    label-for="maintenance-contract-equipment-remarks"
                  >
                    <b-form-textarea
                      id="maintenance-contract-equipment-remarks"
                      v-model="maintenanceEquipmentService.editItem.remarks"
                      rows="1"
                    ></b-form-textarea>
                  </b-form-group>
                </b-col>
              </b-row>
              <footer class="modal-footer">
                <b-button
                  @click="cancelEditEquipment"
                  class="btn btn-primary"
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  {{ $trans('Cancel') }}
                </b-button>
                &nbsp;
                <b-button
                  v-if="maintenanceEquipmentService.isEdit"
                  @click="doEditEquipment"
                  class="btn btn-primary"
                  size="sm"
                  type="button"
                  variant="warning">
                  {{ $trans('Edit equipment') }}
                </b-button>
                <b-button
                  v-if="!maintenanceEquipmentService.isEdit"
                  @click="addEquipment"
                  class="btn btn-primary"
                  size="sm"
                  type="button"
                  variant="primary"
                  :disabled="!isEquipmentValid"
                >
                  {{ $trans('Add equipment') }}
                </b-button>
              </footer>
            </div>
            <div v-else>
              <h3>{{ $trans('Select a customer') }}</h3>
            </div>
          </div>
        </b-form>
      </div>
    </div>
  </b-overlay>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import Multiselect from 'vue-multiselect'
import AwesomeDebouncePromise from 'awesome-debounce-promise'

import customerModel from '../../models/customer/Customer.js'
import maintenanceContractService from '../../models/customer/MaintenanceContract.js'
import maintenanceEquipmentService from "../../models/customer/MaintenanceEquipment";
import equipmentModel from "../../models/equipment/equipment";
import {componentMixin} from "../../utils";
import PriceInput from "../../components/PriceInput";

const greaterThanZero = (value) => parseInt(value) > 0

export default {
  mixins: [componentMixin],
  setup() {
    return { v$: useVuelidate() }
  },
  components: {
    Multiselect,
    PriceInput,
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  validations: {
    maintenanceContractService: {
      editItem: {
        customer: {
          required
        },
        name: {
          required
        },
      }
    },
    maintenanceEquipment: {
      equipment: {
        required
      },

      equipment_name: {
        required
      },
      amount: {
        required,
        greaterThanZero
      },

      times_per_year: {
        required,
        greaterThanZero
      }
    }
  },
  data () {
    return {
      isLoading: false,
      submitClicked: false,
      maintenanceContractService,
      maintenanceEquipmentService,
      errorMessage: null,
      customer: customerModel.getFields(),
      customers: [],
      getCustomersDebounced: null,
      getEquipmentDebounced: null,
      newEquipmentName: null,

      equipmentFields: [
        { key: 'equipment_name', label: this.$trans('Name') },
        { key: 'amount', label: this.$trans('Amount') },
        { key: 'times_per_year', label: this.$trans('Times / year') },
        { key: 'tariff', label: this.$trans('Tariff') },
        { key: 'tariff_total', label: this.$trans('Tariff total') },
        { key: 'remarks', label: this.$trans('Remarks') },
        { key: 'icons', label: '' }
      ],
      equipmentSearch: [],
      total_dinero: null
    }
  },
  computed: {
    isCreate() {
      return !this.pk
    },
    isSubmitClicked() {
      return this.submitClicked
    },
    isEquipmentValid() {
      return this.maintenanceEquipmentService.editItem.equipment !== null &&
        greaterThanZero(this.maintenanceEquipmentService.editItem.amount)
    }
  },
  async created() {
    this.isLoading = true
    this.getEquipmentDebounced = AwesomeDebouncePromise(this.getEquipment, 500)
    this.maintenanceEquipmentService.modelDefaults = {
      tariff: '0.00',
      tariff_currency: this.$store.getters.getDefaultCurrency,
      amount: 0
    }
    this.maintenanceEquipmentService.newEditItem()
    if (this.isCreate) {

      this.getCustomersDebounced = AwesomeDebouncePromise(this.getCustomers, 500)
      this.customer = new customerModel.model({})
    } else {
      await this.loadData()
    }
    this.updateTotals()
    this.isLoading = false
  },
  methods: {
    tariffChanged(priceDinero) {
      this.maintenanceEquipmentService.editItem.setPriceField('tariff', priceDinero)
      this.updateTotals()
    },
    updateTotals() {
      this.total_dinero = this.maintenanceEquipmentService.getItemsTotal()
    },

    // customer
    clearCustomer() {
      this.maintenanceContract.customer = null
    },
    async getCustomers(query) {
      try {
        this.customers = await customerModel.search(query)
      } catch(error) {
        console.log('Error fetching customers', error)
        this.errorToast(this.$trans('Error fetching customers'))
      }
    },
    customerLabel({ name, city}) {
      return `${name} - ${city}`
    },
    selectCustomer(option) {
      this.customer.id = option.id
      this.maintenanceContractService.editItem.customer = option.id
      this.customer.name = option.name
      this.customer.address = option.address
      this.customer.city = option.city
      this.customer.country_code = option.country_code
      this.customer.tel = option.tel
      this.$refs.contractName.focus()
    },

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
      // assuming we don't manage maintenance contracts from branches
      if (this.hasBranches) {
        this.errorToast(this.$trans('Not creating equipment from branch environment'))
        return
      }

      this.$refs.multiselect_equipment.deactivate()

      try {
        const response = this.isPlanning || this.isStaff || this.isSuperuser ?
          await equipmentModel.quickAddCustomerPlanning(this.newEquipmentName, this.customer.id) :
          await equipmentModel.quickAddCustomerNonPlanning(this.newEquipmentName)

        this.maintenanceEquipment.equipment = response.id
        this.maintenanceEquipment.equipment_name = response.name
        this.v$.maintenanceEquipment.$reset()
        this.$refs.amount.focus()
      }  catch(error) {
        console.log('Error adding equipment', error)
        this.errorToast(this.$trans('Error adding equipment'))
      }
    },
    async getEquipment(query) {
      try {
        this.equipmentSearch = await equipmentModel.searchCustomer(query, this.customer.id)
      } catch(error) {
        console.log('Error searching equipment', error)
        this.errorToast(this.$trans('Error searching equipment'))
      }
    },
    equipmentLabel({ name, city}) {
      return `${name} - ${city}`
    },
    selectEquipment(option) {
      this.maintenanceEquipmentService.editItem.equipment = option.id
      this.maintenanceEquipmentService.editItem.equipment_name = option.name
      this.v$.maintenanceEquipment.$reset()
      this.$refs.amount.focus()
    },
    deleteEquipment(index) {
      this.maintenanceEquipmentService.deleteCollectionItem(index)
    },
    editEquipment(item, index) {
      this.maintenanceEquipmentService.editCollectionItem(item, index)
    },
    emptyEquipment() {
      this.maintenanceEquipmentService.emptyCollectionItem()
    },
    cancelEditEquipment() {
      this.maintenanceEquipmentService.cancelEdit()
    },
    doEditEquipment() {
      this.maintenanceEquipmentService.doEditCollectionItem()
    },
    addEquipment() {
      if (!this.isEquipmentValid) {
        console.log('invalid', this.v$.$errors)
        return
      }

      this.maintenanceEquipmentService.editItem.setTariffTotal()
      this.maintenanceEquipmentService.addCollectionItem()
      this.updateTotals()
      this.v$.$reset()
    },

    async submitForm() {
      this.submitClicked = true
      this.v$.maintenanceContractService.editItem.$touch()
      if (this.v$.maintenanceContractService.editItem.$invalid) {
        console.log('invalid?', this.v$.$invalid, this.v$.$errors)
        return
      }

      this.isLoading = true

      if (this.isCreate) {
        try {
          const contract = await this.maintenanceContractService.insert(this.maintenanceContract)
          this.maintenanceEquipmentService.collection = this.maintenanceEquipmentService.collection.map(
            (m) => new this.maintenanceEquipmentService.model(
              {...m, contract: contract.id}
            )
          )
          await this.maintenanceEquipmentService.updateCollection()

          this.infoToast(this.$trans('Created'), this.$trans('Maintenance contract has been created'))
          this.isLoading = false
          this.goBack()
        } catch(error) {
          console.log('Error creating maintenance_contract', error)
          this.errorToast(this.$trans('Error creating maintenance contract'))
          this.isLoading = false
        }

        return
      }

      try {
        await this.maintenanceContractService.update(this.pk, this.maintenanceContractService.editItem)

        this.maintenanceEquipmentService.collection = this.maintenanceEquipmentService.collection.map(
          (m) => new this.maintenanceEquipmentService.model(
            {...m, contract: this.pk}
          )
        )
        await this.maintenanceEquipmentService.updateCollection()

        this.infoToast(this.$trans('Updated'), this.$trans('Maintenance contract has been updated'))
        this.isLoading = false
        this.goBack()
      } catch(error) {
        console.log('Error updating maintenance_contract', error)
        this.errorToast(this.$trans('Error updating maintenance_contract'))
        this.isLoading = false
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        const data = await this.maintenanceContractService.detail(this.pk)
        this.maintenanceContractService.editItem = new this.maintenanceContractService.model(
          {...data, sum_tariffs_currency: this.$store.getters.getDefaultCurrency}
        )
        this.customer = await customerModel.detail(this.maintenanceContractService.editItem.customer)

        this.maintenanceEquipmentService.setListArgs(`contract=${this.pk}`)
        const equipmentData = await this.maintenanceEquipmentService.list()
        this.maintenanceEquipmentService.collection = equipmentData.results.map(
          (m) => new this.maintenanceEquipmentService.model({
            ...m, default_currency: this.$store.getters.getDefaultCurrency
          })
        )
        this.updateTotals()
        this.isLoading = false
      } catch(error) {
        console.log('error fetching maintenance contract', error)
        this.errorToast(this.$trans('Error loading maintenance contract'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    },
    goBack() {
      this.$router.go(-1)
    }
  }
}
</script>
<style scoped>
div.new-equipment {
  background-color: #f6cdd1;
  padding: 20px;
}
</style>
