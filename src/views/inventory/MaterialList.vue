<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <b-icon icon="bookshelf"></b-icon>
          Materials
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
          <router-link :to="{name: 'material-add'}" class="btn">{{ $trans('Add material') }}</router-link>
        </b-button-toolbar>
      </div>
    </header>
    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-material-modal"
      ref="delete-material-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this material?') }}</p>
    </b-modal>

    <div class="panel overflow-auto">

      <b-table
        id="material-table"
        small
        :busy='isLoading'
        :fields="fields"
        :items="materials"
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
        <template #cell(show_name)="data">
          <router-link :to="{name: 'material-view', params: {pk: data.item.id}}">
            {{ data.item.show_name }}</router-link>
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
      :model_name="$trans('Material')"
    />
  </div>
</template>

<script>
import materialService from '../../models/inventory/Material.js'
import IconLinkDelete from '../../components/IconLinkDelete.vue'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '../../components/ButtonLinkAdd.vue'
import SearchModal from '../../components/SearchModal.vue'
import Pagination from "../../components/Pagination.vue"

export default {
  components: {
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
    SearchModal,
    Pagination,
  },
  data() {
    return {
      searchQuery: null,
      model: materialService,
      materialPk: null,
      isLoading: false,
      materials: [],
      fields: [
        {key: 'show_name', label: this.$trans('Name'), sortable: true, thAttr: {width: '25%'}},
        {key: 'identifier', label: this.$trans('Identifier'), sortable: true, thAttr: {width: '10%'}},
        {key: 'location', label: this.$trans('Location'), sortable: true, thAttr: {width: '10%'}},
        {key: 'price_purchase', label: this.$trans('Purchase price'), sortable: true, thAttr: {width: '10%'}},
        {key: 'price_selling', label: this.$trans('Selling price'), sortable: true, thAttr: {width: '10%'}},
        {key: 'supplier_name', label: this.$trans('Supplier'), sortable: true, thAttr: {width: '15%'}},
        {key: 'modified', label: this.$trans('Modified'), sortable: true, thAttr: {width: '10%'}},
        {key: 'icons', thAttr: {width: '10%'}}
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
      this.materialPk = id
      this.$refs['delete-material-modal'].show()
    },
    async doDelete() {
      try {
        await this.model.delete(this.materialPk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Material has been deleted'))
        this.loadData()
      } catch(error) {
        console.log('error deleting material', error)
        this.errorToast(this.$trans('Error deleting material'))
      }
    },
    // rest
    async loadData() {
      this.isLoading = true;

      try {
        const data = await this.model.list()
        this.materials = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching materials', error)
        this.errorToast(this.$trans('Error loading materials'))
        this.isLoading = false
      }
    }
  }
}
</script>
