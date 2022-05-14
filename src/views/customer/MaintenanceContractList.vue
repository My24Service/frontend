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
      id="delete-maintenance-contract-modal"
      ref="delete-maintenance-contract-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this maintenance contract?') }}</p>
    </b-modal>

    <b-pagination
      v-if="this.maintenanceContractModel.count > 20"
      class="pt-4"
      v-model="currentPage"
      :total-rows="this.maintenanceContractModel.count"
      :per-page="this.maintenanceContractModel.perPage"
      aria-controls="maintenance-contract-table"
    ></b-pagination>

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
      <template #cell(id)="data">
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
  </div>
</template>

<script>
import maintenanceContractModel from '@/models/customer/MaintenanceContract.js'

import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '@/components/ButtonLinkAdd.vue'

export default {
  name: 'MaintenanceContractList',
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
      maintenanceContractModel,
      isLoading: false,
      maintenanceContracts: [],
      maintenanceContractFields: [
        {key: 'customer_view.name', label: this.$trans('Customer'), sortable: true},
        {key: 'contract_value', label: this.$trans('Contract value'), sortable: true},
        {key: 'remarks', label: this.$trans('Remarks'), sortable: true},
        {key: 'icons'}
      ],
    }
  },
  watch: {
    currentPage: function(val) {
      this.maintenanceContractModel.currentPage = val
      this.loadData()
    }
  },
  created() {
    this.currentPage = this.maintenanceContractModel.currentPage
    this.loadData()
  },
  methods: {
    handleSearchOk(bvModalEvt) {
      bvModalEvt.preventDefault()
      this.handleSearchSubmit()
    },
    handleSearchSubmit() {
      this.$refs['search-modal'].hide()

      maintenanceContractModel.setSearchQuery(this.searchQuery)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    showDeleteModal(id) {
      this.pk = id
      this.$refs['delete-maintenance-contract-modal'].show()
    },
    async doDelete(id) {
      try {
        await maintenanceContractModel.delete(this.pk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Maintenance contract has been deleted'))
        this.loadData()
      } catch() {
        this.errorToast(this.$trans('Error deleting maintenance contract'))
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        const data = await maintenanceContractModel.list()
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
