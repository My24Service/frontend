<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container" v-if="!isLoading">
      <h2 align="center">{{ maintenanceContract.name }}</h2>

      <CustomerDetail
        :customer="customer"
      />

      <h4 align="center">
        {{ $trans('Contract value') }}: {{ maintenanceContract.sum_tariffs_dinero.toFormat('$0.00') }}
      </h4>

      <h4 align="center">
        {{ $trans('Remarks') }}: {{ maintenanceContract.remarks }}
      </h4>

      <h4>{{ $trans('Equipment') }}</h4>
      <div
        v-if="!isCreate && maintenanceEquipmentService.collection.length > 0"
      >
        <b-row>
          <b-col cols="12">
            <div>
              {{ $trans('Create order?') }}&nbsp;
              <b-button
                @click="selectEquipment"
                class="btn btn-primary"
                size="sm"
                type="button"
                variant="primary"
              >
                {{ $trans("Select equipment") }}
              </b-button>
            </div>
          </b-col>
        </b-row>
        <b-table
          small
          :fields="equipmentFields"
          :items="maintenanceEquipmentService.collection" responsive="md"
        >
          <template #cell(times_per_year)="data">
            {{ data.item.times_per_year }} ({{ $trans('in orders') }}: {{ data.item.num_order_equipment }})
          </template>
          <template #cell(tariff)="data">
            {{ data.item.tariff_dinero.toFormat('$0.00')}}
          </template>
          <template #cell(tariff_total)="data">
            {{ data.item.tariff_total_dinero.toFormat('$0.00')}}
          </template>
        </b-table>
      </div>

      <div
        v-if="isCreate"
      >
        <b-table
          small
          :fields="equipmentFieldsCreate"
          :items="orderLinesData" responsive="md"
        >
          <template #cell(id)="data">
            <b-form-checkbox
              :id="`equipment${data.item.equipment_pk}`"
              v-model="data.item.useAsOrderLine"
            >
              {{ data.item.id }}
            </b-form-checkbox>
          </template>
          <template #cell(amount)="data">
            <b-form-input
              :value="`${data.item.amount}`"
              v-model="data.item.amount"
            >
            </b-form-input>
            {{ $trans('Times / year') }}: <b>{{ data.item.times_per_year }}</b><br/>
            {{ $trans('done so far') }}: <b>{{ data.item.num_order_equipment }}</b><br/>
          </template>
        </b-table>

        <div class="mx-auto">
          <footer class="modal-footer">
            <b-button @click="cancelForm" class="btn btn-secondary" type="button" variant="secondary">
              {{ $trans('Cancel') }}
            </b-button>
            <b-button @click="createOrder" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
              {{ $trans('Submit') }}
            </b-button>
          </footer>
        </div>

      </div>
      <br/>
      <br/>
      <br/>
      <br/>
    </div>
  </b-overlay>
</template>

<script>
import maintenanceContractService from '../../models/customer/MaintenanceContract.js'
import maintenanceEquipmentService from "../../models/customer/MaintenanceEquipment";
import {componentMixin} from "../../utils";
import CustomerDetail from "../../components/CustomerDetail";

export default {
  mixins: [componentMixin],
  components: {
    CustomerDetail
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  data () {
    return {
      isLoading: false,
      maintenanceContract: null,
      maintenanceContractService,
      maintenanceEquipmentService,
      errorMessage: null,
      customer: null,
      isCreate: false,

      equipmentFields: [
        { key: 'equipment_name', label: this.$trans('Name') },
        { key: 'times_per_year', label: this.$trans('Times / year') },
        { key: 'tariff', label: this.$trans('Tariff') },
        { key: 'tariff_total', label: this.$trans('Tariff total') },
        { key: 'remarks', label: this.$trans('Remarks') },
        { key: 'icons', label: '' }
      ],
      equipmentFieldsCreate: [
        { key: 'id', label: this.$trans('id'), thAttr: {width: '5%'} },
        { key: 'name', label: this.$trans('Name'), thAttr: {width: '85%'} },
        { key: 'amount', label: this.$trans('Amount'), thAttr: {width: '10%'} },
      ],
      orderLinesData: [],
      selectedData: []
    }
  },
  computed: {
    buttonDisabled () {
      const orderlines = this.orderLinesData.filter((m) => m.useAsOrderLine === true)
      return orderlines.length === 0
    }
  },
  async created() {
    await this.loadData()
  },
  methods: {
    async createOrder() {
      // set in store
      const orderlines = this.orderLinesData.filter((m) => m.useAsOrderLine === true)
      const data = {
        maintenanceEquipment: orderlines,
        customer_pk: this.customer.id,
        contract_pk: this.pk
      }
      await this.$store.dispatch('setMaintenanceEquipment', data)

      // route to order form in maintenance mode
      await this.$router.push({name: 'order-add-maintenance'})
    },
    selectEquipment() {
      this.orderLinesData = this.maintenanceEquipmentService.collection.map((m) => ({
        contract_pk: this.pk,
        customer_pk: this.customer.id,
        equipment_pk: m.equipment,
        name: m.equipment_name,
        times_per_year: m.times_per_year,
        num_order_equipment: m.num_order_equipment ? m.num_order_equipment : 0,
        amount: 1,
        contract_amount: 1,
        useAsOrderLine: false
      }))
      this.isCreate = true
    },
    async loadData() {
      this.isLoading = true

      try {
        const data = await this.maintenanceContractService.detail(this.pk)
        this.maintenanceContract = new this.maintenanceContractService.model(
          {...data, sum_tariffs_currency: this.$store.getters.getDefaultCurrency}
        )
        this.customer = this.maintenanceContract.customer_view

        this.maintenanceEquipmentService.setListArgs(`contract=${this.pk}`)
        const equipmentData = await this.maintenanceEquipmentService.list()
        this.maintenanceEquipmentService.collection = equipmentData.results.map(
          (m) => new this.maintenanceEquipmentService.model({
            ...m, default_currency: this.$store.getters.getDefaultCurrency
          })
        )
        this.isLoading = false
      } catch(error) {
        console.log('error fetching maintenance contract', error)
        this.errorToast(this.$trans('Error loading maintenance contract'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.isCreate = false
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
