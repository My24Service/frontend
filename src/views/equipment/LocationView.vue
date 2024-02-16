<template>
  <div class="app-page" v-show="location">
    <header>

      <div class='page-title' v-if="location">
        <h3>
          <b-icon icon="shop-window"></b-icon>
          <span @click="goBack" class="backlink">Locations</span>
          / {{ location.name }}
        </h3>
        <router-link :to="{name: editLink, params: {pk: this.pk}}" class="btn primary">{{$trans('Edit location')}}</router-link>
      </div>
      <SearchModal
          id="search-modal"
          ref="search-modal"
          @do-search="handleSearchOk"
        />
    </header>

    <div class='page-detail flex-columns'>
      <div class='panel col-1-3 sidebar'>
        <h6>{{ $trans('Location details') }}</h6>
        <dl>
            <dt>{{ $trans('Name') }}</dt>
            <dd v-if="location">{{ location.name }}</dd>
        </dl>
      </div>

      <div class='panel col-2-3'>
        <b-tabs>
          <b-tab :title="$trans('Orders')">
            <div class='flex-columns space-between align-items-center'>
              <h6>{{ $trans("Past orders") }}</h6>
              <span>
                <b-button-group>
                  <ButtonLinkRefresh
                  v-bind:method="function() { loadData() }"
                  v-bind:title="$trans('Refresh')"
                  />
                  <ButtonLinkSearch
                  v-bind:method="function() { showSearchModal() }"
                  />
                </b-button-group>
              </span>
            </div>
            <ul class='listing order-list'>
              <li v-for="item in orders" :key="item.id">
                <OrderTableInfo
                  v-bind:order="item"
                />
              </li>
            </ul>
            <b-pagination
              v-if="orderService.count > 20"
              class="pt-4"
              v-model="currentPage"
              :total-rows="orderService.count"
              :per-page="orderService.perPage"
              aria-controls="customer-past-table"
            ></b-pagination>
          </b-tab>
          <b-tab :title="$trans('Insights')" @click="renderStats">
            <OrderStats
            ref="order-stats"
            />
          </b-tab>
        </b-tabs>
      </div>
    </div>
  </div>
</template>

<script>
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import OrderTableInfo from '../../components/OrderTableInfo.vue'
import SearchModal from '../../components/SearchModal.vue'
import { OrderService } from '../../models/orders/Order.js'
import OrderStats from "../../components/OrderStats";
import {componentMixin} from "../../utils";
import { LocationService } from "../../models/equipment/location";

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
      buttonDisabled: false,
      location: null,
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
      locationService: new LocationService(),
      orderService: new OrderService()
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
  computed: {
    editLink() {
      if (this.hasBranches) {
        return 'equipment-location-edit'
      } else {
        return 'customers-location-edit'
      }
    },
  },
  methods: {
    async renderStats() {
      try {
        // this.isLoading = true
        const orderTypeStatsData = await this.orderService.getOrderTypesStatsEquipment(this.pk)
        const monthsStatsData = await this.orderService.getMonthsStatsEquipment(this.pk)
        const orderTypesMonthStatsData = await this.orderService.getOrderTypesMonthsStatsEquipment(this.pk)
        const countsYearOrdertypeStats = await this.orderService.getCountsYearOrdertypeStatsEquipment(this.pk)

        this.$refs['order-stats'].render(
          orderTypeStatsData, monthsStatsData, orderTypesMonthStatsData, countsYearOrdertypeStats
        )

      } catch(error) {
        console.log('error fetching location stats', error)
        this.errorToast(`${this.$trans('Error fetching location insights:')} ${error}`)
        // this.isLoading = false
      }
    },
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
        this.location = await this.locationService.detail(this.pk)
      } catch(error) {
        console.log('error fetching location detail data', error)
        this.errorToast(this.$trans('Error fetching location detail'))
        this.isLoading = false
      }
    },

    async loadHistory() {
      try {
        const results = await this.orderService.getAllForEquipmentLocation(null, this.pk)
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
  .wide {
    min-width: 66%;
    max-width: unset;
  }
</style>
