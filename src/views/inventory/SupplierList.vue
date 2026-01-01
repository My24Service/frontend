<template>
  <div class="app-page">
    <header>
      <div class='page-title'>
        <h3><b-icon icon="shop"></b-icon>{{ $trans("Suppliers") }}</h3>
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
          <router-link :to="{name: 'supplier-add' }" class="btn primary">{{$trans('Add supplier')}}</router-link>
        </BButton-toolbar>
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
      :model_name="$trans('Supplier')"
    />
  </div>
</template>

<script>
import supplierModel from '@/models/inventory/Supplier.js'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import SearchModal from '@/components/SearchModal.vue'
import Pagination from "@/components/Pagination.vue"
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";
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
      model: supplierModel,
      supplierPk: null,
      isLoading: false,
      suppliers: [],
      fields: [
        {key: 'name', label: $trans('Name'), sortable: true},
        {key: 'address', label: $trans('Address'), sortable: true},
        {key: 'city', label: $trans('City'), sortable: true},
        {key: 'tel', label: $trans('Tel.')},
        {key: 'mobile', label: $trans('Mobile')},
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
        infoToast(create, $trans('Deleted'), $trans('Supplier has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting supplier', error)
        errorToast(create, $trans('Error deleting supplier'))
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
        errorToast(create, $trans('Error loading suppliers'))
        this.isLoading = false
      }
    }
  }
}
</script>
