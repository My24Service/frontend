<template>
  <div class="app-page">
    <header>
      <!-- WIP -->
      <div class='search-form'>
        <SearchForm @do-search="handleSearchOk" placeholderText="Search orders"/>
      </div>
      <div class="page-title">
        <h3>
          <b-icon icon="file-earmark-text-fill"></b-icon>
          <span>Orders</span>
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
      <OrderFilters
        :statuscodes="statuscodes.filter(statuscode => statuscode.as_filter)"
        @set-filter="setStatusFilter"
        @remove-filter="removeStatusFilter"
      />
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
                    <b-form-radio v-model="sortMode" value="default">{{ $trans('Modified (default)') }}</b-form-radio>
                    <b-form-radio v-model="sortMode" value="start_date">{{ $trans('Start date') }}</b-form-radio>
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
        <div class="flex-columns order-filter-links" v-if="isActive('orders')">
          <div>
            <router-link class="filter-item" :to="{name:'order-list'}">{{ $trans('Active') }}</router-link>
            <router-link class="filter-item" :to="{name:'orders-not-accepted'}">{{ $trans('Not accepted') }}</router-link>
            <router-link class="filter-item" :to="{name:'past-order-list'}">{{ $trans('Past') }}</router-link>
            <router-link class="filter-item" :to="{name:'order-list-sales'}">{{ $trans('Sales') }}</router-link>
            <router-link class="filter-item" :to="{name:'workorder-orders'}">{{ $trans('Workorder') }}</router-link>
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
                <span class="order-id">order id</span>
                <span class="order-type">type</span>
                <span class="order-company-name">company</span>
                <span class="order-start-date">start date</span>
                <span class="order-assignees">people</span>
                <span class="order-documents">Documents</span>
                <span class="order-status">status</span>
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
                v-if="true || !isCustomer && !isBranchEmployee && dispatch"
                v-bind:title="$trans('Assign')"
                v-bind:method="function() { selectOrder(order) }"
              />
            </li>
          </ul>
        </div>

  <!--
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
          <template #cell(icons)="data">
            <div class="h2 float-right">
              <IconLinkEdit
                router_name="order-edit"
                v-bind:router_params="{pk: data.item.id}"
                v-bind:title="$trans('Edit')"
              />
              <IconLinkPlus
                v-if="!isCustomer && !isBranchEmployee"
                type="tr"
                v-bind:title="$trans('Change status')"
                v-bind:method="function() { showChangeStatusModal(data.item.id) }"
              />
              <IconLinkDocuments
                router_name="order-documents"
                v-bind:router_params="{orderPk: data.item.id}"
                v-bind:title="$trans('Documents')"
              />
              <IconLinkAssign
                v-if="!isCustomer && !isBranchEmployee && dispatch"
                v-bind:title="$trans('Assign')"
                v-bind:method="function() { selectOrder(data.item) }"
              />
              <IconLinkDelete
                v-if="!isCustomer && !isBranchEmployee"
                v-bind:title="$trans('Delete')"
                v-bind:method="function() { showDeleteModal(data.item.id) }"
              />
            </div>
          </template>
        </b-table>
        -->
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
import { OrderService } from '../../models/orders/Order.js'
import statusModel from '../../models/orders/Status.js'
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
import OrderFilters from "../../components/OrderFilters.vue"
import Pagination from "../../components/Pagination.vue"
import { componentMixin } from '../../utils'
import {NEW_DATA_EVENTS, NEW_DATA_EVENTS_TYPES} from "../../constants";
import MemberNewDataSocket from "../../services/websocket/MemberNewDataSocket";

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
    OrderFilters,
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
  data() {
    return {
      memberNewDataSocket: new MemberNewDataSocket(),
      sortMode: 'default',
      searchQuery: null,
      model: new OrderService(),
      selectedOrders: [],
      status: {
        statuscode: '',
        extra_text: ''
      },
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
      console.log('removing', { statuscode })
      this.model.removeListArg(`last_status=${statuscode}`)
      this.loadData()
    },
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
        await statusModel.insert(status)
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

      await this.doFetchUnacceptedCountAndUpdateStore()
      this.selectedOrders = await this.$store.dispatch('getAssignOrders') || []

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
    isActive(item, subsection) {
      const parts = this.$route.path.split('/')
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
