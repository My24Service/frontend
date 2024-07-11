<template>
  <div class="app-page">
    <header>
      <!-- WIP -->
      <div class='search-form'>
        <SearchForm @do-search="handleSearchOk" :placeholderText="`${$trans('Search orders')}`"/>
      </div>
      <div class="page-title">
        <h3>
          <b-icon icon="file-earmark-text-fill"></b-icon>
          <span>{{ $trans("Orders") }}</span>
        </h3>

        <b-button-toolbar>
          <b-button-group class="mr-1">
            <ButtonLinkRefresh
              v-bind:method="function() { loadData() }"
              v-bind:title="$trans('Refresh')"
            />
            <ButtonLinkSort
              v-bind:method="function() { showSortModal() }"
            />
          </b-button-group>
          <router-link class="btn button" :to="{name:'order-add'}">
            <b-icon icon="file-earmark-plus"></b-icon> {{ $trans('Add order') }}
          </router-link>
        </b-button-toolbar>
      </div>

    </header>

    <div class="panel app-detail" ref="order-list-maintenance">

      <!-- FIXME sorting modal -->
      <b-modal
        id="sort-modal"
        ref="sort-modal"
        :title="$trans('Sort')"
        @ok="doSort"
      >
        <form ref="sort-form">
          <b-container fluid>
            <b-row role="group">
              <b-col size="12">
                <div>
                  <b-form-group :label="$trans('Sort')">
                    <b-form-radio v-model="sortMode" value="default">{{ $trans('Start date (default)') }}</b-form-radio>
                    <b-form-radio v-model="sortMode" value="last_update">{{ $trans('Last update') }}</b-form-radio>
                  </b-form-group>
                </div>
              </b-col>
            </b-row>
          </b-container>
        </form>
      </b-modal>

      <!-- delete order modal -->
      <b-modal
        v-if="!isCustomer && !isBranchEmployee"
        id="delete-order-modal"
        ref="delete-order-modal"
        v-bind:title="$trans('Delete?')"
        @ok="doDelete"
      >
        <p class="my-4">{{ $trans('Are you sure you want to delete this order?') }}</p>
      </b-modal>

      <!-- FIXME change status modal -->
      <b-modal
        v-if="!isCustomer && !isBranchEmployee"
        id="change-status-modal"
        ref="change-status-modal"
        v-bind:title="$trans('Add status')"
        @ok="changeStatus"
      >
        <form ref="change-status-form">
          <b-container fluid>
            <b-row role="group">
              <b-col size="4">
                <b-form-group
                  v-bind:label="$trans('New status')"
                  label-for="change-status-status"
                >
                  <b-form-select
                    id="change-status-status"
                    v-model="status.statuscode"
                    :options="statuscodes"
                    size="sm"
                    value-field="statuscode"
                    text-field="statuscode"
                  ></b-form-select>
                </b-form-group>
              </b-col>
              <b-col size="8">
                <b-form-group
                  v-bind:label="$trans('Extra text')"
                  label-for="change-status-extra-text"
                >
                  <b-form-input
                    size="sm"
                    id="change-status-extra-text"
                    v-model="status.extra_text"
                  ></b-form-input>
                </b-form-group>
              </b-col>
            </b-row>
          </b-container>
        </form>
      </b-modal>

      <div>
        <div class="order-filter-links" v-if="!isMobile()">
          <div class="filter-container">
            <div class="filters-part">
              <b-nav pills>
                <b-nav-item
                  :active="isActive('orders')"
                  :to="{name:'order-list'}"
                >
                  {{ $trans('All') }}
                </b-nav-item>
                <b-nav-item
                  :active="isActive('orders-not-accepted')"
                  :to="{name:'orders-not-accepted'}"
                >
                  {{ $trans('Not accepted') }}
                </b-nav-item>
              </b-nav>
            </div>
            <UserFilters
              route_name="order-list"
              :filters="userFilters"
            />

          </div>

          <div v-if="!isCustomer && !isBranchEmployee && dispatch && selectedOrders.length > 0">
            <span class="dimmed">{{ $trans('Selected orders') }} ({{ selectedOrders.length }}):</span>

            <span v-for="(order, index) in selectedOrders" :key="order.id" class="selected-order">
              {{ order.order_id }}
              <b-icon icon="x-circle" class="icon" variant="primary" @click.prevent="removeSelectedOrder(index)"></b-icon>
              <b-icon icon="x-circle-fill" class="icon" variant="primary" @click.prevent="removeSelectedOrder(index)"></b-icon>
            </span>

            <b-button variant="primary" v-if="dispatch && selectedOrders.length > 0" @click.prevent="doAssign()">
              <b-icon-person-lines-fill></b-icon-person-lines-fill>
              {{ $trans('Assign these orders') }}
            </b-button>

          </div>
        </div>

        <div class="overflow-auto">
          <ul class="listing order-list full-size">
            <li><!-- FIXME -->

              <div class="headings">
                <span class="order-id">{{ $trans("order id") }}</span>
                <span class="order-type">{{ $trans("type") }}</span>
                <span class="order-company-name">{{ $trans("company") }}</span>
                <span class="order-start-date">{{ $trans("start date") }}</span>
                <span class="order-assignees">{{ $trans("people") }}</span>
                <span class="order-documents">{{ $trans("Documents") }}</span>
                <span class="order-status">{{ $trans("status") }}</span>
              </div>
            </li>
            <section v-if="isLoading" class="text-center my-2 list-loading">
              <b-spinner class="align-middle"></b-spinner><br>
              <span>{{ $trans('loading orders') }}</span>
            </section>
            <li v-for="order in orders" :key="order.id">
              <OrderTableInfo
              v-bind:order="order"
              :model="model"
              @reload-data="loadData"
              />
              <IconLinkAssign
                v-if="!isCustomer && !isBranchEmployee && dispatch"
                v-bind:title="$trans('Assign')"
                v-bind:method="function() { selectOrder(order) }"
              />
            </li>
          </ul>
        </div>
      </div>
    </div>
    <Pagination
      v-if="!isLoading"
      :model="model"
      :model_name="$trans('Order')"
    />
  </div>
</template>
<style scoped>
.flex-columns {
  justify-content: space-between;
}
.flex-columns > div {
    flex-grow: 0;
    display: flex;
    align-items: center;
    gap: 2ex;
}
.selected-order .icon {cursor: pointer;}
.selected-order:not(:hover) .icon:last-of-type,
.selected-order:hover .icon:first-of-type { display: none;}

</style>
<script>
import { OrderService } from '@/models/orders/Order'
import {StatusService} from '@/models/orders/Status'
import my24 from '../../services/my24.js'
import OrderTableInfo from '../../components/OrderTableInfo.vue'
import IconLinkEdit from '../../components/IconLinkEdit.vue'
import IconLinkPlus from '../../components/IconLinkPlus.vue'
import IconLinkDocuments from '../../components/IconLinkDocuments.vue'
import IconLinkAssign from '../../components/IconLinkAssign.vue'
import IconLinkDelete from '../../components/IconLinkDelete.vue'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '../../components/ButtonLinkAdd.vue'
import ButtonLinkSort from '../../components/ButtonLinkSort.vue'
import SearchModal from '../../components/SearchModal.vue'
import SearchForm from '../../components/SearchForm.vue'
import SubNavOrders from '../../components/SubNavOrders.vue'
import UserFilters from "../../components/UserFilters.vue"
import Pagination from "../../components/Pagination.vue"
import { componentMixin } from '@/utils'
import {NEW_DATA_EVENTS, NEW_DATA_EVENTS_TYPES} from "@/constants";
import MemberNewDataSocket from "../../services/websocket/MemberNewDataSocket";
import {OrderFilterService} from "@/models/orders/OrderFilter";

export default {
  mixins: [componentMixin],
  components: {
    OrderTableInfo,
    IconLinkEdit,
    IconLinkPlus,
    IconLinkDocuments,
    IconLinkAssign,
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
    ButtonLinkSort,
    SearchModal,
    UserFilters,
    Pagination,
    SearchForm,
    SubNavOrders
  },
  props: {
    dispatch: {
      type: [Boolean],
      default: false
    },
    queryMode: {
      type: [String],
      default: 'all'
    },
  },
  watch: {
  },
  data() {
    return {
      memberNewDataSocket: new MemberNewDataSocket(),
      sortMode: 'default',
      searchQuery: null,
      statusService: new StatusService(),
      model: new OrderService(),
      selectedOrders: [],
      status: {
        statuscode: '',
        extra_text: ''
      },
      statuscodes: [],
      userFilters: [],
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
      ],
      filterService: new OrderFilterService(),
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
    showSortModal() {
      this.$refs['sort-modal'].show()
    },
    doSort() {
      this.model.setSort(this.sortMode)
      this.loadData()
    },
    handleSearchOk(val) {
      this.model.setSearchQuery(val)
      this.loadData()
    },
    doAssign() {
      this.$store.dispatch('setAssignOrders', this.selectedOrders)
      this.$router.push({name: 'mobile-dispatch', params: {assignModeProp: true}})
    },
    selectOrder(order) {
      for( let i=0; i<this.selectedOrders.length; i++) {
        if (this.selectedOrders[i].id === order.id) {
          return
        }
      }

      this.selectedOrders.push(order)
      this.$store.dispatch('setAssignOrders', this.selectedOrders)
    },
    removeSelectedOrder(index) {
      this.selectedOrders.splice(index, 1)
      this.$store.dispatch('setAssignOrders', this.selectedOrders)
    },
    async changeStatus() {
      const status = {
        order: this.orderPk,
        status: this.status.extra_text !== '' ? `${this.status.statuscode} ${this.status.extra_text}` : this.status.statuscode
      }

      try {
        await this.statusService.insert(status)
        this.infoToast(this.$trans('Created'), this.$trans('Status has been created'))
        await this.loadData()
      } catch(error) {
        console.log('Error creating status', error)
        this.errorToast(this.$trans('Error creating status'))
      }
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
    showDeleteModal(id) {
      this.orderPk = id
      this.$refs['delete-order-modal'].show()
    },
    showChangeStatusModal(id) {
      this.orderPk = id
      this.$refs['change-status-modal'].show()
    },
    async doDelete() {
      try {
        await this.model.delete(this.orderPk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Order has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting order', error)
        this.errorToast(this.$trans('Error deleting order'))
      }
    },
    async loadData() {
      this.isLoading = true

      // get filters
      this.userFilters = await this.filterService.getSimpleList()

      await this.doFetchUnacceptedCountAndUpdateStore()
      this.selectedOrders = await this.$store.dispatch('getAssignOrders') || []

      this.model.setUserFilter(this.$route.query.user_filter)

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
      if (data.type === NEW_DATA_EVENTS.UNACCEPTED_ORDER &&
        (data.data_type === NEW_DATA_EVENTS_TYPES.NEW_DATA_ORDER_ACCEPTED ||
        data.data_type === NEW_DATA_EVENTS_TYPES.NEW_DATA_ORDER_REJECTED)) {
        this.loadData()
      }
    },
    isMobile() {
      const parts = this.$route.path.split('/')
      parts.shift()
      if (parts[0] === 'mobile') {
        return true
      }
    },
    isActive(item, subsection) {
      if (this.$route.query.user_filter) {
        return false
      }

      const parts = this.$route.path.split('/')
      parts.shift()
      if(!subsection) {
        return parts[1] === item
      } else {
        return parts[parts.length] === item
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
<style scoped>
</style>
