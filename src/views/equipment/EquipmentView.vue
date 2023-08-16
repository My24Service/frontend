<template>
  <div class="app-page">
    <header>

      <div class='page-title'>
        <h3>
          <span @click="goBack">
            <b>Equipment</b>
          </span>
          / {{ equipment.name }}
        </h3>
      </div>
      <SearchModal
          id="search-modal"
          ref="search-modal"
          @do-search="handleSearchOk"
        />
    </header>
    <div class='page-detail flex-columns'>
      <div class='panel'>
        <h6>Equipment details</h6>
        <dl>
              <dt>{{ $trans('Name') }}</dt>
              <dd>{{ equipment.name }}</dd>
              <dt>{{ $trans('Brand') }}</dt>
              <dd>{{ equipment.brand }}</dd>
              <dt>{{ $trans('Identifier') }}</dt>
              <dd>{{ equipment.identifier }}</dd>
              <dt>{{ $trans('Description') }}</dt>
              <dd>{{ equipment.description }}</dd>
              <dt>{{ $trans('Installation date') }}</dt>
              <dd>{{ equipment.installation_date }}</dd>
              <dt>{{ $trans('Production date') }}</dt>
              <dd>{{ equipment.production_date }}</dd>
              <dt>{{ $trans('Serial number') }}</dt>
              <dd>{{ equipment.serialnumber }}</dd>
              <dt>{{ $trans('Standard hours') }}</dt>
              <dd>{{ equipment.standard_hours }}</dd>
          </dl>

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
          <b-pagination
            v-if="this.orderPastModel.count > 20"
            class="pt-4"
            v-model="currentPage"
            :total-rows="this.orderPastModel.count"
            :per-page="this.orderPastModel.perPage"
            aria-controls="customer-past-table"
          ></b-pagination>
      </div>
      
      <div class='panel wide'>
        <h6>Stats for {{ equipment.name }}</h6>
        <OrderStats
          v-if="!isLoading"
          ref="order-stats"
        />
      </div>
    </div>
  </div>
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
import equipmentModel from "../../models/equipment/equipment";

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
      equipment: equipmentModel.getFields(),
      orders: [],
      orderPastFields: [
        { key: 'id', label: this.$trans('Order'), thAttr: {width: '95%'} },
        { key: 'icons', thAttr: {width: '5%'} },
      ],
      breadcrumb: [
        {
          text: this.$trans('Equipment'),
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
        return 'equipment-equipment-list'
      } else {
        return 'customers-equipment-list'
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

      this.equipment = await equipmentModel.detail(this.pk)

      try {
        const orderTypeStatsData = await orderModel.getOrderTypesStatsEquipment(this.pk)
        const monthsStatsData = await orderModel.getMonthsStatsEquipment(this.pk)
        const orderTypesMonthStatsData = await orderModel.getOrderTypesMonthsStatsEquipment(this.pk)
        const countsYearOrdertypeStats = await orderModel.getCountsYearOrdertypeStatsEquipment(this.pk)

        this.$refs['order-stats'].render(
          orderTypeStatsData, monthsStatsData, orderTypesMonthStatsData, countsYearOrdertypeStats
        )

      } catch(error) {
        console.log('error fetching equipment detail data', error)
        this.errorToast(this.$trans('Error fetching equipment detail'))
        this.isLoading = false
      }
    },

    async loadHistory() {
      try {
        orderPastModel.addListArg(`equipment=${this.pk}`)
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
.wide {
  min-width: 66%;
  max-width: unset;
}
</style>
