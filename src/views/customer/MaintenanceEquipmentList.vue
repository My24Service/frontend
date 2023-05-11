<template>
  <div class="app-grid" v-if="!isLoading">

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-maintenance-equipment-modal"
      ref="delete-maintenance-equipment-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this maintenance equipment?') }}</p>
    </b-modal>

    <b-breadcrumb class="mt-2" :items="breadcrumb"></b-breadcrumb>
    <h2>{{ $trans('Maintenance equipment for ') }} {{ contract.customer_view.name }}</h2>

    <div class="overflow-auto">
      <Pagination
        v-if="!isLoading"
        :model="this.model"
        :model_name="$trans('equipment')"
      />

      <b-table
        id="maintenance-equipment-table"
        small
        :busy='isLoading'
        :fields="maintenanceEquipmentFields"
        :items="maintenanceEquipment"
        responsive="md"
        class="data-table"
        sort-icon-left
      >
        <template #head(icons)="">
          <div class="float-right">
            <b-button-toolbar>
              <b-button-group class="mr-1">
                <ButtonLinkAdd
                  router_name="maintenance-equipment-add"
                  :router_params="{contractPk: contract.id}"
                  v-bind:title="$trans('New maintenance equipment')"
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
        <template #cell(totals)="data">
          <table class="totals">
            <tr>
              <td><strong>{{ $trans('Created orders') }}</strong></td>
              <td>{{ data.item.created_orders}}</td>
            </tr>
            <tr>
              <td><strong>{{ $trans('# equipment in orders') }}</strong></td>
              <td>{{ data.item.num_order_equipment}}</td>
            </tr>
          </table>
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkEdit
              router_name="maintenance-equipment-edit"
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
import maintenanceEquipmentModel from '../../models/customer/MaintenanceEquipment.js'
import maintenanceContractModel from '../../models/customer/MaintenanceContract.js'

import IconLinkEdit from '../../components/IconLinkEdit.vue'
import IconLinkDelete from '../../components/IconLinkDelete.vue'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '../../components/ButtonLinkAdd.vue'
import SearchModal from '../../components/SearchModal.vue'
import Pagination from "../../components/Pagination.vue"

export default {
  name: 'MaintenanceEquipmentList',
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
      model: maintenanceEquipmentModel,
      isLoading: false,
      maintenanceEquipment: [],
      maintenanceEquipmentFields: [
        {key: 'equipment_name', label: this.$trans('Equipment'), sortable: true},
        {key: 'amount', label: this.$trans('Amount'), sortable: true},
        {key: 'times_per_year', label: this.$trans('Times/year'), sortable: true},
        {key: 'contract_value', label: this.$trans('Contract value'), sortable: true},
        {key: 'totals', label: this.$trans('Totals'), sortable: true},
        {key: 'icons'}
      ],
      breadcrumb: [
        {
          text: this.$trans('Maintenance contracts'),
          to: {name: 'maintenance-contracts'}
        },
        {
          text: this.$trans('Maintenance equipment'),
          active: true
        },
      ],
    }
  },
  async created() {
    this.isLoading = true
    this.model.currentPage = this.$route.query.page || 1

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
    // delete
    showDeleteModal(id) {
      this.pk = id
      this.$refs['delete-maintenance-equipment-modal'].show()
    },
    async doDelete() {
      try {
        await this.model.delete(this.pk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Maintenance equipment has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting maintenance equipment', error)
        this.errorToast(this.$trans('Error deleting maintenance equipment'))
      }
    },
    // rest
    async loadData() {
      try {
        this.contract = await maintenanceContractModel.detail(this.contractPk)
        this.model.setListArgs(`contract=${this.contractPk}`)
        const data = await this.model.list()
        this.maintenanceEquipment = data.results
      } catch(error) {
        console.log('error fetching maintenance equipment', error)
        this.errorToast(this.$trans('Error loading maintenance equipment'))
      }
    }
  }
}
</script>
