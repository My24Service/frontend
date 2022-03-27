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

    <b-pagination
      v-if="this.maintenanceProductModel.count > 20"
      class="pt-4"
      v-model="currentPage"
      :total-rows="this.maintenanceProductModel.count"
      :per-page="this.maintenanceProductModel.perPage"
      aria-controls="maintenance-product-table"
    ></b-pagination>

    <b-table
      id="maintenance-product-table"
      small
      :busy='isLoading'
      :fields="maintenanceProductFields"
      :items="maintenanceProducts"
      responsive="md"
      class="data-table"
      sort-icon-left
    >
      <template #head(icons)="">
        <div class="float-right">
          <b-button-toolbar>
            <b-button-group class="mr-1">
              <ButtonLinkAdd
                router_name="maintenance-product-add"
                v-bind:title="$trans('New maintenance-product')"
              />
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
      <template #cell(customer_name)="data">
        <router-link :to="{name: 'maintenance-products', params: {customer_pk: data.item.customer_pk}}">{{ data.item.customer_name }}</router-link>
      </template>
    </b-table>
  </div>
</template>

<script>
import maintenanceProductModel from '@/models/customer/MaintenanceProduct.js'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '@/components/ButtonLinkAdd.vue'

export default {
  name: 'MaintenanceProductsAll',
  components: {
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
  },
  data() {
    return {
      currentPage: 1,
      searchQuery: null,
      maintenanceProductModel,
      isLoading: false,
      maintenanceProducts: [],
      maintenanceProductFields: [
        {key: 'customer_name', label: this.$trans('Customer'), sortable: true},
        {key: 'customer_tel', label: this.$trans('Tel.'), sortable: true},
        {key: 'customer_address', label: this.$trans('Address'), sortable: true},
        {key: 'customer_city', label: this.$trans('City'), sortable: true},
        {key: 'num_products', label: this.$trans('# Products'), sortable: true},
        {key: 'num_created_orders', label: this.$trans('# Orders'), sortable: true},
        {key: 'sum_times_per_year', label: this.$trans('Times/year'), sortable: true},
        {key: 'sum_contract_value', label: this.$trans('Contract value'), sortable: true},
        {key: 'icons'}
      ],
    }
  },
  watch: {
    currentPage: function(val) {
      this.maintenanceProductModel.currentPage = val
      this.loadData()
    }
  },
  created() {
    this.currentPage = this.maintenanceProductModel.currentPage
    this.loadData()
  },
  methods: {
    handleSearchOk(bvModalEvt) {
      bvModalEvt.preventDefault()
      this.handleSearchSubmit()
    },
    handleSearchSubmit() {
      this.$refs['search-modal'].hide()

      maintenanceProductModel.setSearchQuery(this.searchQuery)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    async loadData() {
      this.isLoading = true;

      maintenanceProductModel.getAll().then((data) => {
        this.maintenanceProducts = data.results
        this.isLoading = false
      }).catch((error) => {
        console.log('error fetching maintenance products', error)
        this.errorToast(this.$trans('Error loading maintenance products'))
        this.isLoading = false
      })
    }
  }
}
</script>
