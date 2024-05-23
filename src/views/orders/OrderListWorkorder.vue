<template>
  <div class="app-page">
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

      <SearchModal
        id="search-modal"
        ref="search-modal"
        @do-search="handleSearchOk"
      />

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
                  <b-form-group label="Individual radios">
                    <b-form-radio v-model="sortMode" value="default">{{ $trans('Modified (default)') }}</b-form-radio>
                    <b-form-radio v-model="sortMode" value="-start_date">{{ $trans('Start date') }}</b-form-radio>
                  </b-form-group>
                </div>
              </b-col>
            </b-row>
          </b-container>
        </form>
      </b-modal>

      <b-modal
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
              <span class="order-type">{{ $trans("type") }}</span>
              <span class="order-company-name">{{ $trans("company") }}</span>
              <span class="order-due-date">{{ $trans("due date") }}</span>
              <span class="order-assignees">{{ $trans("people") }}</span>
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
            :with-delete="false"
            />

            <router-link  v-if="order.customer_relation" v-bind:title="$trans('Create invoice')"
                :to="{name: 'order-invoice-create', params: {uuid: order.uuid}}">
              <b-icon-receipt-cutoff class="edit-icon"></b-icon-receipt-cutoff>
            </router-link>

            <div v-else>
              <!-- fill with empty space -->
              <a class="edit-icon"><svg class="edit-icon b-icon bi" width="1em" height="1em"></svg></a>
            </div>
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
import { OrderWorkorderService } from '@/models/orders/OrderWorkorder'
import {StatusService} from '@/models/orders/Status'
import my24 from '../../services/my24.js'
import OrderTableInfo from '../../components/OrderTableInfo.vue'
import IconLinkPlus from '../../components/IconLinkPlus.vue'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import ButtonLinkSort from '../../components/ButtonLinkSort.vue'
import SearchModal from '../../components/SearchModal.vue'
import OrderFilters from "../../components/OrderFilters"
import Pagination from "../../components/Pagination.vue"

export default {
  components: {
    OrderTableInfo,
    IconLinkPlus,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkSort,
    SearchModal,
    OrderFilters,
    Pagination,
  },
  props: {
    queryMode: {
      type: [String],
      default: 'all'
    }
  },
  data() {
    return {
      sortMode: 'default',
      searchQuery: null,
      statusService: new StatusService(),
      model: new OrderWorkorderService(),
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
    async changeStatus() {
      const status = {
        order: this.orderPk,
        status: this.status.extra_text !== '' ? `${this.status.statuscode} ${this.status.extra_text}` : this.status.statuscode
      }

      try {
        await this.statusService.insert(status)
        this.infoToast(this.$trans('Created'), this.$trans('Status has been created'))
        await this.loadData();
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
      return my24.status2color(this.statuscodes, status);
    },
    showChangeStatusModal(id) {
      this.orderPk = id;
      this.$refs['change-status-modal'].show();
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
    }
  }
}
</script>
