<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-detail">
      <b-breadcrumb class="mt-2" :items="breadcrumb"></b-breadcrumb>
      <b-row align-h="center">
        <h2>{{ customer.name }}</h2>
      </b-row>
      <b-row>
        <b-col cols="6">
          <b-table-simple>
            <b-tr>
              <b-td><strong>{{ $trans('Name') }}:</strong></b-td>
              <b-td>{{ customer.name }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Address') }}:</strong></b-td>
              <b-td>{{ customer.address }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Postal') }}:</strong></b-td>
              <b-td>{{ customer.postal }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('City') }}:</strong></b-td>
              <b-td>{{ customer.city }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Country') }}:</strong></b-td>
              <b-td>{{ customer.country_code }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Customer ID') }}:</strong></b-td>
              <b-td>{{ customer.customer_id }}</b-td>
            </b-tr>
          </b-table-simple>
        </b-col>
        <b-col cols="6">
          <b-table-simple>
            <b-tr>
              <b-td><strong>{{ $trans('Ext. identifier') }}:</strong></b-td>
              <b-td>{{ customer.external_identifier }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Email') }}:</strong></b-td>
              <b-td>{{ customer.email }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Tel.') }}:</strong></b-td>
              <b-td>{{ customer.tel }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Mobile') }}:</strong></b-td>
              <b-td>{{ customer.mobile }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Contact') }}:</strong></b-td>
              <b-td>{{ customer.contact }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Remarks') }}:</strong></b-td>
              <b-td>{{ customer.remarks }}</b-td>
            </b-tr>
          </b-table-simple>
        </b-col>
      </b-row>

      <CustomerStats
        v-if="!isLoading"
        ref="customer-stats"
      />

      <div class="app-grid">
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

      <div>
        <b-row align-h="center">
          <h3>{{ $trans("Past orders") }}</h3>
        </b-row>
        <SearchModal
          id="search-modal"
          ref="search-modal"
          @do-search="handleSearchOk"
        />

        <b-pagination
          v-if="this.orderPastModel.count > 20"
          class="pt-4"
          v-model="currentPage"
          :total-rows="this.orderPastModel.count"
          :per-page="this.orderPastModel.perPage"
          aria-controls="customer-past-table"
        ></b-pagination>

        <b-table
          id="customer-past-table"
          small
          :busy='isLoading'
          :fields="orderPastFields"
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
import orderPastModel from '../../models/orders/OrderPast.js'
import customerModel from '../../models/customer/Customer.js'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import OrderTableInfo from '../../components/OrderTableInfo.vue'
import SearchModal from '../../components/SearchModal.vue'
import yearModel from '../../models/orders/Year.js'
import CustomerStats from "../../components/CustomerStats";

export default {
  components: {
    ButtonLinkRefresh,
    ButtonLinkSearch,
    OrderTableInfo,
    SearchModal,
    CustomerStats,
  },
  data() {
    return {
      currentPage: 1,
      searchQuery: null,
      isLoading: false,
      orderPastModel,
      buttonDisabled: false,
      customer: customerModel.fields,
      orders: [],
      orderPastFields: [
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
      this.orderPastModel.currentPage = val
      this.loadData()
    }
  },
  methods: {
    // search
    handleSearchOk(val) {
      this.$refs['search-modal'].hide()
      orderPastModel.setSearchQuery(val)
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

      await this.loadHistory()
      await this.loadMaintenanceContracts()


      try {
        this.customer = await customerModel.detail(this.pk)

        const orderTypeStatsData = await yearModel.getOrderTypesStats(this.pk)
        const monthsStatsData = await yearModel.getMonthsStats(this.pk)
        const orderTypesMonthStatsData = await yearModel.getOrderTypesMonthsStats(this.pk)
        console.log(orderTypesMonthStatsData)
        this.$refs['customer-stats'].render(
          orderTypeStatsData, monthsStatsData, orderTypesMonthStatsData)

        this.isLoading = false
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
        orderPastModel.setListArgs(`customer_relation=${this.pk}`)
        const results = await orderPastModel.list()
        this.orders = results.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching history orders', error)
        this.errorToast(this.$trans('Error fetching orders'))
        this.isLoading = false
      }
    }
  },
  created() {
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
</style>
