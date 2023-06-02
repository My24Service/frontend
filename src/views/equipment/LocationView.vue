<template>
  <b-overlay :show="isLoading" rounded="sm">

    <div class="app-detail">
      <b-breadcrumb class="mt-2" :items="breadcrumb"></b-breadcrumb>
      <b-row align-h="center">
        <h2>{{ location.name }}</h2>
      </b-row>
      <b-row>
        <b-col cols="6">
          <b-table-simple>
            <b-tr>
              <b-td><strong>{{ $trans('Name') }}:</strong></b-td>
              <b-td>{{ location.name }}</b-td>
            </b-tr>
          </b-table-simple>
        </b-col>
        <b-col cols="6">
        </b-col>
      </b-row>

      <OrderStats
        v-if="!isLoading"
        ref="order-stats"
      />

      <div class="spacer"></div>

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
import orderPastModel from '../../models/orders/OrderPast.js'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import OrderTableInfo from '../../components/OrderTableInfo.vue'
import SearchModal from '../../components/SearchModal.vue'
import orderModel from '../../models/orders/Order.js'
import OrderStats from "../../components/OrderStats";
import {componentMixin} from "../../utils";
import locationModel from "../../models/equipment/location";

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
      orderPastModel,
      buttonDisabled: false,
      location: locationModel.getFields(),
      orders: [],
      orderPastFields: [
        { key: 'id', label: this.$trans('Order'), thAttr: {width: '95%'} },
        { key: 'icons', thAttr: {width: '5%'} },
      ],
      breadcrumb: [
        {
          text: this.$trans('Location'),
          to: {name: this.listLink()}
        },
        {
          text: this.$trans('Detail'),
          active: true
        },
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
    listLink() {
      if (this.hasBranches) {
        return 'equipment-location-list'
      } else {
        return 'customers-location-list'
      }
    },
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

      this.location = await locationModel.detail(this.pk)

      try {
        const orderTypeStatsData = await orderModel.getOrderTypesStatsLocation(this.pk)
        const monthsStatsData = await orderModel.getMonthsStatsLocation(this.pk)
        const orderTypesMonthStatsData = await orderModel.getOrderTypesMonthsStatsLocation(this.pk)
        const countsYearOrdertypeStats = await orderModel.getCountsYearOrdertypeStatsLocation(this.pk)

        this.$refs['order-stats'].render(
          orderTypeStatsData, monthsStatsData, orderTypesMonthStatsData, countsYearOrdertypeStats
        )

      } catch(error) {
        console.log('error fetching location detail data', error)
        this.errorToast(this.$trans('Error fetching location detail'))
        this.isLoading = false
      }
    },

    async loadHistory() {
      try {
        orderPastModel.addListArg(`location=${this.pk}`)
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
span.spacer {
  width: 10px;
}
div.spacer {
  margin: 10px;
}
</style>
