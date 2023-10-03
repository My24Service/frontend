<template>
  <b-overlay :show="isLoading" rounded="sm" v-if="orderService">
    <div class="app-detail">
      <div v-if="!isCustomer">
        <b-breadcrumb class="mt-2" :items="breadcrumb"></b-breadcrumb>

        <CustomerDetail
          :customer="customer"
        />

      </div>

      <OrderStats
        v-if="!isLoading"
        ref="order-stats"
      />

      <div class="app-grid" v-if="!isCustomer">
        <b-row align-h="center">
          <b-col cols="10">
            <b-row align-h="center">
              <h3>{{ $trans("Maintenance contracts") }}</h3>
            </b-row>
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
            <b-row align-h="end">
              <span class="button-container">
                <b-button
                  class="btn btn-outline-secondary"
                  :to="{name: 'maintenance-contract-add'}"
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
                  :to="{name: 'maintenance-contracts'}"
                  size="sm"
                  type="button"
                  variant="outline-secondary"
                >
                  {{ $trans('Manage >>') }}
                </b-button>
              </span>
            </b-row>
          </b-col>
        </b-row>
      </div>

      <div class="app-grid">
        <b-row align-h="center">
          <b-col cols="6">
            <b-row align-h="center">
              <h3>{{ $trans("Equipment") }}</h3>
            </b-row>
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
            <b-row align-h="end">
              <span class="button-container">
                <b-button
                  class="btn btn-outline-secondary"
                  :to="{name: 'customers-equipment-add'}"
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
                  :to="{name: 'customers-equipment-list'}"
                  size="sm"
                  type="button"
                  variant="outline-secondary"
                >
                  {{ $trans('Manage >>') }}
                </b-button>
              </span>
            </b-row>
          </b-col>
          <b-col cols="6">
            <b-row align-h="center">
              <h3>{{ $trans("Locations") }}</h3>
            </b-row>
            <b-table
              id="customer-location-table"
              small
              :busy='isLoading'
              :fields="locationFields"
              :items="locations"
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
          </b-col>
        </b-row>
      </div>

      <div class="spacer"></div>

      <div>
        <b-row align-h="center">
          <h3>{{ $trans("Orders") }}</h3>
        </b-row>

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

        <b-table
          id="customer-orders-table"
          small
          :busy='isLoading'
          :fields="orderFields"
          :items="orders"
          responsive="md"
          class="data-table"
        >
          <template #head(icons)="">
            <div class="float-right">
              <b-button-toolbar>
                <b-button-group class="mr-1">
                  <ButtonLinkRefresh
                    v-bind:method="function() { loadData() }"
                    v-bind:title="$trans('Refresh')"
                  />
                  <ButtonLinkSearch
                    v-bind:method="function() { showSearchModal() }"
                  />
                </b-button-group>
              </b-button-toolbar>
            </div>
          </template>
          <template #table-busy>
            <div class="text-center text-danger my-2">
              <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
              <strong>{{ $trans('Loading...') }}</strong>
            </div>
          </template>
          <template #cell(id)="data">
            <OrderTableInfo
              v-bind:order="data.item"
            />
          </template>
        </b-table>
      </div>

      <footer class="modal-footer">
        <b-button @click="goBack" class="btn btn-info" type="button" variant="primary">
          {{ $trans('Back') }}</b-button>
      </footer>
    </div>
  </b-overlay>
</template>

<script>
import maintenanceContractModel from '../../models/customer/MaintenanceContract.js'
import { OrderService } from '../../models/orders/Order.js'
import customerModel from '../../models/customer/Customer.js'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
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
    ButtonLinkRefresh,
    ButtonLinkSearch,
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
      breadcrumb: [
        {
          text: this.$trans('Customers'),
          to: {name: 'customer-list'}
        },
        {
          text: this.$trans('Detail'),
          active: true
        },
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
span.spacer {
  width: 10px;
}
div.spacer {
  margin: 10px;
}
</style>
