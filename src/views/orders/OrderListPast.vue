<template>
  <div class="app-grid" ref="order-list-past">

    <b-modal
      id="search-modal"
      ref="search-modal"
      v-bind:title="$trans('Search')"
      @ok="handleSearchOk"
    >
      <form ref="search-form" @submit.stop.prevent="handleSearchSubmit">
        <b-container fluid>
          <b-row role="group">
            <b-col size="12">
              <b-form-group
                v-bind:label="$trans('Search')"
                label-for="search-query"
              >
                <b-form-input
                  size="sm"
                  autofocus
                  id="search-query"
                  ref="searchQuery"
                  v-model="searchQuery"
                ></b-form-input>
              </b-form-group>
            </b-col>
          </b-row>
        </b-container>
      </form>
    </b-modal>

    <b-pagination
      v-if="this.orderPastModel.count > 20"
      class="pt-4"
      v-model="currentPage"
      :total-rows="this.orderPastModel.count"
      :per-page="this.orderPastModel.perPage"
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
              <ButtonLinkSort
                v-bind:method="function() { showSortModal() }"
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
import orderPastModel from '@/models/orders/OrderPast.js'
import OrderTableInfo from '@/components/OrderTableInfo.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import ButtonLinkSort from '@/components/ButtonLinkSort.vue'

export default {
  components: {
    OrderTableInfo,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkSort,
  },
  data() {
    return {
      currentPage: 1,
      searchQuery: null,
      orderPastModel,
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
      this.orderPastModel.currentPage = val
      this.loadData()
    }
  },
  created() {
    // get statuscodes and load orders
    this.$store.dispatch('getStatuscodes').then((statuscodes) => {
      this.statuscodes = statuscodes
      this.currentPage = this.orderPastModel.currentPage
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

      orderPastModel.setSearchQuery(this.searchQuery)
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

      orderPastModel.list().then((data) => {
        this.orders = data.results
        this.isLoading = false
      }).catch((error) => {
        console.log('error fetching past orders', error)
        this.errorToast(this.$trans('Error loading orders'))
        this.isLoading = false
      })
    }
  }
}
</script>
