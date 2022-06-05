<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-detail">
      <b-breadcrumb class="mt-2" :items="breadcrumb"></b-breadcrumb>
      <h3>{{ customer.name }}</h3>
      <b-row>
        <b-col cols="6">
          <b-table-simple>
            <b-tr>
              <b-td><strong>{{ $trans('Name') }}:</strong></b-td>
              <b-td>{{ customer.name }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Address') }}:</strong></b-td>
              <b-td>{{ customer.address }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Postal') }}:</strong></b-td>
              <b-td>{{ customer.postal }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('City') }}:</strong></b-td>
              <b-td>{{ customer.city }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Country') }}:</strong></b-td>
              <b-td>{{ customer.country_code }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Customer ID') }}:</strong></b-td>
              <b-td>{{ customer.customer_id }}</b-td>
            </b-tr>
          </b-table-simple>
        </b-col>
        <b-col cols="6">
          <b-table-simple>
            <b-tr>
              <b-td><strong>{{ $trans('Ext. identifier') }}:</strong></b-td>
              <b-td>{{ customer.external_identifier }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Email') }}:</strong></b-td>
              <b-td>{{ customer.email }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Tel.') }}:</strong></b-td>
              <b-td>{{ customer.tel }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Mobile') }}:</strong></b-td>
              <b-td>{{ customer.mobile }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Contact') }}:</strong></b-td>
              <b-td>{{ customer.contact }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Remarks') }}:</strong></b-td>
              <b-td>{{ customer.remarks }}</b-td>
            </b-tr>
          </b-table-simple>
        </b-col>
      </b-row>

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
        aria-controls="customer-past-table"
      ></b-pagination>

      <b-table
        id="customer-past-table"
        small
        :busy='isLoading'
        :fields="orderPastFields"
        :items="orders"
        responsive="md"
        class="data-table"
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

      <footer class="modal-footer">
        <b-button @click="goBack" class="btn btn-info" type="button" variant="primary">
          {{ $trans('Back') }}</b-button>
      </footer>
    </div>
  </b-overlay>
</template>

<script>
import orderPastModel from '@/models/orders/OrderPast.js'
import customerModel from '@/models/customer/Customer.js'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import OrderTableInfo from '@/components/OrderTableInfo.vue'

export default {
  components: {
    ButtonLinkRefresh,
    ButtonLinkSearch,
    OrderTableInfo,
  },
  data() {
    return {
      currentPage: 1,
      searchQuery: null,
      isLoading: false,
      orderPastModel,
      buttonDisabled: false,
      customer: customerModel.fields,
      orders: [],
      orderPastFields: [
        { key: 'id', label: this.$trans('Order'), thAttr: {width: '95%'} },
        { key: 'icons', thAttr: {width: '5%'} },
      ],
      breadcrumb: [
        {
          text: this.$trans('Customers'),
          to: {name: 'customer-list'}
        },
        {
          text: this.$trans('Detail'),
          active: true
        },
      ],
    }
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  watch: {
    currentPage: function(val) {
      this.orderPastModel.currentPage = val
      this.loadData()
    }
  },
  methods: {
    handleSearchOk(bvModalEvt) {
      this.handleSearchSubmit()
    },
    handleSearchSubmit() {
      this.$refs['search-modal'].hide()

      orderPastModel.setSearchQuery(this.searchQuery)
      this.loadHistory()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    goBack() {
      this.$router.go(-1)
    },
    async loadData() {
      this.isLoading = true
      orderPastModel.setListArgs(`customer_relation=${this.pk}`)

      try {
        this.customer = await customerModel.detail(this.pk)
        await this.loadHistory()
        this.isLoading = false
      } catch(error) {
        console.log('error fetching orders or customer detail', error)
        this.errorToast(this.$trans('Error fetching orders'))
        this.isLoading = false
      }
    },
    async loadHistory() {
      this.isLoading = true

      try {
        const results = await orderPastModel.list()
        this.orders = results.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching history orders', error)
        this.errorToast(this.$trans('Error fetching orders'))
        this.isLoading = false
      }
    }
  },
  created() {
    this.loadData()
  }
}
</script>

<style scoped>
</style>
