<template>
  <div class="app-grid" ref="order-list-not-accepted">

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
        v-bind:tbody-tr-attr="rowStyle"
      >
        <template #head(id)="">
          <span class="text-info">{{ $trans('Order') }}</span>
        </template>
        <template #head(icons)="">
          <div class="float-right">
            <b-button-toolbar>
              <b-button-group class="mr-1">
                <ButtonLinkAdd
                  router_name="order-add"
                  v-bind:title="$trans('New order')"
                />
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
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkEdit
              v-if="!data.item.customer_order_accepted"
              router_name="order-edit"
              v-bind:router_params="{pk: data.item.id, unaccepted: true}"
              v-bind:title="$trans('Edit')"
            />
            <IconLinkDelete
              v-bind:title="$trans('Delete')"
              v-bind:method="function() { showDeleteModal(data.item.id) }"
            />
          </div>
        </template>
      </b-table>
    </div>
  </div>
</template>

<script>
import orderNotAcceptedModel from '../../models/orders/OrderNotAccepted.js'
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
import { componentMixin } from '../../utils'
import {NEW_DATA_EVENTS} from "../../constants";
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
      model: orderNotAcceptedModel,
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
