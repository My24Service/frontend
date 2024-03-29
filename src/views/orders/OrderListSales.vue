<template>
  <div class="app-grid" ref="order-list-past">

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <OrderFilters
      :statuscodes="statuscodes.filter(statuscode => statuscode.as_filter)"
      @set-filter="setStatusFilter"
      @remove-filter="removeStatusFilter"
    />

    <div class="overflow-auto">
      <Pagination
        v-if="!isLoading"
        :model="this.model"
        :model_name="$trans('Order')"
      />

      <b-table
        id="order-table"
        small
        :busy='isLoading'
        :fields="fields"
        :items="orders"
        responsive="md"
        class="data-table"
        tbody-tr-class="order-row"
        v-bind:tbody-tr-attr="rowStyle"
      >
        <template #head(id)="">
          <span class="text-info">{{ $trans('Order') }}</span>
        </template>
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
  </div>
</template>

<script>
import my24 from '../../services/my24.js'
import { OrderSalesService } from '../../models/orders/OrderSales.js'
import OrderTableInfo from '../../components/OrderTableInfo.vue'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import SearchModal from '../../components/SearchModal.vue'
import OrderFilters from "../../components/OrderFilters";
import Pagination from "../../components/Pagination.vue"

export default {
  components: {
    OrderTableInfo,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    SearchModal,
    OrderFilters,
    Pagination,
  },
  data() {
    return {
      searchQuery: null,
      model: new OrderSalesService(),
      statuscodes: [],
      isLoading: false,
      orders: [],
      fields: [
        {thAttr: {width: '80%'}, key: 'id', label: this.$trans('Order')},
        {thAttr: {width: '20%'}, key: 'icons'}
      ],
      orderLineFields: [
        { key: 'product', label: this.$trans('Product') },
        { key: 'location', label: this.$trans('Location') },
        { key: 'remarks', label: this.$trans('Remarks') }
      ],
      infoLineFields: [
        { key: 'info', label: this.$trans('Infolines') }
      ]
    }
  },
  async created() {
    // get statuscodes and load orders
    this.statuscodes = await this.$store.dispatch('getStatuscodes')
    this.model.currentPage = this.$route.query.page || 1
    await this.loadData()
  },
  methods: {
    // filters
    setStatusFilter(statuscode) {
      this.model.addListArg(`last_status=${statuscode}`)
      this.loadData()
    },
    removeStatusFilter(statuscode) {
      console.log('removing', { statuscode })
      this.model.removeListArg(`last_status=${statuscode}`)
      this.loadData()
    },
    // search
    handleSearchOk(val) {
      this.$refs['search-modal'].hide()
      this.model.setSearchQuery(val)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    // rest
    rowStyle(item, type) {
      if (!item || type !== 'row') return

      return {
        style: `border-left-style: solid; border-left-color: ${this.status2color(item.last_status)}`
      }
    },
    status2color(status) {
      return my24.status2color(this.statuscodes, status)
    },
    async loadData() {
      this.isLoading = true

      try {
        const data = await this.model.list()
        this.orders = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching sales orders', error)
        this.errorToast(this.$trans('Error loading orders'))
        this.isLoading = false
      }
    }
  }
}
</script>
