<template>
  <b-overlay :show="isLoading" rounded="sm" v-if="orderService">
    <div class="app-page">
      <header>
        <div class="page-title">
          <h3>
            <b-icon icon="building"></b-icon>
            <span class="backlink" @click="goBack">{{ $trans("Customers") }}</span> / {{  customer.name }}
          </h3>
          <router-link class="btn button" :to="{name:'customer-edit', pk: pk}">
            <b-icon icon="pencil" font-scale="0.95"></b-icon> &nbsp; {{ $trans('Edit customer') }}
          </router-link>
        </div>
      </header>

      <div class="page-detail customer-details" v-if="!isCustomer">

        <div class='flex-columns'>
          <div class="panel col-1-3 sidebar">
            <CustomerCard :customer="customer" />
          </div>
          <div class="panel col-2-3">
            <b-tabs>
              <b-tab :title="$trans('Orders')">
                <div class="overflow-auto">
                  <ul class="listing order-list">
                    <li v-for="item in orders" :key="item.id">
                      <OrderTableInfo
                        v-bind:order="item"
                      />
                    </li>
                  </ul>

                  <SearchModal
                    id="search-modal"
                    ref="search-modal"
                    @do-search="handleSearchOk"
                  />

                  <b-pagination
                    v-if="orderService.count > 20"
                    class="pt-4"
                    v-model="currentPage"
                    :total-rows="orderService.count"
                    :per-page="orderService.perPage"
                    aria-controls="customer-orders-table"
                  ></b-pagination>

                </div>
              </b-tab>
              <b-tab :title="$trans('Equipment')">
                <span class="button-container">
                  <b-button
                    class="btn btn-outline-secondary"
                    :to="{name: 'customers-equipment-add'}"
                    size="sm"
                    type="button"
                    variant="outline-secondary"
                  >
                    {{ $trans('Add equipment') }}
                  </b-button>
                </span>
                <span class="button-container">
                  <b-button
                    class="btn btn-outline-secondary"
                    :to="{name: 'customers-equipment-list'}"
                    size="sm"
                    type="button"
                    variant="outline-secondary"
                  >
                    {{ $trans('Manage equipment') }}
                  </b-button>
                </span>
                <hr/>
                <b-table
                  id="customer-equipment-table"
                  small
                  :busy='isLoading'
                  :fields="equipmentFields"
                  :items="equipment"
                  responsive="md"
                  class="data-table"
                >
                  <template #cell(customer)="data">
                    {{ data.item.customer_branch_view.name }} - {{ data.item.customer_branch_view.city }}
                  </template>
                  <template #cell(branch)="data">
                    {{ data.item.customer_branch_view.name }} - {{ data.item.customer_branch_view.city }}
                  </template>
                  <template #cell(icons)="data">
                    <div class="h2 float-right">
                      <span class="button-container">
                        <b-button
                          :to="{name: 'customers-equipment-edit', params: {pk: data.item.id}}"
                          class="btn btn-outline-secondary"
                          size="sm"
                          type="button"
                          variant="outline-secondary"
                        >
                          {{ $trans('Edit') }}
                        </b-button>
                      </span>
                    </div>
                  </template>
                </b-table>
              </b-tab>
              <b-tab :title="$trans('Maintenance contracts')">
                <!-- <h6>{{ $trans("Maintenance contracts") }}</h6> -->
                <b-table
                    id="customer-maintenance-contracts-table"
                    small
                    :busy='isLoading'
                    :fields="maintenanceContractFields"
                    :items="maintenanceContracts"
                    responsive="md"
                    class="data-table"
                  >
                    <template #cell(contract)="data">
                      <b-row>
                        <b-col cols="5">
                          <table class="totals">
                            <tr>
                              <td><strong>{{ $trans('Name') }}:</strong></td>
                              <td>{{ data.item.name }}</td>
                            </tr>
                            <tr>
                              <td><strong>{{ $trans('Contract value') }}:</strong></td>
                              <td>EUR {{ data.item.contract_value }}</td>
                            </tr>
                          </table>
                        </b-col>
                        <b-col cols="4">
                          <table class="totals">
                            <tr>
                              <td><strong>{{ $trans('Created orders') }}</strong></td>
                              <td>{{ data.item.created_orders}}</td>
                            </tr>
                            <tr>
                              <td><strong>{{ $trans('# equipment in orders') }}</strong></td>
                              <td>{{ data.item.num_order_equipment}}</td>
                            </tr>
                          </table>
                        </b-col>
                        <b-col cols="3">
                          <div class="float-right">
                            <span class="button-container">
                              <b-button
                                class="btn btn-outline-primary"
                                :to="{name: 'order-add-maintenance'}"
                                size="sm"
                                type="button"
                                variant="outline-primary"
                              >
                                {{ $trans('Create order') }}
                              </b-button>
                            </span>

                            <span class="button-container">
                              <b-button
                                :to="{name: 'maintenance-contract-edit', params: {pk: data.item.id}}"
                                class="btn btn-outline-secondary"
                                size="sm"
                                type="button"
                                variant="outline-secondary"
                              >
                                {{ $trans('Edit') }}
                              </b-button>
                            </span>
                          </div>
                        </b-col>
                      </b-row>
                    </template>
                </b-table>
                <hr/>
                <span class="button-container">
                <b-button
                  class="btn btn-outline-secondary"
                  :to="{name: 'maintenance-contract-add'}"
                  size="sm"
                  type="button"
                  variant="outline-secondary"
                >
                  {{ $trans('Add contract') }}
                </b-button>
              </span>
              <span class="button-container">
                <b-button
                  class="btn btn-outline-secondary"
                  :to="{name: 'maintenance-contracts'}"
                  size="sm"
                  type="button"
                  variant="outline-secondary"
                >
                  {{ $trans('Manage contracts') }}
                </b-button>
              </span>
              </b-tab>
              <b-tab :title="$trans('Locations')">
                <b-table
                  id="customer-location-table"
                  small
                  :busy='isLoading'
                  :fields="locationFields"
                  :items="locations"
                  responsive="md"
                  class="data-table">
                  <template #cell(customer)="data">
                    {{ data.item.customer_branch_view.name }} - {{ data.item.customer_branch_view.city }}
                  </template>
                  <template #cell(branch)="data">
                    {{ data.item.customer_branch_view.name }} - {{ data.item.customer_branch_view.city }}
                  </template>
                  <template #cell(icons)="data">
                    <div class="h2 float-right">
                      <span class="button-container">
                        <b-button
                          :to="{name: 'customers-location-edit', params: {pk: data.item.id}}"
                          class="btn btn-outline-secondary"
                          size="sm"
                          type="button"
                          variant="outline-secondary"
                        >
                          {{ $trans('Edit') }}
                        </b-button>
                      </span>
                    </div>
                  </template>
                </b-table>
                <b-row align-h="end">
                  <span class="button-container">
                    <b-button
                      class="btn btn-outline-secondary"
                      :to="{name: 'customers-location-add'}"
                      size="sm"
                      type="button"
                      variant="outline-secondary"
                    >
                      {{ $trans('New') }}
                    </b-button>
                  </span>
                  <span class="button-container">
                    <b-button
                      class="btn btn-outline-secondary"
                      :to="{name: 'customers-location-list'}"
                      size="sm"
                      type="button"
                      variant="outline-secondary"
                    >
                      {{ $trans('Manage >>') }}
                    </b-button>
                  </span>
                </b-row>
              </b-tab>
              <b-tab title="Insights" key="stats">
                <OrderStats
                  v-if="!isLoading"
                  ref="order-stats"
                />
              </b-tab>
            </b-tabs>
          </div>
        </div>

      </div>
    </div>
  </b-overlay>
</template>

<script>
import maintenanceContractModel from '../../models/customer/MaintenanceContract.js'
import { OrderService } from '../../models/orders/Order.js'
import customerModel from '../../models/customer/Customer.js'
import CustomerCard from '../../components/CustomerCard.vue'
import OrderTableInfo from '../../components/OrderTableInfo.vue'
import SearchModal from '../../components/SearchModal.vue'
import OrderStats from "../../components/OrderStats";
import {componentMixin} from "../../utils";
import locationModel from "../../models/equipment/location";
import equipmentModel from "../../models/equipment/equipment";
import CustomerDetail from "../../components/CustomerDetail";

export default {
  mixins: [componentMixin],
  components: {
    CustomerCard,
    OrderTableInfo,
    SearchModal,
    OrderStats,
    CustomerDetail,
  },
  data() {
    return {
      currentPage: 1,
      searchQuery: null,
      isLoading: false,
      orderService: new OrderService(),
      buttonDisabled: false,
      customer: customerModel.fields,
      orders: [],
      orderFields: [
        { key: 'id', label: this.$trans('Order'), thAttr: {width: '95%'} },
        { key: 'icons', thAttr: {width: '5%'} },
      ],
      maintenanceContracts: [],
      maintenanceContractFields: [
        {key: 'contract', label: this.$trans('Contract')},
      ],
      locations: [],
      locationFieldsCustomer: [
        {key: 'name', label: this.$trans('Name')},
        {key: 'created', label: this.$trans('Created')},
        {key: 'modified', label: this.$trans('Modified')},
        {key: 'icons', label: ""}
      ],
      locationFieldsBranch: [
        {key: 'name', label: this.$trans('Name')},
        {key: 'created', label: this.$trans('Created')},
        {key: 'modified', label: this.$trans('Modified')},
        {key: 'icons', label: ""}
      ],
      locationFields: [],

      equipment: [],
      equipmentFieldsCustomer: [
        {key: 'name', label: this.$trans('Equipment')},
        {key: 'brand', label: this.$trans('Brand')},
        {key: 'created', label: this.$trans('Created')},
        {key: 'icons', label: ""}
      ],
      equipmentFieldsBranch: [
        {key: 'name', label: this.$trans('Equipment')},
        {key: 'brand', label: this.$trans('Brand')},
        {key: 'created', label: this.$trans('Created')},
        {key: 'icons', label: ""}
      ],
      equipmentFields: [],
    }
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  watch: {
    currentPage: function(val) {
      this.orderService.currentPage = val
      this.loadData()
    }
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
    // rest
    goBack() {
      this.$router.go(-1)
    },
    async loadData() {
      this.isLoading = true

      try {
        await this.loadHistory()

        if (!this.isCustomer) {
          await this.loadMaintenanceContracts()
          this.customer = await customerModel.detail(this.pk)

          const orderTypeStatsData = await this.orderService.getOrderTypesStatsCustomer(this.pk)
          const monthsStatsData = await this.orderService.getMonthsStatsCustomer(this.pk)
          const orderTypesMonthStatsData = await this.orderService.getOrderTypesMonthsStatsCustomer(this.pk)
          const countsYearOrdertypeStats = await this.orderService.getCountsYearOrdertypeStatsCustomer(this.pk)

          this.$refs['order-stats'].render(
            orderTypeStatsData, monthsStatsData, orderTypesMonthStatsData, countsYearOrdertypeStats
          )

          locationModel.setListArgs(`customer=${this.pk}`)
          let data = await locationModel.list()
          this.locations = data.results

          equipmentModel.setListArgs(`customer=${this.pk}`)
          data = await equipmentModel.list()
          this.equipment = data.results

          this.isLoading = false

          return
        }

        const orderTypeStatsData = await this.orderService.getOrderTypesStatsCustomer()
        const monthsStatsData = await this.orderService.getMonthsStatsCustomer()
        const orderTypesMonthStatsData = await this.orderService.getOrderTypesMonthsStatsCustomer()
        const countsYearOrdertypeStats = await this.orderService.getCountsYearOrdertypeStatsCustomer()

        this.$refs['order-stats'].render(
          orderTypeStatsData, monthsStatsData, orderTypesMonthStatsData, countsYearOrdertypeStats
        )

        let data = await locationModel.list()
        this.locations = data.results

        data = await equipmentModel.list()
        this.equipment = data.results

        this.isLoading = false

        // use this in customer dashboard
        // const bla = await orderService.getTopXCustomers()

      } catch(error) {
        console.log('error fetching orders or customer detail', error)
        this.errorToast(this.$trans('Error fetching orders'))
        this.isLoading = false
      }
    },

    async loadMaintenanceContracts() {
      try {
        maintenanceContractModel.setListArgs(`customer=${this.pk}`)
        const data = await maintenanceContractModel.list()
        this.maintenanceContracts = data.results
      } catch(error) {
        console.log('error fetching maintenance contracts', error)
        this.errorToast(this.$trans('Error fetching maintenance contracts'))
        this.isLoading = false
      }
    },

    async loadHistory() {
      try {
        const results = await this.orderService.getAllForCustomer(this.pk)
        this.orders = results.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching customer orders', error)
        this.errorToast(this.$trans('Error fetching customer orders'))
        this.isLoading = false
      }
    }
  },
  created() {
    if (this.hasBranches) {
      this.locationFields = this.locationFieldsBranch
      this.equipmentFields = this.equipmentFieldsBranch
    } else {
      this.locationFields = this.locationFieldsCustomer
      this.equipmentFields = this.equipmentFieldsCustomer
    }
    this.loadData()
  },
  async mounted () {
  }
}
</script>

<style scoped>
table.totals tr:first-child td {
  border-top: none;
}
span.button-container {
  padding: 8px;
}
p {
  line-height: 1.7;
  padding-top: 0.5rem;
}
.flex-columns > .panel {
  max-width: unset;
}
</style>
