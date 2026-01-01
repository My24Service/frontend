<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3><b-icon icon="receipt"></b-icon>{{ $trans('Entries') }}</h3>
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
          <router-link class="btn" :to="{name: 'purchaseorder-entry-add'}">{{ $trans('Add entry') }}</router-link>
        </b-button-toolbar>
      </div>
    </header>

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-purchaseorder-entry-modal"
      ref="delete-purchaseorder-entry-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this entry?') }}</p>
    </b-modal>

    <div class="panel overflow-auto">
      <b-table
        id="purchaseorder-entry-table"
        small
        :busy='isLoading'
        :fields="fields"
        :items="entries"
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
        <template #cell(order_id)="data">
          <router-link :to="{name: 'purchaseorder-entry-edit', params: {pk: data.item.pk}}">{{data.item.order_id}}</router-link>
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
<!--            <IconLinkEdit-->
<!--              router_name="purchaseorder-entry-edit"-->
<!--              v-bind:router_params="{pk: data.item.id}"-->
<!--              v-bind:title="$trans('Edit')"-->
<!--            />-->
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
      :model_name="$trans('Entry')"
    />
  </div>
</template>

<script>
import purchaseorderEntryModel from '@/models/inventory/PurchaseOrderEntry.js'
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
      model: purchaseorderEntryModel,
      entryPk: null,
      isLoading: false,
      entries: [],
      fields: [
        {key: 'order_id', label: $trans('Order ID'), sortable: true},
        {key: 'supplier', label: $trans('Supplier'), sortable: true},
        {key: 'material_name', label: $trans('Product'), sortable: true},
        {key: 'amount', label: $trans('Amount')},
        {key: 'entry_date', label: $trans('Entry date')},
        {key: 'stock_location_name', label: $trans('Moved to location')},
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
      this.entryPk = id
      this.$refs['delete-purchaseorder-entry-modal'].show()
    },
    async doDelete() {
      try {
        await this.model.delete(this.entryPk)
        infoToast(create, $trans('Deleted'), $trans('Entry has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting entry', error)
        errorToast(create, $trans('Error deleting entry'))
      }
    },
    // rest
    async loadData() {
      this.isLoading = true

      try {
        const data = await this.model.list()
        this.entries = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching entries', error)
        errorToast(create, $trans('Error loading entries'))
        this.isLoading = false
      }
    }
  }
}
</script>
