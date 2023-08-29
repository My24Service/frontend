<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3><b-icon icon="file-earmark-lock"></b-icon> Maintenance Contracts</h3>
      </div>
    </header>
    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-maintenance-contract-modal"
      ref="delete-maintenance-contract-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this maintenance contract?') }}</p>
    </b-modal>

    <div class="panel overflow-auto">

      <b-table
        id="maintenance-contract-table"
        small
        :busy='isLoading'
        :fields="maintenanceContractFields"
        :items="maintenanceContracts"
        responsive="md"
        class="data-table"
        sort-icon-left
      >
        <template #head(icons)="">
          <div class="float-right">
            <b-button-toolbar>
              <b-button-group class="mr-1">
                <ButtonLinkAdd
                  router_name="maintenance-contract-add"
                  v-bind:title="$trans('New maintenance contract')"
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
<!--        <template #cell(name)="data">-->
<!--          <router-link :to="{name: 'maintenance-equipment', params: {contractPk: data.item.id}}">-->
<!--            {{ data.item.name }}-->
<!--          </router-link>-->
<!--        </template>-->
        <template #cell(totals)="data">
          <table class="totals">
            <tr>
              <td><strong>{{ $trans('Created orders') }}</strong></td>
              <td>{{ data.item.created_orders}}</td>
            </tr>
            <tr>
              <td><strong>{{ $trans('# contract equipment') }}</strong></td>
              <td>{{ data.item.num_equipment}}</td>
            </tr>
            <tr>
              <td><strong>{{ $trans('# equipment in orders') }}</strong></td>
              <td>{{ data.item.num_order_equipment}}</td>
            </tr>
          </table>
        </template>
        <template #cell(customer_view_name)="data">
          {{ data.item.customer_view.name }}
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkEdit
              router_name="maintenance-contract-edit"
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

      <Pagination
        v-if="!isLoading"
        :model="this.model"
        :model_name="$trans('Contract')"
      />
    </div>
  </div>
</template>

<script>
import maintenanceContractModel from '../../models/customer/MaintenanceContract.js'
import IconLinkEdit from '../../components/IconLinkEdit.vue'
import IconLinkDelete from '../../components/IconLinkDelete.vue'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '../../components/ButtonLinkAdd.vue'
import SearchModal from '../../components/SearchModal.vue'
import Pagination from "../../components/Pagination.vue"

export default {
  name: 'MaintenanceContractList',
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
    customer_pk: {
      type: [String, Number],
      default: null
    },
  },
  data() {
    return {
      customer: null,
      searchQuery: null,
      model: maintenanceContractModel,
      isLoading: false,
      maintenanceContracts: [],
      maintenanceContractFields: [
        {key: 'name', label: this.$trans('Contract name'), sortable: true},
        {key: 'customer_view_name', label: this.$trans('Customer'), sortable: true},
        {key: 'contract_value', label: this.$trans('Contract value'), sortable: true},
        {key: 'remarks', label: this.$trans('Remarks'), sortable: true},
        {key: 'totals', label: this.$trans('Totals'), sortable: true},
        {key: 'icons'}
      ],
    }
  },
  created() {
    this.model.currentPage = this.$route.query.page || 1
    this.loadData()
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
    // delete
    showDeleteModal(id) {
      this.pk = id
      this.$refs['delete-maintenance-contract-modal'].show()
    },
    async doDelete() {
      try {
        await this.model.delete(this.pk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Maintenance contract has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting maintenance contract', error)
        this.errorToast(this.$trans('Error deleting maintenance contract'))
      }
    },
    // rest
    async loadData() {
      this.isLoading = true

      try {
        const data = await this.model.list()
        this.maintenanceContracts = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching maintenance contract', error)
        this.errorToast(this.$trans('Error loading maintenance contracts'))
        this.isLoading = false
      }
    }
  }
}
</script>
<style scoped>
table.totals tr:first-child td {
  border-top: none;
}
</style>
