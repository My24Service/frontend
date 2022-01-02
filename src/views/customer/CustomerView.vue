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
        <template #cell(workorder_url)="data">
          <b-link :href="data.item.value" target="_blank">{{ $trans('View') }}</b-link>
        </template>
        <template #cell(orderlines)="data">
          <b-table dark borderless small :fields="orderLineFields" :items="data.item.orderlines" responsive="sm"></b-table>
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
import orderPastModel from '@/models/orders/OrderPast'
import customerModel from '@/models/customer/Customer'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh'
import ButtonLinkSearch from '@/components/ButtonLinkSearch'

export default {
  components: {
    ButtonLinkRefresh,
    ButtonLinkSearch,
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
      orderLineFields: [
        { key: 'product', label: this.$trans('Product') },
        { key: 'location', label: this.$trans('Location') },
        { key: 'remarks', label: this.$trans('Remarks') }
      ],
      orderPastFields: [
        { key: 'order_id', label: this.$trans('Order ID'), sortable: true, thAttr: {width: '10%'} },
        { key: 'order_date', label: this.$trans('Date'), sortable: true, thAttr: {width: '20%'} },
        { key: 'order_type', label: this.$trans('Type'), sortable: true, thAttr: {width: '10%'} },
        { key: 'workorder_url', label: this.$trans('Workorder'), sortable: true, thAttr: {width: '10%'} },
        { key: 'orderlines', label: this.$trans('Orderlines'), thAttr: {width: '40%'}, tdAttr: {colspan: 2} },
        { key: 'icons', thAttr: {width: '10%'} },
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
      bvModalEvt.preventDefault()
      this.handleSearchSubmit()
    },
    handleSearchSubmit() {
      this.$refs['search-modal'].hide()

      orderPastModel.setSearchQuery(this.searchQuery)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    goBack() {
      this.$router.go(-1)
    },
    loadData() {
      this.isLoading = true
      orderPastModel.setListArgs(`customer_relation=${this.pk}`)

      customerModel.detail(this.pk).then((customer) => {
        this.customer = customer

        orderPastModel.list().then((result) => {
          this.orders = result.results
          this.isLoading = false
        }).catch((error) => {
          console.log('error fetching orders', error)
          this.flashMessage.show({
            status: 'error',
            title: this.$trans('Error'),
            message: this.$trans('Error fetching orders')
          })

          this.isLoading = false
        })
      }).catch((error) => {
        console.log('error fetching customer', error)
        this.flashMessage.show({
          status: 'error',
          title: this.$trans('Error'),
          message: this.$trans('Error fetching customer')
        })

        this.isLoading = false
      })
    }
  },
  created() {
    this.loadData()
  }
}
</script>

<style scoped>
</style>
