<template>
  <div class="app-page" ref="order-list-not-accepted">
    <header>
      <div class="page-title">
        <h3>
          <b-icon icon="clipboard"></b-icon>
          <span>{{ $trans("Orders") }}</span>
        </h3>

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
          <router-link class="btn button" :to="{name:'order-add'}">
            <b-icon icon="clipboard-plus"></b-icon>  {{ $trans('Add Order') }}
          </router-link>
        </b-button-toolbar>
      </div>
    </header>

    <div class="app-detail panel">
      <b-modal
        id="delete-order-modal"
        ref="delete-order-modal"
        v-bind:title="$trans('Delete?')"
        @ok="doDelete"
      >
        <p class="my-4">{{ $trans('Are you sure you want to delete this order?') }}</p>
      </b-modal>

      <b-modal
        id="sort-modal"
        ref="sort-modal"
        v-bind:title="$trans('Sort')"
        @ok="doSort"
      >
        <form ref="sort-form">
          <b-container fluid>
            <b-row role="group">
              <b-col size="12">
                <div>
                  <b-form-group :label="$trans('Sort')">
                    <b-form-radio v-model="sortMode" value="default">{{ $trans('Modified (default)') }}</b-form-radio>
                    <b-form-radio v-model="sortMode" value="-start_date">{{ $trans('Start date') }}</b-form-radio>
                  </b-form-group>
                </div>
              </b-col>
            </b-row>
          </b-container>
        </form>
      </b-modal>

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
        <div class="flex-columns">

          <router-link class="filter-item" :to="{name:'order-list'}">{{ $trans('Active') }}</router-link>
          <router-link class="filter-item" :to="{name:'orders-not-accepted'}">{{ $trans('Not accepted') }}</router-link>
          <router-link class="filter-item" :to="{name:'past-order-list'}">{{ $trans('Past') }}</router-link>
          <router-link class="filter-item" :to="{name:'order-list-sales'}">{{ $trans('Sales') }}</router-link>
          <router-link class="filter-item" :to="{name:'workorder-orders'}">{{ $trans('Workorder') }}</router-link>
        </div>

        <hr/>

        <ul class="listing order-list">
          <li><!-- FIXME -->
            <div class="headings">
              <span class="order-id"></span>
              <span class="order-type">{{ $trans("type") }}</span>
              <span class="order-company-name">{{ $trans("company") }}</span>
              <span class="order-due-date">{{ $trans("due date") }}</span>
              <span class="order-assignees">{{ $trans("people") }}</span>
              <span class="order-assignees">{{ $trans("documents") }}</span>
              <span class="order-status">{{ $trans("status") }}</span>
            </div>
          </li>

          <section v-if="isLoading" class="text-center my-2">
            <b-spinner class="align-middle"></b-spinner><br>
            <strong>{{ $trans('loading orders') }}</strong>
          </section>

          <li v-for="order in orders" :key="order.id">
            <OrderTableInfo
              :order="order"
            />
          </li>
        </ul>

        <Pagination
          v-if="!isLoading"
          :model="this.model"
          :model_name="$trans('Order')"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { OrderNotAcceptedService } from '@/models/orders/OrderNotAccepted'
import orderModel from '../../models/orders/Order.js'
import my24 from '../../services/my24.js'
import OrderTableInfo from '../../components/OrderTableInfo.vue'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import ButtonLinkSort from '../../components/ButtonLinkSort.vue'
import ButtonLinkAdd from '../../components/ButtonLinkAdd.vue'
import IconLinkDelete from '../../components/IconLinkDelete.vue'
import IconLinkEdit from '../../components/IconLinkEdit.vue'
import SearchModal from '../../components/SearchModal.vue'
import OrderFilters from "../../components/OrderFilters"
import Pagination from "../../components/Pagination.vue"
import { componentMixin } from '@/utils'
import {NEW_DATA_EVENTS} from "@/constants";
import MemberNewDataSocket from "../../services/websocket/MemberNewDataSocket";

export default {
  mixins: [componentMixin],
  components: {
    OrderTableInfo,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkSort,
    ButtonLinkAdd,
    IconLinkDelete,
    IconLinkEdit,
    SearchModal,
    OrderFilters,
    Pagination,
  },
  props: {
    dispatch: {
      type: [Boolean],
      default: false
    },
    queryMode: {
      type: [String],
      default: 'all'
    }
  },
  data() {
    return {
      memberNewDataSocket: new MemberNewDataSocket(),
      sortMode: 'default',
      sort: null,
      searchQuery: null,
      model: new OrderNotAcceptedService(),
      statuscodes: [],
      orderPk: null,
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
    // set queryMode
    this.model.queryMode = this.queryMode

    // reset searchQuery
    this.searchQuery = null

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
      this.model.removeListArg(`last_status=${statuscode}`)
      this.loadData()
    },
    // delete
    async doDelete() {
      try {
        await orderModel.delete(this.orderPk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Order has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting order', error)
        this.errorToast(this.$trans('Error deleting order'))
      }
    },
    showDeleteModal(id) {
      this.orderPk = id
      this.$refs['delete-order-modal'].show()
    },
    // sort
    showSortModal() {
      this.$refs['sort-modal'].show()
    },
    doSort() {
      this.model.setSort(this.sortMode)
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
        console.log('error fetching orders', error)
        this.errorToast(this.$trans('Error loading orders'))
        this.isLoading = false
      }
    },
    onNewData(data) {
      if (data.type === NEW_DATA_EVENTS.UNACCEPTED_ORDER) {
        this.loadData()
      }
    }
  },
  async mounted() {
    await this.memberNewDataSocket.init(NEW_DATA_EVENTS.UNACCEPTED_ORDER)
    this.memberNewDataSocket.setOnmessageHandler(this.onNewData)
    this.memberNewDataSocket.getSocket()
  },
  async beforeDestroy() {
    await this.memberNewDataSocket.init(NEW_DATA_EVENTS.UNACCEPTED_ORDER)
    this.memberNewDataSocket.removeOnmessageHandler()
    this.memberNewDataSocket.removeSocket()
  }
}
</script>
