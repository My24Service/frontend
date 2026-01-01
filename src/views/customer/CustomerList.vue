<template>
  <div class="app-page">
    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-customer-modal"
      ref="delete-customer-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this customer?') }}</p>
    </b-modal>

    <header>
      <div class="page-title">
        <h3>
          <b-icon icon="building"></b-icon> {{ $trans("Customers") }}
        </h3>
        <BButton-toolbar>
          <BButton-group class="mr-1">

            <ButtonLinkRefresh
              v-bind:method="function() { loadData() }"
              v-bind:title="$trans('Refresh')"
            />
            <ButtonLinkSearch
              v-bind:method="function() { showSearchModal() }"
            />
            <ButtonLinkDownload
              v-bind:method="function() { downloadList() }"
              v-bind:title="$trans('Download')"
            />
          </BButton-group>
          <router-link :to="{name: 'customer-add'}" class="btn"><b-icon icon="building"></b-icon>{{$trans('Add customer')}}</router-link>
        </BButton-toolbar>
      </div>
    </header>

    <div class="app-detail panel overflow-auto">

      <b-table
        id="customer-table"
        small
        :busy='isLoading'
        :fields="customerFields"
        :items="customers"
        responsive="md"
        class="data-table"
        :no-local-sorting="true"
        @sort-changed="sortingChanged"
        :sort-by="sortBy"
        :sort-desc="sortDesc"
        sort-icon-left
        :tbody-tr-class="rowClass"
      >
        <template #head(icons)="">
          <div class="float-right">

          </div>
        </template>
        <template #table-busy>
          <div class="text-center my-2">
            <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
            <strong>{{ $trans('Loading...') }}</strong>
          </div>
        </template>
        <template #cell(id)="data">
          <div v-if="data.item.branch_view" class="listing-item">
            <router-link :to="{name: 'customer-view', params: {pk: data.item.id}}">
              {{ data.item.branch_view.name }}, {{ data.item.branch_view.city }}, {{ data.item.branch_view.country_code }}
              (<span class="branch">{{ $trans("Branch") }}</span>)
            </router-link><br/>
            {{ $trans('Customer ID') }}: {{ data.item.customer_id }}<br/>
            {{ data.item.branch_view.address }}<br/>
            {{ data.item.branch_view.country_code }}-{{ data.item.branch_view.postal }}<br/>
            <span v-if="data.item.branch_view.contact && data.item.branch_view.contact.trim() !== ''">
                <b>{{ $trans('Contact') }}</b>: {{ data.item.branch_view.contact }}<br/>
            </span>
            <span v-if="data.item.branch_view.email">
              {{ $trans('Email') }}: <BLink class="px-1" v-bind:href="`mailto:${data.item.branch_view.email}`">{{ data.item.branch_view.email }}</BLink><br/>
            </span>
            <span v-if="data.item.branch_view.tel && data.item.branch_view.tel.trim() !== ''">
                <b>{{ $trans('Tel') }}</b>: {{ data.item.branch_view.tel }}<br/>
            </span>
            <span v-if="data.item.branch_view.mobile && data.item.branch_view.mobile.trim() !== ''">
                <b>{{ $trans('Mobile') }}</b>: {{ data.item.branch_view.mobile }}<br/>
            </span>
          </div>
          <span v-if="!data.item.branch_view" class="listing-item" :title="`${$trans('Customer ID:')} ${data.item.customer_id}`" >
            <router-link :to="{name: 'customer-view', params: {pk: data.item.id}}">{{ data.item.name }}</router-link>
          </span>
        </template>
        <template #cell(contract)="data">
          <span v-if="data.item.maintenance_contract && data.item.maintenance_contract.trim() != ''">
            <b>{{ data.item.maintenance_contract }}</b> <small>{{ $trans('Maintenance contract') }}</small>
          </span> &nbsp;
          <span v-if="data.item.standard_hours_txt !== '0:00'">
            <b>{{ data.item.standard_hours_txt }}</b> <small class="dimmed">{{ $trans('Standard hours') }}</small>
          </span>
        </template>
        <template #cell(remarks)="data">
          <span v-if="data.item.remarks && data.item.remarks.trim() != ''" :title="data.item.remarks">
            <b-icon icon="info-square"></b-icon>
            <small> {{ data.item.remarks }}</small>
          </span>
        </template>

        <template #cell(contact)="data">
          {{  data.item.contact}}
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkDelete
              v-bind:title="$trans('Delete')"
              v-bind:method="function() { showDeleteModal(data.item.id) }"
            />
          </div>
        </template>
      </b-table>
    </div>
    <Pagination
      v-if="!isLoading && service"
      :model="service"
      :model_name="$trans('Customer')"
    />
  </div>
</template>

<script>
import {CustomerService} from '@/models/customer/Customer'
import IconLinkDelete from '../../components/IconLinkDelete.vue'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import SearchModal from '../../components/SearchModal.vue'
import ButtonLinkDownload from "../../components/ButtonLinkDownload";
import Pagination from "../../components/Pagination.vue"
import my24 from "../../services/my24";
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";
const {create} = useToast()

export default {
  name: 'CustomerList',
  components: {
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkDownload,
    SearchModal,
    Pagination,
  },
  computed: {
    service() {
      return this.customerService
    },
  },
  data() {
    return {
      pk: null,
      searchQuery: null,
      customerService: new CustomerService(),
      isLoading: false,
      customers: [],
      customerFields: [
        {key: 'id', label: $trans('Company'), sortable: true },
        {key: 'contract', label: ''},
        {key: 'city', label: ''},
        {key: 'num_orders', label: $trans('Orders'), sortable: true, },
        {key: 'remarks', label: $trans('Remarks'), tdAttr: {style: 'max-width: 20ch; white-space: nowrap'}},
        {key: 'contact', label: $trans('Contact')},
        {key: 'icons', thAttr: {width: '15%'}}
      ],
      sortBy: 'name',
      sortDesc: false,
    }
  },
  created() {
    // this.model.currentPage = this.$route.query.page || 1
    // this.model.setSearchQuery(this.$route.query.q, !!!this.$route.query.page)
    this.customerService.resetListArgs()
    this.customerService.currentPage = this.$route.query.page || 1
    this.customerService.setSearchQuery(this.$route.query.q, !!!this.$route.query.page)
    if (this.$route.query.sort_field) {
      this.sortBy = this.$route.query.sort_field
      if (this.$route.query.sort_dir) {
        this.sortDesc = this.$route.query.sort_dir === 'desc'
      }
      this.customerService.setSorting(this.sortBy, this.sortDesc, !!!this.$route.query.page)
    }

    this.loadData()
  },
  methods: {
    // download
    downloadList() {
      if (confirm($trans('Are you sure you want to export all customers?'))) {
        const url = this.customerService.getExportUrl()
        my24.downloadItemAuth(url, 'customers.xlsx')
      }
    },
    // sorting
    async sortingChanged(ctx) {
      // set sorting and reset current page
      this.customerService.setSorting(ctx.sortBy, ctx.sortDesc, true)
      const query = {
        ...this.$route.query,
        ...this.customerService.getQueryArgs()
      }

      this.$router.push({ query }).catch(e => {})
      // await this.loadData()
    },
    // search
    async handleSearchOk(val) {
      this.$refs['search-modal'].hide()
      this.customerService.setSearchQuery(val)
      const query = {
        ...this.$route.query,
        ...this.customerService.getQueryArgs()
      }

      this.$router.push({ query }).catch(e => {})
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    // delete
    showDeleteModal(id) {
      this.pk = id
      this.$refs['delete-customer-modal'].show()
    },
    async doDelete() {
      try {
        await this.customerService.delete(this.pk)
        infoToast(create, $trans('Deleted'), $trans('Customer has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting customer', error)
        errorToast(create, $trans('Error deleting customer'))
      }
    },
    // rest
    rowClass(item, type) {
      if (item && type === 'row') {
        return item.branch_view ? 'branch' : ''
      }
    },
    async loadData() {
      this.isLoading = true;

      try {
        const data = await this.customerService.list()
        this.customers = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching customers', error)
        errorToast(create, $trans('Error loading customers'))
        this.isLoading = false
      }
    }
  }
}
</script>
<style>
tr.branch {
  background-color: #f6cdd1;
}
</style>
