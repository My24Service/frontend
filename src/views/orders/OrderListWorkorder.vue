<template>
  <div class="app-grid">

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

    <b-modal
      id="sort-modal"
      ref="sort-modal"
      v-bind:title="$trans('Sort')"
      @ok="doSort"
    >
      <form ref="search-form">
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

    <b-pagination
      v-if="this.orderWorkorderModel.count > 20"
      class="pt-4"
      v-model="currentPage"
      :total-rows="this.orderWorkorderModel.count"
      :per-page="this.orderWorkorderModel.perPage"
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
      <template #cell(icons)="data">
        <div class="h2 float-right">
          <IconLinkPlus
            type="tr"
            v-bind:title="$trans('Change status')"
            v-bind:method="function() { showChangeStatusModal(data.item.id) }"
          />
        </div>
      </template>
    </b-table>
  </div>
</template>

<script>
import orderWorkorderModel from '@/models/orders/OrderWorkorder.js'
import statusModel from '@/models/orders/Status.js'
import my24 from '@/services/my24.js'
import OrderTableInfo from '@/components/OrderTableInfo.vue'
import IconLinkPlus from '@/components/IconLinkPlus.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import ButtonLinkSort from '@/components/ButtonLinkSort.vue'

export default {
  components: {
    OrderTableInfo,
    IconLinkPlus,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkSort,
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
      currentPage: 1,
      searchQuery: null,
      orderWorkorderModel,
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
  watch: {
    currentPage: function(val) {
      this.orderWorkorderModel.currentPage = val
      this.loadData()
    }
  },
  async created() {
    // set queryMode
    orderWorkorderModel.queryMode = this.queryMode

    // reset searchQuery
    this.searchQuery = null

    // get statuscodes and load orders
    this.statuscodes = await this.$store.dispatch('getStatuscodes')
    this.currentPage = this.orderWorkorderModel.currentPage
    this.loadData()
  },
  methods: {
    showSortModal() {
      this.$refs['sort-modal'].show()
    },
    doSort() {
      orderWorkorderModel.setSort(this.sortMode)
      this.loadData()
    },
    handleSearchOk(bvModalEvt) {
      bvModalEvt.preventDefault()
      this.handleSearchSubmit()
    },
    handleSearchSubmit() {
      this.$refs['search-modal'].hide()

      orderWorkorderModel.setSearchQuery(this.searchQuery)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    async changeStatus() {
      const status = {
        order: this.orderPk,
        status: this.status.extra_text !== '' ? `${this.status.statuscode} ${this.status.extra_text}` : this.status.statuscode
      }

      try {
        await statusModel.insert(token, status)
        this.infoToast(this.$trans('Created'), this.$trans('Status has been created'))
        this.loadData();
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
        const data = await orderWorkorderModel.list()
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
