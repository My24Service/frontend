<template>
  <div class="app-page" ref="order-list-past">
    <header>
      <div class="page-title">
        <h3>
          <b-icon icon="clipboard"></b-icon>
          <span>Orders</span>
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
      <SearchModal
        id="search-modal"
        ref="search-modal"
        @do-search="handleSearchOk"
      />

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
                <span class="order-type">type</span>
                <span class="order-company-name">company</span>
                <span class="order-due-date">due date</span>
                <span class="order-assignees">people</span>
                <span class="order-status">status</span>
              </div>
            </li>

            <li v-if="isLoading" class="text-center my-2">
              <b-spinner class="align-middle"></b-spinner><br>
              <strong>{{ $trans('loading orders') }}</strong>
            </li>

            <li v-for="order in orders" :key="order.id">
              <OrderTableInfo
              v-bind:order="order"
            />
            </li>
        </ul>
      </div>
    </div>
    <Pagination
      v-if="!isLoading"
      :model="this.model"
      :model_name="$trans('Order')"
    />
  </div>
</template>

<script>
import my24 from '@/services/my24.js'
import statusModel from '@/models/orders/Status.js'
import orderPastModel from '@/models/orders/OrderPast.js'
import OrderTableInfo from '@/components/OrderTableInfo.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import ButtonLinkSort from '@/components/ButtonLinkSort.vue'
import IconLinkPlus from '@/components/IconLinkPlus.vue'
import SearchModal from '@/components/SearchModal.vue'
import OrderFilters from "@/components/OrderFilters"
import Pagination from "@/components/Pagination.vue"
import { componentMixin } from '@/utils'

export default {
  mixins: [componentMixin],
  components: {
    OrderTableInfo,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkSort,
    IconLinkPlus,
    SearchModal,
    OrderFilters,
    Pagination,
  },
  data() {
    return {
      searchQuery: null,
      model: orderPastModel,
      statuscodes: [],
      isLoading: true,
      orders: [],
      fields: [
        {thAttr: {width: '95%'}, key: 'id', label: this.$trans('Order')},
        {thAttr: {width: '5%'}, key: 'icons'}
      ],
      orderLineFields: [
        { key: 'product', label: this.$trans('Product') },
        { key: 'location', label: this.$trans('Location') },
        { key: 'remarks', label: this.$trans('Remarks') }
      ],
      infoLineFields: [
        { key: 'info', label: this.$trans('Infolines') }
      ],
      status: {
        statuscode: '',
        extra_text: ''
      },
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
    // change status
    showChangeStatusModal(id) {
      this.orderPk = id
      this.$refs['change-status-modal'].show()
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
        console.log('error fetching past orders', error)
        this.errorToast(this.$trans('Error loading orders'))
        this.isLoading = false
      }
    }
  }
}
</script>
