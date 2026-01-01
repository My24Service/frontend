<template>
  <div class="app-page" v-if="!isLoading && maintenanceContract">
    <header>
      <div class='page-title'>
        <h3>
          <b-icon icon="file-earmark-lock"></b-icon>
          <router-link :to="{name: 'maintenance-contracts'}" class='backlink'>{{ $trans('Maintenance contracts') }}</router-link> /
          <span>{{ maintenanceContract.name }}</span>
        </h3>
        <BButton-toolbar>
          <router-link class="btn primary" :to="{name: 'maintenance-contract-edit', params:{ pk: this.pk}}">{{ $trans("Edit contract") }}</router-link>
        </BButton-toolbar>
      </div>
    </header>

    <div class='page-detail'>

      <div class='flex-columns'>
      <div class='panel col-1-3 sidebar'>
        <h6>{{ $trans('Contract')}}</h6>
        <dl>
          <dt>{{ $trans('Value') }}</dt>
          <dd>{{ maintenanceContract.sum_tariffs_dinero.toFormat('$0.00') }}</dd>
          <dt>{{ $trans('Remarks') }}</dt>
          <dd>{{ maintenanceContract.remarks }}</dd>
        </dl>
        <h6>{{ $trans('Customer') }}</h6>
        <CustomerCard :customer="customer"/>
        <dl>
          <dt></dt>
          <dd>
            <router-link
              class="btn btn-primary"
              :to="{name: 'customer-view', params: {pk: customer.id}}">
              <b-icon icon="building"></b-icon>
              {{ $trans('view customer details') }}
            </router-link>
          </dd>
        </dl>
      </div>

      <div class='panel col-2-3'>
        <b-tabs>
          <b-tab :title="$trans('Equipment')">
            <!-- equipment select -->
            <div class="flex-columns" style="justify-content: end;">
              <span>
                {{ $trans('Create order?') }}&nbsp;
                <BButton
                  @click="selectEquipment"
                  class="btn btn-primary"
                  size="sm"
                  type="button"
                  variant="primary"
                  :disabled="isCreate ? 'disabled' : false"
                >
                  {{ $trans("Select equipment") }}
                </BButton>
              </span>
            </div>
            <hr/>
            <div>
              <b-table
                small
                :fields="equipmentFieldsCreate"
                :items="orderLinesData" responsive="md"
              >
                <template #cell(id)="data">
                  <BFormCheckbox
                    :id="`equipment${data.item.equipment_pk}`"
                    v-model="data.item.useAsOrderLine"
                  >
                    {{ data.item.id }}
                  </BFormCheckbox>
                </template>
                  <template #cell(frequency)="data">
                    <span>
                      <strong>{{ data.item.times_per_year }}</strong> &times; {{ $trans('yearly') }}
                    </span>
                    <small class="dimmed">({{ data.item.num_order_equipment }} {{ $trans('in orders') }})</small>
                </template>
                <template #cell(amount)="data">
                  <BFormGroup
                  label-cols="4">
                  <BFormInput
                    :value="`${data.item.amount}`"
                    v-model="data.item.amount"
                    type="number"
                    min="1"
                  />
                </BFormGroup>
                </template>
              </b-table>
              <footer class="modal-footer">
                <BButton @click="cancelForm" class="btn btn-secondary" type="reset" variant="secondary">
                  {{ $trans('Cancel') }}
                </BButton>
                <BButton @click="createOrder" :disabled="buttonDisabled" class="btn btn-primary" type="submit" variant="primary">
                  {{ $trans('Add equipment') }}
                </BButton>
              </footer>

            </div>

            <!-- equipment list -->
            <div v-if="maintenanceEquipmentService.collection.length > 0" >
              <b-table

                :fields="equipmentFields"
                :items="maintenanceEquipmentService.collection" responsive="md"
              >
                <template #cell(times_per_year)="data">
                  <span>
                    <strong>{{ data.item.times_per_year }}</strong> &times; {{ $trans('yearly') }}
                  </span>
                  <small class="dimmed">({{ data.item.num_order_equipment }} {{ $trans('in orders') }})</small>
                </template>
                <template #cell(tariff)="data">
                  <div style="text-align: end;">{{ data.item.tariff_dinero.toFormat('$0.00')}}</div>
                </template>
                <template #cell(tariff_total)="data">
                  <div style="text-align: end;">{{ data.item.tariff_total_dinero.toFormat('$0.00')}}</div>
                </template>
              </b-table>
            </div>
          </b-tab>
          <b-tab
          :title="`${$trans('Orders')} (${maintenanceOrders.length})`"
          >
            <!-- orders -->
            <SearchModal
              id="search-modal"
              ref="search-modal"
              @do-search="handleSearchOk"
            />
            <div class="flex-columns" style="justify-content: end;">
              <span>
                <BButton-toolbar>
                  <BButton-group class="mr-1">
                    <ButtonLinkRefresh
                      v-bind:method="function() { loadData() }"
                      v-bind:title="$trans('Refresh')"
                    />
                    <ButtonLinkSearch
                      v-bind:method="function() { showSearchModal() }"
                    />
                  </BButton-group>
                </BButton-toolbar>
              </span>
            </div>
            <hr/>
            <ul class='listing order-list' v-if="!isLoading">
              <li v-if="!maintenanceOrders.length">
                <div style="text-align: center;">{{ $trans('No orders for') }} {{ $trans('contract')}}.</div>
              </li>
              <li v-for="item in maintenanceOrders" >
                <OrderTableInfo v-bind:order="item" />
              </li>
            </ul>
            <b-pagination
              v-if="ordersMaintenanceService.count > 20"
              class="pt-4"
              v-model="currentPage"
              :total-rows="ordersMaintenanceService.count"
              :per-page="ordersMaintenanceService.perPage"
              aria-controls="maintenance-orders-table"
            ></b-pagination>

          </b-tab>
        </b-tabs>

      </div><!-- .panel -->
      </div><!-- .flex-columns -->

    </div><!-- .page-detail -->
  </div><!-- .app-page -->
</template>

<script>
import { MaintenanceContractService } from '../../models/customer/MaintenanceContract.js'
import { MaintenanceEquipmentService } from "../../models/customer/MaintenanceEquipment";

import CustomerDetail from "../../components/CustomerDetail";
import CustomerCard from "../../components/CustomerCard";
import {OrdersMaintenanceService} from '../../models/orders/OrdersMaintenance'
import ButtonLinkRefresh from "../../components/ButtonLinkRefresh";
import ButtonLinkSearch from "../../components/ButtonLinkSearch";
import OrderTableInfo from "../../components/OrderTableInfo";
import SearchModal from "../../components/SearchModal";

export default {

  components: {
    CustomerDetail,
    CustomerCard,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    OrderTableInfo,
    SearchModal,
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  data () {
    return {
      currentPage: 1,
      isLoading: false,
      maintenanceContract: null,
      maintenanceContractService: new MaintenanceContractService(),
      maintenanceEquipmentService: new MaintenanceEquipmentService(),
      ordersMaintenanceService: new OrdersMaintenanceService(),
      errorMessage: null,
      customer: null,
      isCreate: false,

      equipmentFields: [
        { key: 'equipment_name', label: $trans('Name') },
        { key: 'times_per_year', label: $trans('Frequency') },
        { key: 'tariff', label: $trans('Tariff'), thAttr: {style: 'text-align: right;'}},
        { key: 'remarks', label: $trans('Remarks') },
        { key: 'icons', label: '' }
      ],
      equipmentFieldsCreate: [
        { key: 'id', label: $trans('id'), thAttr: {width: '5%'} },
        { key: 'name', label: $trans('Name'), },
        { key: 'frequency', label: $trans('Frequency'), thAttr: {width: '50%'} },
        { key: 'amount', label: $trans('Amount'), thAttr: {width: '15%'} },
      ],
      orderLinesData: [],
      selectedData: [],
      maintenanceOrdersFields: [
        { key: 'id', label: $trans('Order'), thAttr: {width: '95%'} },
        { key: 'icons', label: ''},
      ],
      maintenanceOrders: []
    }
  },
  watch: {
    currentPage: function(val) {
      this.ordersMaintenanceService.currentPage = val
      this.loadData()
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
    // search
    handleSearchOk(val) {
      this.$refs['search-modal'].hide()
      this.orderService.setSearchQuery(val)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    async createOrder() {
      // set in store
      const orderlines = this.orderLinesData.filter((m) => m.useAsOrderLine === true)
      const data = {
        maintenanceEquipment: orderlines,
        customer_pk: this.customer.id,
        contract_pk: this.pk,
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
        useAsOrderLine: false,
        remarks: m.remarks
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

        this.ordersMaintenanceService.setListArgs(`contract=${this.pk}`)
        const maintenanceOrdersData = await this.ordersMaintenanceService.list()
        this.maintenanceOrders = maintenanceOrdersData.results

        this.isLoading = false
      } catch(error) {
        console.log('error fetching maintenance contract', error.response)
        errorToast(create, `${$trans('Error loading maintenance contract')}: ${error.response.status} ${error.response.statusText}`)
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
