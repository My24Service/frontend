<template>
  <div class="app-page">
    <header>
        <div class='page-title'>
          <h3>
            <b-icon icon="shop"></b-icon>
            <span class='backlink' @click="goBack">Branches</span> / 
            <strong>{{ branch.name }}</strong>
          </h3>
          <router-link
          :to="{name: 'company-branch-edit', params: {pk: pk}}"
          class="btn"
          >Edit branch</router-link>
        </div>
      </header>
      <div class='page-detail flex-columns'>
        
        
        <div class="customer-details panel col-1-3" v-if="!isBranchEmployee">
            
          <CustomerCard :customer="branch"/>

        </div>

        <div class='panel col-2-3'>
          <div class="text-center" v-if="isLoading">
            <b-tabs>
              <b-tab title="Insights" disabled></b-tab>
              <b-tab title="Equipment" disabled></b-tab>
              <b-tab title="Locations" disabled></b-tab>
              <b-tab title="Past orders" disabled></b-tab>
            </b-tabs>
            <b-spinner class="align-middle"></b-spinner><br><br>&nbsp;&nbsp;
            <strong>{{ $trans('Loading...') }}</strong>
          </div>
          <b-tabs v-else>
            <b-tab :title="$trans('Insights')">
              <OrderStats
                v-if="!isLoading"
                ref="order-stats"
              />
            </b-tab>
            <b-tab :title="$trans('Equipment')">
                <b-table
                  id="customer-equipment-table"
                  small
                  :busy='isLoading'
                  :fields="equipmentFields"
                  :items="equipment"
                  responsive="md"
                  class="data-table"
                >
                  <template #cell(icons)="data">
                    <div class="h2 float-right">
                      <span class="button-container">
                        <b-button
                          :to="{name: 'equipment-equipment-edit', params: {pk: data.item.id}}"
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
                      :to="{name: 'equipment-equipment-add'}"
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
                      :to="{name: 'equipment-equipment-list'}"
                      size="sm"
                      type="button"
                      variant="outline-secondary"
                    >
                      {{ $trans('Manage >>') }}
                    </b-button>
                  </span>
                </b-row>
            </b-tab>
            <b-tab :title="$trans('Locations')">
              <b-table
                  id="branch-location-table"
                  small
                  :busy='isLoading'
                  :fields="locationFields"
                  :items="locations"
                  responsive="md"
                  class="data-table"
                >
                <template #cell(icons)="data">
                  <div class="h2 float-right">
                    <span class="button-container">
                      <b-button
                        :to="{name: 'equipment-location-edit', params: {pk: data.item.id}}"
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
              <span class="button-container">
                <b-button
                  class="btn btn-outline-secondary"
                  :to="{name: 'equipment-location-add'}"
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
                  :to="{name: 'equipment-location-list'}"
                  size="sm"
                  type="button"
                  variant="outline-secondary"
                >
                  {{ $trans('Manage >>') }}
                </b-button>
              </span>
            </b-tab>
            <b-tab :title="$trans('Past orders')">
              
              <div>
              
              <SearchModal
                id="search-modal"
                ref="search-modal"
                @do-search="handleSearchOk"
              />

              <div class='flex-columns' style="justify-content: space-between;">
                <span></span>
                <span>
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
                </span>
              </div>
              <br>
              <ul class='listing order-list'>
                <li v-for="order in orders">
                  <OrderTableInfo
                    v-bind:order="order"
                    />
                </li>
              </ul>
              <b-pagination
                v-if="this.orderPastModel.count > 20"
                class="pt-4"
                v-model="currentPage"
                :total-rows="this.orderPastModel.count"
                :per-page="this.orderPastModel.perPage"
                aria-controls="customer-past-table"
              ></b-pagination>
            </div>
            </b-tab>
            <template #tabs-end>
              
            </template>
          </b-tabs>
        </div>
    </div>
  </div>
</template>

<script>
import orderPastModel from '../../models/orders/OrderPast.js'
import branchModel from '../../models/company/Branch.js'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import OrderTableInfo from '../../components/OrderTableInfo.vue'
import SearchModal from '../../components/SearchModal.vue'
import orderModel from '../../models/orders/Order.js'
import OrderStats from "../../components/OrderStats";
import {componentMixin} from "../../utils";
import locationModel from "../../models/equipment/location";
import equipmentModel from "../../models/equipment/equipment";
import CustomerDetail from '../../components/CustomerDetail.vue'
import CustomerCard from '../../components/CustomerCard.vue'

export default {
  mixins: [componentMixin],
  components: {
    ButtonLinkRefresh,
    ButtonLinkSearch,
    OrderTableInfo,
    SearchModal,
    OrderStats,
    CustomerDetail,
    CustomerCard
},
  data() {
    return {
      currentPage: 1,
      searchQuery: null,
      isLoading: false,
      orderPastModel,
      buttonDisabled: false,
      branch: branchModel.fields,
      orders: [],
      orderPastFields: [
        { key: 'id', label: this.$trans('Order'), thAttr: {width: '95%'} },
        { key: 'icons', thAttr: {width: '5%'} },
      ],
      breadcrumb: [
        {
          text: this.$trans('Branches'),
          to: {name: 'company-branches'}
        },
        {
          text: this.$trans('Detail'),
          active: true
        },
      ],

      locations: [],
      locationFields: [
        {key: 'name', label: this.$trans('Name')},
        {key: 'created', label: this.$trans('Created')},
        {key: 'modified', label: this.$trans('Modified')},
        {key: 'icons', label: ""}
      ],

      equipment: [],
      equipmentFields: [
        {key: 'name', label: this.$trans('Equipment')},
        {key: 'brand', label: this.$trans('Brand')},
        {key: 'created', label: this.$trans('Created')},
        {key: 'icons', label: ""}
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

      try {
        if (!this.isBranchEmployee) {
          this.branch = await branchModel.detail(this.pk)

          const orderTypeStatsData = await orderModel.getOrderTypesStatsBranch(this.pk)
          const monthsStatsData = await orderModel.getMonthsStatsBranch(this.pk)
          const orderTypesMonthStatsData = await orderModel.getOrderTypesMonthsStatsBranch(this.pk)
          const countsYearOrdertypeStats = await orderModel.getCountsYearOrdertypeStatsBranch(this.pk)

          locationModel.setListArgs(`branch=${this.pk}`)
          let data = await locationModel.list()
          this.locations = data.results

          equipmentModel.setListArgs(`branch=${this.pk}`)
          data = await equipmentModel.list()
          this.equipment = data.results

          this.$refs['order-stats'].render(
            orderTypeStatsData, monthsStatsData, orderTypesMonthStatsData, countsYearOrdertypeStats
          )

          this.isLoading = false
          return
        }

        const orderTypeStatsData = await orderModel.getOrderTypesStatsBranch()
        const monthsStatsData = await orderModel.getMonthsStatsBranch()
        const orderTypesMonthStatsData = await orderModel.getOrderTypesMonthsStatsBranch()
        const countsYearOrdertypeStats = await orderModel.getCountsYearOrdertypeStatsBranch()

        let data = await locationModel.list()
        this.locations = data.results

        data = await equipmentModel.list()
        this.equipment = data.results

        this.$refs['order-stats'].render(
          orderTypeStatsData, monthsStatsData, orderTypesMonthStatsData, countsYearOrdertypeStats
        )

      } catch(error) {
        console.log('error fetching branch detail data', error)
        this.errorToast(this.$trans('Error fetching branch detail'))
        this.isLoading = false
      }
    },

    async loadHistory() {
      try {
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
