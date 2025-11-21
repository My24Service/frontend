<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3><b-icon icon="shop-window"></b-icon>{{ $trans("Locations") }}</h3>
        <b-button-toolbar>
          <b-button-group class="mr-1">

            <ButtonLinkRefresh
              v-bind:method="function() { loadData() }"
              v-bind:title="$trans('Refresh')"
            />
            <ButtonLinkSearch
              v-bind:method="function() { showSearchModal() }"
            />
            <ButtonLinkDownload
              v-bind:method="function() { downloadList() }"
              v-bind:title="$trans('Download QR-codes')"
            />
          </b-button-group>
          <router-link :to="{name: newLink}" class="btn btn-primary">{{ $trans('Add location') }}</router-link>
        </b-button-toolbar>
      </div>
    </header>

    <div class="panel overflow-auto">
      <b-table
        id="location-table"
        small
        :busy='isLoading'
        :fields="fields"
        :items="locations"
        responsive="md"
        class="data-table"
        sort-icon-left
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
        <template #cell(name)="data">
          <router-link :to="{name: viewLink, params: {pk: parseInt(data.item.id)}}">
            {{ data.item.name }}
          </router-link>
        </template>
        <template #cell(customer)="data">
          <span v-if="data.item.customer_branch_view">
            {{ data.item.customer_branch_view.name }} <span class="dimmed">&middot; {{ data.item.customer_branch_view.city }}</span>
          </span>
          <span v-else>-</span>
        </template>
        <template #cell(created)="data">
          <small>{{ data.item.created }}</small>
        </template>
        <template #cell(modified)="data">
          <small>{{ data.item.modified }}</small>
        </template>
        <template #cell(branch)="data">
          <span v-if="data.item.customer_branch_view">
            <router-link :to="{name: 'company-branch-view', params: {pk: data.item.id}}">
              {{ data.item.customer_branch_view.name }} <span class="dimmed">&middot; {{ data.item.customer_branch_view.city }}</span>
            </router-link>
          </span>
          <span v-else>-</span>
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkEdit
              :router_name="editLink"
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
    <Pagination
      v-if="!isLoading && service"
      :model="service"
      :model_name="$trans('Location')"
    />

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-location-modal"
      ref="delete-location-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this location?') }}</p>
    </b-modal>
  </div>
</template>

<script>
import { LocationService } from '../../models/equipment/location.js'
import IconLinkEdit from '../../components/IconLinkEdit.vue'
import IconLinkDelete from '../../components/IconLinkDelete.vue'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '../../components/ButtonLinkAdd.vue'
import SearchModal from '../../components/SearchModal.vue'
import Pagination from "../../components/Pagination.vue"
import {componentMixin} from "../../utils";
import ButtonLinkDownload from "@/components/ButtonLinkDownload.vue";
import my24 from "@/services/my24";

export default {
  mixins: [componentMixin],
  components: {
    ButtonLinkDownload,
    IconLinkEdit,
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
    SearchModal,
    Pagination,
  },
  computed: {
    service() {
      return this.locationService
    },
    editLink() {
      if (this.hasBranches) {
        return 'equipment-location-edit'
      } else {
        return 'customers-location-edit'
      }
    },
    viewLink() {
      if (this.hasBranches) {
        return 'equipment-location-view'
      } else {
        return 'customers-location-view'
      }
    },
    newLink() {
      if (this.hasBranches) {
        return 'equipment-location-add'
      } else {
        return 'customers-location-add'
      }
    },
  },
  data() {
    return {
      searchQuery: null,
      locationService: new LocationService(),
      locationPk: null,
      isLoading: false,
      locations: [],
      fieldsCustomerPlanning: [
        {key: 'name', label: this.$trans('Name'), sortable: true},
        {key: 'customer', label: this.$trans('Customer')},
        {key: 'created', label: this.$trans('Created'), sortable: true},
        {key: 'modified', label: this.$trans('Modified'), sortable: true},
        {key: 'icons'}
      ],
      fieldsBranchPlanning: [
        {key: 'name', label: this.$trans('Name'), sortable: true},
        {key: 'branch', label: this.$trans('Branch')},
        {key: 'created', label: this.$trans('Created'), sortable: true},
        {key: 'modified', label: this.$trans('Modified'), sortable: true},
        {key: 'icons'}
      ],
      fieldsCustomerNonPlanning: [
        {key: 'name', label: this.$trans('Name'), sortable: true},
        {key: 'created', label: this.$trans('Created'), sortable: true},
        {key: 'modified', label: this.$trans('Modified'), sortable: true},
        {key: 'icons'}
      ],
      fieldsBranchNonPlanning: [
        {key: 'name', label: this.$trans('Name'), sortable: true},
        {key: 'created', label: this.$trans('Created'), sortable: true},
        {key: 'modified', label: this.$trans('Modified'), sortable: true},
        {key: 'icons'}
      ],
      fields: [],
    }
  },
  created() {
    this.locationService.resetListArgs()
    this.locationService.currentPage = this.$route.query.page || 1
    this.locationService.setSearchQuery(this.$route.query.q, !!!this.$route.query.page)
    if (this.$route.query.sort_field) {
      this.sortBy = this.$route.query.sort_field
      if (this.$route.query.sort_dir) {
        this.sortDesc = this.$route.query.sort_dir === 'desc'
      }
      this.locationService.setSorting(this.sortBy, this.sortDesc, !!!this.$route.query.page)
    }

    if (this.hasBranches) {
      if (this.isEmployee) {
        this.fields = this.fieldsBranchNonPlanning
      } else {
        this.fields = this.fieldsBranchPlanning
      }
    } else {
      if (this.isCustomer) {
        this.fields = this.fieldsCustomerNonPlanning
      } else {
        this.fields = this.fieldsCustomerPlanning
      }
    }
    this.loadData()
  },
  methods: {
    // download
    downloadList() {
      const url = this.locationService.getExportUrl()
      my24.downloadItemAuth(url, 'locations.xlsx', () => {})
    },
    // search
    async handleSearchOk(val) {
      this.$refs['search-modal'].hide()
      this.locationService.setSearchQuery(val)
      await this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    // delete
    showDeleteModal(id) {
      this.locationPk = id
      this.$refs['delete-location-modal'].show()
    },
    async doDelete() {
      try {
        await this.locationService.delete(this.locationPk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Location has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting location', error)
        this.errorToast(this.$trans('Error deleting location'))
      }
    },
    // rest
    async loadData() {
      this.isLoading = true;

      try {
        const data = await this.locationService.list()
        this.locations = data.results
        this.isLoading = false
      } catch(error){
        console.log('error fetching locations', error)
        this.errorToast(this.$trans('Error loading locations'))
        this.isLoading = false
      }
    }
  }
}
</script>
