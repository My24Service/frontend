<template>
  <div class="app-grid" ref="order-list-maintenance">

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

    <b-modal
      v-if="!isCustomer && !isBranchEmployee"
      id="delete-order-modal"
      ref="delete-order-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this order?') }}</p>
    </b-modal>

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

    <OrderFilters
      :statuscodes="statuscodes.filter(statuscode => statuscode.as_filter)"
      @set-filter="setStatusFilter"
      @remove-filter="removeStatusFilter"
    />

    <b-row v-if="!isCustomer && !isBranchEmployee && dispatch && selectedOrders.length > 0">
      <b-col cols="12">
        <strong>{{ $trans('Selected orders') }}:</strong>&nbsp;
        <span v-for="(order, index) in selectedOrders" :key="order.id">
          {{ order.order_id }}
          <b-link class="px-1" @click.prevent="removeSelectedOrder(index)">[ x ]</b-link>
        </span>
        <b-link v-if="dispatch" class="px-1" @click.prevent="doAssign()" v-bind:title="$trans('Assign these orders')">
          <b-icon-arrow-bar-right font-scale="1"></b-icon-arrow-bar-right>
        </b-link>
      </b-col>
    </b-row>

    <div class="overflow-auto">
      <Pagination
        v-if="!isLoading"
        :model="model"
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
    </div>
  </div>
</template>

<script>
import orderModel from '../../models/orders/Order.js'
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
import OrderFilters from "../../components/OrderFilters.vue"
import Pagination from "../../components/Pagination.vue"
import { componentMixin } from '../../utils'

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
    Pagination
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
      sortMode: 'default',
      searchQuery: null,
      model: orderModel,
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
      this.$refs['search-modal'].hide()
      this.model.setSearchQuery(val)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
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
    }
  }
}
</script>
