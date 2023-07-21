<template>
  <div class="app-page">
    <header>
      <div class='page-title'>
        <h3>Suppliers</h3>
      </div>
    </header>
    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-supplier-modal"
      ref="delete-supplier-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this supplier?') }}</p>
    </b-modal>

    <div class="panel overflow-auto">

      <b-table
        id="supplier-table"
        small
        :busy='isLoading'
        :fields="fields"
        :items="suppliers"
        responsive="md"
        class="data-table"
        sort-icon-left
      >
        <template #head(icons)="">
          <div class="float-right">
            <b-button-toolbar>
              <b-button-group class="mr-1">
                <ButtonLinkAdd
                  router_name="supplier-add"
                  v-bind:title="$trans('New supplier')"
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
          <div class="text-center my-2">
            <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
            <strong>{{ $trans('Loading...') }}</strong>
          </div>
        </template>
        <template #cell(name)="data">
          <router-link :to="{name: 'supplier-view', params: {pk: data.item.id}}">{{ data.item.name }}</router-link>
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkEdit
              router_name="supplier-edit"
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
        :model_name="$trans('Supplier')"
      />
    </div>
  </div>
</template>

<script>
import supplierModel from '@/models/inventory/Supplier.js'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '@/components/ButtonLinkAdd.vue'
import SearchModal from '@/components/SearchModal.vue'
import Pagination from "@/components/Pagination.vue"

export default {
  components: {
    IconLinkEdit,
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
      model: supplierModel,
      supplierPk: null,
      isLoading: false,
      suppliers: [],
      fields: [
        {key: 'name', label: this.$trans('Name'), sortable: true},
        {key: 'address', label: this.$trans('Address'), sortable: true},
        {key: 'city', label: this.$trans('City'), sortable: true},
        {key: 'tel', label: this.$trans('Tel.')},
        {key: 'mobile', label: this.$trans('Mobile')},
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
      this.supplierPk = id
      this.$refs['delete-supplier-modal'].show()
    },
    async doDelete() {
      try {
        await this.model.delete(this.supplierPk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Supplier has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting supplier', error)
        this.errorToast(this.$trans('Error deleting supplier'))
      }
    },
    // rest
    async loadData() {
      this.isLoading = true;

      try {
        const data = await this.model.list()
        this.suppliers = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching suppliers', error)
        this.errorToast(this.$trans('Error loading suppliers'))
        this.isLoading = false
      }
    }
  }
}
</script>
