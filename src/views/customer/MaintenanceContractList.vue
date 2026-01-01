<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3><IBiFileEarmarkLock></IBiFileEarmarkLock> {{ $trans('Maintenance contracts') }}</h3>
        <BButton-toolbar>
          <BButton-group class="mr-1">
            <ButtonLinkRefresh
              v-bind:method="function() { loadData() }"
              v-bind:title="$trans('Refresh')"
            />
            <ButtonLinkSearch
              v-bind:method="function() { showSearchModal() }"
            />
          </BButton-group>
          <router-link :to="{name: 'maintenance-contract-add'}" class="btn primary">
            {{ $trans('Add contract') }}
          </router-link>
        </BButton-toolbar>
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
        <template #table-busy>
          <div class="text-center my-2">
            <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
            <strong>{{ $trans('Loading...') }}</strong>
          </div>
        </template>
        <template #cell(sum_tariffs)="data">
          <span v-if="data.item.sum_tariffs_dinero">
            {{ data.item.sum_tariffs_dinero.toFormat('$0.00') }}
          </span>
        </template>
        <template #cell(name)="data">
          <router-link :to="{name: 'maintenance-contract-view', params: {pk: data.item.id}}">
            <span v-if="data.item.name">
              {{ data.item.name }}
            </span>
          </router-link>
        </template>
        <template #cell(totals)="data">
          <strong v-if="data.item.created_orders">{{ data.item.created_orders}} </strong>
          <span v-else class="dimmed">0 </span>
          <small class="dimmed">{{ $trans('created orders') }}</small>
          &nbsp;
          <strong v-if="data.item.num_equipment">{{ data.item.num_equipment}} </strong>
          <span v-else class="dimmed">0 </span>
          <small class="dimmed">{{ $trans('contract equipment') }}</small>
          &nbsp;
          <strong v-if="data.item.num_order_equipment">{{ data.item.num_order_equipment}} </strong>
          <span v-else class="dimmed">0 </span>
          <small class="dimmed">{{ $trans('equipment in orders') }}</small>
        </template>
        <template #cell(customer_view_name)="data">
          {{ data.item.customer_view.name }}
        </template>
        <template #cell(created)="data">
          <small>{{ data.item.created }}</small>
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
        v-if="!isLoading && this.maintenanceContractService"
        :model="this.maintenanceContractService"
        :model_name="$trans('Contract')"
      />
    </div>

  </div>
</template>

<script>
import { MaintenanceContractService } from '@/models/customer/MaintenanceContract'
import IconLinkDelete from '../../components/IconLinkDelete.vue'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import SearchModal from '../../components/SearchModal.vue'
import Pagination from "../../components/Pagination.vue"
import IconLinkEdit from "@/components/IconLinkEdit.vue";
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";

export default {
  setup() {
    const {create} = useToast()

    // expose to template and other options API hooks
    return {
      create
    }
  },
  name: 'MaintenanceContractList',
  components: {
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    SearchModal,
    Pagination,
    IconLinkEdit
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
      isLoading: true,
      maintenanceContracts: [],
      maintenanceContractFields: [
        {key: 'name', label: $trans('Contract name'), sortable: true},
        {key: 'customer_view_name', label: $trans('Customer'), sortable: true},
        {key: 'sum_tariffs', label: $trans('Contract value'), sortable: true},
        {key: 'remarks', label: $trans('Remarks'), sortable: true},
        {key: 'created', label: $trans('Created'), sortable: true},
        {key: 'icons'}
      ],
      maintenanceContractService: new MaintenanceContractService(),
    }
  },
  async created() {
    this.maintenanceContractService.currentPage = this.$route.query.page || 1
    await this.loadData()
  },
  methods: {
    // search
    handleSearchOk(val) {
      this.$refs['search-modal'].hide()
      this.maintenanceContractService.setSearchQuery(val)
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
        await this.maintenanceContractService.delete(this.pk)
        infoToast(create, $trans('Deleted'), $trans('Maintenance contract has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting maintenance contract', error)
        errorToast(create, $trans('Error deleting maintenance contract'))
      }
    },
    // rest
    async loadData() {
      this.isLoading = true

      try {
        const data = await this.maintenanceContractService.list()
        this.maintenanceContracts = data.results.map(
          (m) => new this.maintenanceContractService.model(
            {...m, sum_tariffs_currency: this.$store.getters.getDefaultCurrency}
          ))
        this.isLoading = false
      } catch(error) {
        console.log('error fetching maintenance contract', error)
        errorToast(create, $trans('Error loading maintenance contracts'))
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
