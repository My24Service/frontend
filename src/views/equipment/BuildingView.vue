<template>
  <b-overlay :show="isLoading" rounded="sm" v-if="building">

    <div class="app-detail">
      <b-breadcrumb class="mt-2" :items="breadcrumb"></b-breadcrumb>
      <b-row align-h="center">
        <h2>{{ building.name }}</h2>
      </b-row>
      <b-row>
        <b-col cols="6">
          <b-table-simple>
            <b-tr>
              <b-td><strong>{{ $trans('Name') }}:</strong></b-td>
              <b-td>{{ building.name }}</b-td>
            </b-tr>
          </b-table-simple>
        </b-col>
        <b-col cols="6">
        </b-col>
      </b-row>

      <OrderStats
        :data-in="statsData"
        ref="order-stats"
      />

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
          aria-controls="customer-past-table"
        ></b-pagination>

        <b-table
          id="customer-past-table"
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
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import OrderTableInfo from '../../components/OrderTableInfo.vue'
import SearchModal from '../../components/SearchModal.vue'
import OrderStats from "../../components/OrderStats";
import {componentMixin} from "@/utils";

import { OrderService } from '@/models/orders/Order'
import { BuildingService } from "@/models/equipment/building";

export default {
  mixins: [componentMixin],
  components: {
    ButtonLinkRefresh,
    ButtonLinkSearch,
    OrderTableInfo,
    SearchModal,
    OrderStats,
  },
  data() {
    return {
      currentPage: 1,
      searchQuery: null,
      isLoading: false,
      buildingService: new BuildingService(),
      orderService: new OrderService(),
      buttonDisabled: false,
      building: null,
      orders: [],
      orderFields: [
        { key: 'id', label: this.$trans('Order'), thAttr: {width: '95%'} },
        { key: 'icons', thAttr: {width: '5%'} },
      ],
      breadcrumb: [
        {
          text: this.$trans('Buildings'),
          to: {name: this.listLink()}
        },
        {
          text: this.$trans('Detail'),
          active: true
        },
      ],
      statsData: null
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
    listLink() {
      if (this.hasBranches) {
        return 'equipment-building-list'
      } else {
        return 'customers-building-list'
      }
    },
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

      await this.loadHistory()

      this.building = await this.buildingService.detail(this.pk)

      try {
        const orderTypeStatsData = await this.orderService.getOrderTypesStatsBuilding(this.pk)
        const monthsStatsData = await this.orderService.getMonthsStatsBuilding(this.pk)
        const orderTypesMonthStatsData = await this.orderService.getOrderTypesMonthsStatsBuilding(this.pk)
        const countsYearOrdertypeStats = await this.orderService.getCountsYearOrdertypeStatsBuilding(this.pk)

        this.statsData = {
          orderTypeStatsData,
          monthsStatsData,
          orderTypesMonthStatsData,
          countsYearOrdertypeStats
        }

      } catch(error) {
        console.log('error fetching building detail data', error)
        this.errorToast(this.$trans('Error fetching building detail'))
        this.isLoading = false
      }
    },

    async loadHistory() {
      try {
        this.orderService.addListArg(`building=${this.pk}`)
        const results = await this.orderService.list()
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
span.spacer {
  width: 10px;
}
div.spacer {
  margin: 10px;
}
</style>
