<template>
  <div class="mt-4">

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
      id="delete-stock-location-modal"
      ref="delete-stock-location-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this stock location?') }}</p>
    </b-modal>

    <b-pagination
      v-if="this.stockLocationModel.count > 20"
      class="pt-4"
      v-model="currentPage"
      :total-rows="this.stockLocationModel.count"
      :per-page="this.stockLocationModel.perPage"
      aria-controls="stock-location-table"
    ></b-pagination>

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
        <div class="float-right">
          <b-button-toolbar>
            <b-button-group class="mr-1">
              <ButtonLinkAdd
                router_name="stock-location-add"
                v-bind:title="$trans('New stock location')"
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
      <template #cell(name)="data">
        <router-link :to="{name: 'stock-location-view', params: {pk: data.item.id}}">{{ data.item.name }}</router-link>
      </template>
      <template #cell(icons)="data">
        <div class="h2 float-right">
          <IconLinkEdit
            router_name="stock-location-edit"
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
import stockLocationModel from '@/models/inventory/StockLocation.js'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '@/components/ButtonLinkAdd.vue'

export default {
  components: {
    IconLinkEdit,
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
  },
  data() {
    return {
      currentPage: 1,
      searchQuery: null,
      stockLocationModel,
      stockLocationPk: null,
      isLoading: false,
      stockLocations: [],
      fields: [
        {key: 'name', label: this.$trans('Name'), sortable: true},
        {key: 'identifier', label: this.$trans('Identifier'), sortable: true},
        {key: 'inventory', label: this.$trans('Inventory'), sortable: true},
        {key: 'created', label: this.$trans('Created'), sortable: true},
        {key: 'modified', label: this.$trans('Modified'), sortable: true},
        {key: 'icons'}
      ],
    }
  },
  watch: {
    currentPage: function(val) {
      this.stockLocationModel.currentPage = val
      this.loadData()
    }
  },
  created() {
    this.currentPage = this.stockLocationModel.currentPage
    this.loadData()
  },
  methods: {
    handleSearchOk(bvModalEvt) {
      bvModalEvt.preventDefault()
      this.handleSearchSubmit()
    },
    handleSearchSubmit() {
      this.$refs['search-modal'].hide()

      stockLocationModel.setSearchQuery(this.searchQuery)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    showDeleteModal(id) {
      this.stockLocationPk = id
      this.$refs['delete-stock-location-modal'].show()
    },
    async doDelete() {
      try {
        await stockLocationModel.delete(this.stockLocationPk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Stock location has been deleted'))
        this.loadData()
      } catch(error) {
        console.log('Error deleting stock location', error)
        this.errorToast(this.$trans('Error deleting stock location'))
      }
    },
    async loadData() {
      this.isLoading = true;

      try {
        const data = await stockLocationModel.list()
        this.stockLocations = data.results
        this.isLoading = false
      } catch(error){
        console.log('error fetching stock locations', error)
        this.errorToast(this.$trans('Error loading stock locations'))
        this.isLoading = false
      }
    }
  }
}
</script>
