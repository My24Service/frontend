<template>
  <div class="app-grid" ref="order-list-past">

    <b-pagination
      v-if="this.orderSalesModel.count > 20"
      class="pt-4"
      v-model="currentPage"
      :total-rows="this.orderSalesModel.count"
      :per-page="this.orderSalesModel.perPage"
      aria-controls="order-table"
    ></b-pagination>

    <b-table
      id="order-table"
      small
      :busy='isLoading'
      :fields="fields"
      :items="orders"
      responsive="md"
      class="data-table"
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
</template>

<script>
import my24 from '@/services/my24.js'
import orderSalesModel from '@/models/orders/OrderSales.js'
import OrderTableInfo from '@/components/OrderTableInfo.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'

export default {
  components: {
    OrderTableInfo,
    ButtonLinkRefresh,
    ButtonLinkSearch,
  },
  data() {
    return {
      currentPage: 1,
      searchQuery: null,
      orderSalesModel,
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
  watch: {
    currentPage: function(val) {
      this.orderSalesModel.currentPage = val
      this.loadData()
    }
  },
  created() {
    // get statuscodes and load orders
    this.$store.dispatch('getStatuscodes').then((statuscodes) => {
      this.statuscodes = statuscodes
      this.currentPage = this.orderSalesModel.currentPage
      this.loadData()
    })
  },
  methods: {
    handleSearchOk(bvModalEvt) {
      bvModalEvt.preventDefault()
      this.handleSearchSubmit()
    },
    handleSearchSubmit() {
      this.$refs['search-modal'].hide()

      orderSalesModel.setSearchQuery(this.searchQuery)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    rowStyle(item, type) {
      if (!item || type !== 'row') return

      return {
        style: `border-left-style: solid; border-left-color: ${this.status2color(item.last_status)}`
      }
    },
    status2color(status) {
      return my24.status2color(this.statuscodes, status)
    },
    loadData() {
      this.isLoading = true

      orderSalesModel.list().then((data) => {
        this.orders = data.results
        this.isLoading = false
      }).catch((error) => {
        this.flashMessage.show({
          status: 'error',
          title: this.$trans('Error'),
          message: this.$trans('Error loading orders')
        })

        console.log('error fetching past orders', error)
        this.isLoading = false
      })
    }
  }
}
</script>
