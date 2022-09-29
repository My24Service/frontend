<template>
  <div class="app-grid" v-if="!isLoading">

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-maintenance-product-modal"
      ref="delete-maintenance-product-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this maintenance product?') }}</p>
    </b-modal>

    <b-breadcrumb class="mt-2" :items="breadcrumb"></b-breadcrumb>
    <h2>{{ $trans('Maintenance products for ') }} {{ contract.customer_view.name }}</h2>
    <div v-if="selectedMaintenanceProducts.length">
      {{ $trans('Create order with these') }} {{ selectedMaintenanceProducts.length }} {{ $trans('products') }}.
      <b-button size="sm" variant="primary" class="mx-2 btn btn-primary" @click.prevent="createMaintenanceOrder">
        {{ $trans('Go') }}
      </b-button>
      <b-button size="sm" variant="secondary" class="btn btn-secondary" @click.prevent="cancelCreateMaintenanceOrder">
        {{ $trans('Cancel') }}
      </b-button>
    </div>

    <div class="overflow-auto">
      <Pagination
        v-if="!isLoading"
        :model="this.model"
        :model_name="$trans('Product}')"
      />

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
                  :router_params="{contractPk: contract.id}"
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
        <template #cell(checkbox)="data">
          <b-form-checkbox
            v-model="selectedMaintenanceProducts"
            :value="data.item.id"
          >
          </b-form-checkbox>
        </template>
        <template #cell(totals)="data">
          {{ data.item.created_orders }} / {{ data.item.num_products }}
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
  </div>
</template>

<script>
import maintenanceProductModel from '@/models/customer/MaintenanceProduct.js'
import maintenanceContractModel from '@/models/customer/MaintenanceContract.js'

import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '@/components/ButtonLinkAdd.vue'
import SearchModal from '@/components/SearchModal.vue'
import Pagination from "@/components/Pagination.vue"

export default {
  name: 'MaintenanceProductList',
  components: {
    IconLinkDelete,
    IconLinkEdit,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
    SearchModal,
    Pagination,
  },
  props: {
    contractPk  : {
      type: [String, Number],
      default: null
    },
  },
  data() {
    return {
      contract: null,
      searchQuery: null,
      model: maintenanceProductModel,
      isLoading: false,
      selectedMaintenanceProducts: [],
      maintenanceProducts: [],
      maintenanceProductFields: [
        {key: 'checkbox', label: ''},
        {key: 'product_name', label: this.$trans('Product'), sortable: true},
        {key: 'brand', label: this.$trans('Brand'), sortable: true},
        {key: 'amount', label: this.$trans('Amount'), sortable: true},
        {key: 'times_per_year', label: this.$trans('Times/year'), sortable: true},
        {key: 'totals', label: this.$trans('# Orders/Products'), sortable: true},
        {key: 'icons'}
      ],
      breadcrumb: [
        {
          text: this.$trans('Maintenance contracts'),
          to: {name: 'maintenance-contracts'}
        },
        {
          text: this.$trans('Maintenance products'),
          active: true
        },
      ],
    }
  },
  async created() {
    this.isLoading = true
    this.model.currentPage = this.$route.query.page || 1

    const data = await this.$store.dispatch('getMaintenanceProducts')
    if (data) {
      const { maintenanceProducts } = data
      this.selectedMaintenanceProducts = maintenanceProducts
    }

    await this.loadData()
    this.isLoading = false
  },
  methods: {
    // search
    handleSearchOk(val) {
      this.$refs['search-modal'].hide()
      this.model.setSearchQuery(val)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    // create maintenance order
    cancelCreateMaintenanceOrder() {
      this.selectedMaintenanceProducts = []
      this.$store.dispatch('setMaintenanceProducts', null)
    },
    createMaintenanceOrder() {
      const data = {
        'maintenanceProducts': this.selectedMaintenanceProducts,
        'customer_id': this.contract.customer
      }

      this.$store.dispatch('setMaintenanceProducts', data)
      this.$router.push({name: 'order-add-maintenance'})
    },
    // delete
    showDeleteModal(id) {
      this.pk = id
      this.$refs['delete-maintenance-product-modal'].show()
    },
    async doDelete() {
      try {
        await this.model.delete(this.pk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Maintenance product has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting maintenance product', error)
        this.errorToast(this.$trans('Error deleting maintenance product'))
      }
    },
    // rest
    async loadData() {
      try {
        this.contract = await maintenanceContractModel.detail(this.contractPk)
        this.model.setListArgs(`contract=${this.contractPk}`)
        const data = await this.model.list()
        this.maintenanceProducts = data.results
      } catch(error) {
        console.log('error fetching maintenance products', error)
        this.errorToast(this.$trans('Error loading maintenance products'))
      }
    }
  }
}
</script>
