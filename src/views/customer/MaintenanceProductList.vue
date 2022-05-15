<template>
  <div class="app-grid" v-if="!isLoading">

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
      id="delete-maintenance-product-modal"
      ref="delete-maintenance-product-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this maintenance product?') }}</p>
    </b-modal>

    <b-breadcrumb class="mt-2" :items="breadcrumb"></b-breadcrumb>
    <h2>{{ $trans('Maintenance products for ') }} {{ customer.name }}</h2>

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
                :router_params="{customerPk: customer.id, withCustomerSearch: false}"
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
      <template #cell(id)="data">
      </template>
      <template #cell(icons)="data">
        <div class="h2 float-right">
          <IconLinkEdit
            router_name="maintenance-product-edit"
            v-bind:router_params="{pk: data.item.id}"
            v-bind:title="$trans('Edit')"
          />
          <IconLinkDelete
            v-bind:title="$trans('Delete')"
            v-bind:method="function() { showDeleteModal(data.item.id) }"
          />
        </div>
      </template>
    </b-table>
  </div>
</template>

<script>
import maintenanceProductModel from '@/models/customer/MaintenanceProduct.js'
import customerModel from '@/models/customer/Customer.js'

import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '@/components/ButtonLinkAdd.vue'

export default {
  name: 'MaintenanceProductList',
  components: {
    IconLinkDelete,
    IconLinkEdit,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
  },
  props: {
    customer_pk: {
      type: [String, Number],
      default: null
    },
  },
  data() {
    return {
      customer: null,
      currentPage: 1,
      searchQuery: null,
      maintenanceProductModel,
      isLoading: false,
      maintenanceProducts: [],
      maintenanceProductFields: [
        {key: 'product_name', label: this.$trans('Product'), sortable: true},
        {key: 'brand', label: this.$trans('Brand'), sortable: true},
        {key: 'amount', label: this.$trans('Amount'), sortable: true},
        {key: 'times_per_year', label: this.$trans('Times/year'), sortable: true},
        {key: 'created_orders', label: this.$trans('# Orders'), sortable: true},
        {key: 'icons'}
      ],
      breadcrumb: [
        {
          text: this.$trans('All maintenance products'),
          to: {name: 'maintenance-products-all'}
        },
        {
          text: this.$trans('Maintenance products'),
          active: true
        },
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
    showDeleteModal(id) {
      this.pk = id
      this.$refs['delete-maintenance-product-modal'].show()
    },
    async doDelete() {
      try {
        await maintenanceProductModel.delete(this.pk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Maintenance product has been deleted'))
        this.loadData()
      } catch(error) {
        console.log('Error deleting maintenance product', error)
        this.errorToast(this.$trans('Error deleting maintenance product'))
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        this.customer = await customerModel.detail(this.customer_pk)
        maintenanceProductModel.setListArgs(`customer=${this.customer_pk}`)

        const data = await maintenanceProductModel.list()
        this.maintenanceProducts = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching maintenance products', error)
        this.errorToast(this.$trans('Error loading maintenance products'))
        this.isLoading = false
      }
    }
  }
}
</script>
