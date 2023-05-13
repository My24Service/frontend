<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New maintenance equipment') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit maintenance equipment') }}</h2>
        <b-row>
          <b-col cols="12" role="group">
            <b-form-group
              label-size="sm"
              label-class="p-sm-0"
              v-bind:label="$trans('Search customer')"
              label-for="maintenance_contract_customer_search"
            >
              <multiselect
                v-if="!isLoading"
                id="maintenance_equipment_equipment_search"
                track-by="id"
                :placeholder="$trans('Type to search')"
                open-direction="bottom"
                :options="equipment"
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
                @search-change="getCustomersDebounced"
                @select="selectCustomer"
                :custom-label="customerLabel"
              >
                <span slot="noResult">{{ $trans('Oops! No elements found. Consider changing the search query.') }}</span>
              </multiselect>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="12" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Customer')"
              label-for="maintenance_equipment_customer_name"
            >
              <b-form-input
                id="maintenance_equipment_customer_name"
                size="sm"
                v-model="customer.name"
                readonly
              ></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="6" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Address')"
              label-for="maintenance_equipment_customer_address"
            >
              <b-form-input
                id="maintenance_equipment_customer_address"
                size="sm"
                v-model="customer.address"
                readonly
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('City')"
              label-for="maintenance_equipment_customer_city"
            >
              <b-form-input
                id="maintenance_equipment_customer_city"
                size="sm"
                v-model="customer.city"
                readonly
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="1" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Country')"
              label-for="maintenance_equipment_customer_country_code"
            >
              <b-form-input
                id="maintenance_equipment_customer_country_code"
                size="sm"
                v-model="customer.country_code"
                readonly
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Tel.')"
              label-for="maintenance_equipment_customer_tel"
            >
              <b-form-input
                id="maintenance_equipment_customer_tel"
                size="sm"
                v-model="customer.tel"
                readonly
              ></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="6" role="group">
            <b-form-group
              label-size="sm"
              label-class="p-sm-0"
              v-bind:label="$trans('Search equipment')"
              label-for="maintenance_equipment_equipment_search"
            >
              <multiselect
                v-if="!isLoading"
                id="maintenance_equipment_equipment_search"
                track-by="id"
                :placeholder="$trans('Type to search')"
                open-direction="bottom"
                :options="equipment"
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
                :custom-label="equipmentLabel"
              >
                <span slot="noResult">
                  <b-form-group
                    label-size="sm"
                    v-bind:label="$trans('New equipment')"
                    label-for="maintenance_equipment_new_equipment"
                  >
                    <b-form-input
                      id="maintenance_equipment_new_equipment"
                      size="sm"
                      v-model="newEquipmentName"
                    ></b-form-input>
                  </b-form-group>

                  <div class="mx-auto">
                    <footer class="modal-footer">
                      <b-button @click="cancelCreateEquipment" type="button" variant="secondary">
                        {{ $trans('Cancel') }}</b-button>
                      <b-button @click="submitCreateEquipment" type="button" variant="primary">
                        {{ $trans('Submit') }}</b-button>
                    </footer>
                  </div>

                </span>
              </multiselect>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Brand')"
              label-for="maintenance_equipment_brand"
            >
              <b-form-input
                id="maintenance_equipment_brand"
                size="sm"
                v-model="maintenanceEquipment.brand"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Amount')"
              label-for="maintenance_equipment_amount"
            >
              <b-form-input
                id="maintenance_equipment_amount"
                size="sm"
                v-model="maintenanceEquipment.amount"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.maintenanceEquipment.amount.$error : null">
                {{ $trans('Please enter an amount') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Times / year')"
              label-for="maintenance_equipment_times_per_year"
            >
              <b-form-input
                id="maintenance_equipment_times_per_year"
                size="sm"
                v-model="maintenanceEquipment.times_per_year"
              ></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Installation date')"
              label-for="maintenance_equipment_installation_date"
            >
              <b-form-datepicker
                id="maintenance_equipment_installation_date"
                size="sm"
                class="p-sm-0"
                v-model="maintenanceEquipment.installation_date"
                v-bind:placeholder="$trans('Choose a date')"
                value="maintenanceEquipment.installation_date"
                locale="nl"
                :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
              ></b-form-datepicker>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Production date')"
              label-for="maintenance_equipment_production_date"
            >
              <b-form-datepicker
                id="maintenance_equipment_production_date"
                size="sm"
                class="p-sm-0"
                v-model="maintenanceEquipment.production_date"
                v-bind:placeholder="$trans('Choose a date')"
                value="maintenanceEquipment.production_date"
                locale="nl"
                :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
              ></b-form-datepicker>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Serial number')"
              label-for="maintenance_equipment_serialnumber"
            >
              <b-form-input
                id="maintenance_equipment_serialnumber"
                size="sm"
                v-model="maintenanceEquipment.serialnumber"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Contract value')"
              label-for="maintenance_equipment_contract_value"
            >
              <b-form-input
                id="maintenance_equipment_contract_value"
                size="sm"
                v-model="maintenanceEquipment.contract_value"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Standard hours/mins.')"
              label-for="maintenance_equipment_standard_hours_hour"
            >
              <b-form-input
                id="maintenance_equipment_standard_hours_hour"
                size="sm"
                v-model="maintenanceEquipment.standard_hours_hour"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="12" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Remarks')"
              label-for="maintenance_equipment_remarks"
            >
                <b-form-textarea
                  id="maintenance_equipment_remarks"
                  v-model="maintenanceEquipment.remarks"
                  rows="1"
                ></b-form-textarea>
            </b-form-group>
          </b-col>
        </b-row>

        <div class="mx-auto">
          <footer class="modal-footer">
            <b-button @click="cancelForm" type="button" variant="secondary">
              {{ $trans('Cancel') }}</b-button>
            <b-button @click="submitForm" type="button" variant="primary">
              {{ $trans('Submit') }}</b-button>
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
import AwesomeDebouncePromise from 'awesome-debounce-promise'

import customerModel from '../../models/customer/Customer.js'
import maintenanceEquipmentModel from '../../models/customer/MaintenanceEquipment.js'

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
    customerPk: {
      type: [String, Number],
      default: null
    },
  },
  validations: {
    maintenanceEquipment: {
      customer: {
        required
      },
      equipment: {
        required,
      },
      amount: {
        required,
      },
      contract_value: {
        required,
      }
    }
  },
  data () {
    return {
      isLoading: false,
      submitClicked: false,
      maintenanceEquipment: maintenanceEquipmentModel.getFields(),
      errorMessage: null,
      equipmentModel: {},
      equipment: [],
      getEquipmentDebounced: null,
      newEquipmentName: null
    }
  },
  computed: {
    isCreate() {
      return !this.pk
    },
    isSubmitClicked() {
      return this.submitClicked
    }
  },
  async created() {
    this.getEquipmentDebounced = AwesomeDebouncePromise(this.getEquipment, 500)
    this.customer = await customerModel.detail(this.customerPk)
    if (this.isCreate) {
      this.maintenanceEquipment = maintenanceEquipmentModel.getFields()
    } else {
      await this.loadData()
    }
  },
  methods: {
    cancelCreateEquipment() {

    },
    submitCreateEquipment() {

    },
    async getEquipment(query) {
      try {
        this.equipment = await maintenanceEquipmentModel.search(query)
      } catch(error) {
        console.log('Error fetching equipment', error)
        this.errorToast(this.$trans('Error fetching equipment'))
      }
    },
    equipmentLabel({ name, city}) {
      return `${name} - ${city}`
    },
    selectEquipment(option) {
      this.maintenanceEquipment.equipment = option.id
    },

    async submitForm() {
      this.submitClicked = true
      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

      this.isLoading = true

      if (this.isCreate) {
        try {
          await maintenanceEquipmentModel.insert(this.maintenanceEquipment)
          this.infoToast(this.$trans('Created'), this.$trans('Maintenance equipment has been created'))
          this.isLoading = false
          this.cancelForm()
        } catch(error) {
          console.log('Error creating maintenance equipment', error)
          this.errorToast(this.$trans('Error creating maintenance equipment'))
          this.isLoading = false
        }

        return
      }

      try {
        await maintenanceEquipmentModel.update(this.pk, this.maintenanceEquipment)
        this.infoToast(this.$trans('Updated'), this.$trans('Maintenance equipment has been updated'))
        this.isLoading = false
        this.cancelForm()
      } catch(error) {
        console.log('Error updating maintenance equipment', error)
        this.errorToast(this.$trans('Error updating maintenance equipment'))
        this.isLoading = false
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        this.maintenanceEquipment = await maintenanceEquipmentModel.detail(this.pk)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching maintenance equipment', error)
        this.errorToast(this.$trans('Error loading maintenance equipment'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
