<template>
  <div class="app-grid" ref="order-list-past">

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      v-if="!isCustomer"
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
      <template #cell(icons)="data">
        <div class="h2 float-right">
          <IconLinkPlus
            v-if="!isCustomer"
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
  watch: {
    currentPage: function(val) {
      this.orderPastModel.currentPage = val
      this.loadData()
    }
  },
  async created() {
    // get statuscodes and load orders
    this.statuscodes = await this.$store.dispatch('getStatuscodes')
    this.currentPage = this.orderPastModel.currentPage
    this.currentPage = 1
    await this.loadData()
  },
  methods: {
    // filters
    setStatusFilter(statuscode) {
      orderPastModel.addListArg(`last_status=${statuscode}`)
      this.loadData()
    },
    removeStatusFilter(statuscode) {
      console.log('removing', { statuscode })
      orderPastModel.removeListArg(`last_status=${statuscode}`)
      this.loadData()
    },
    // search
    handleSearchOk(val) {
      this.$refs['search-modal'].hide()
      orderPastModel.setSearchQuery(val)
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
        const data = await orderPastModel.list()
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
