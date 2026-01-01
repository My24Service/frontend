<template>
  <div class="app-page">
    <header>
      <div class='page-title'>
        <h3>
          <b-icon icon="bookshelf"></b-icon>{{ $trans("Stock Locations") }}
        </h3>
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
          <router-link :to="{name: 'stock-location-add'}" class="btn">{{ $trans('Add stock location') }}</router-link>
        </b-button-toolbar>
      </div>
    </header>
    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-stock-location-modal"
      ref="delete-stock-location-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this stock location?') }}</p>
    </b-modal>

    <div class="panel overflow-auto">

      <b-table
        id="stock-location-table"
        small
        :busy='isLoading'
        :fields="fields"
        :items="stockLocations"
        responsive="md"
        class="data-table"
        sort-icon-left
      >
        <template #head(icons)="">
        </template>
        <template #table-busy>
          <div class="text-center text-danger my-2">
            <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
            <strong>{{ $trans('Loading...') }}</strong>
          </div>
        </template>
        <template #cell(name)="data">
          <router-link :to="{name: 'stock-location-view', params: {pk: data.item.id}}">{{ data.item.name }}</router-link>
        </template>
        <template #cell(show_in_stats)="data">
          <span v-if="data.item.show_in_stats">
            <b-icon-check-square-fill></b-icon-check-square-fill>
          </span>
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
      v-if="!isLoading"
      :model="this.model"
      :model_name="$trans('Location')"
    />
  </div>
</template>

<script>
import stockLocationModel from '@/models/inventory/StockLocation.js'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import SearchModal from '@/components/SearchModal.vue'
import Pagination from "@/components/Pagination.vue"
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast} from "@/utils";
const {create} = useToast()

export default {
  components: {
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    SearchModal,
    Pagination,
  },
  data() {
    return {
      searchQuery: null,
      model: stockLocationModel,
      stockLocationPk: null,
      isLoading: false,
      stockLocations: [],
      fields: [
        {key: 'name', label: this.$trans('Name'), sortable: true},
        {key: 'identifier', label: this.$trans('Identifier'), sortable: true},
        {key: 'inventory', label: this.$trans('Inventory'), sortable: true},
        {key: 'show_in_stats', label: this.$trans('In stats?'), sortable: true},
        {key: 'created', label: this.$trans('Created'), sortable: true},
        {key: 'modified', label: this.$trans('Modified'), sortable: true},
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
      this.stockLocationPk = id
      this.$refs['delete-stock-location-modal'].show()
    },
    async doDelete() {
      try {
        await this.model.delete(this.stockLocationPk)
        infoToast(create, this.$trans('Deleted'), this.$trans('Stock location has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting stock location', error)
        errorToast(create, this.$trans('Error deleting stock location'))
      }
    },
    // rest
    async loadData() {
      this.isLoading = true;

      try {
        const data = await this.model.list()
        this.stockLocations = data.results
        this.isLoading = false
      } catch(error){
        console.log('error fetching stock locations', error)
        errorToast(create, this.$trans('Error loading stock locations'))
        this.isLoading = false
      }
    }
  }
}
</script>
