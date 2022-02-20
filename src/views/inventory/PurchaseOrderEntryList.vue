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
      id="delete-purchaseorder-entry-modal"
      ref="delete-purchaseorder-entry-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this entry?') }}</p>
    </b-modal>

    <b-pagination
      v-if="this.purchaseorderEntryModel.count > 20"
      class="pt-4"
      v-model="currentPage"
      :total-rows="this.purchaseorderEntryModel.count"
      :per-page="this.purchaseorderEntryModel.perPage"
      aria-controls="purchaseorder-entry-table"
    ></b-pagination>

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
          <b-button-toolbar>
            <b-button-group class="mr-1">
              <ButtonLinkAdd
                router_name="purchaseorder-entry-add"
                v-bind:title="$trans('New entry')"
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
      <template #cell(icons)="data">
        <div class="h2 float-right">
          <IconLinkEdit
            router_name="purchaseorder-entry-edit"
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
import purchaseorderEntryModel from '@/models/inventory/PurchaseOrderEntry.js'
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
      purchaseorderEntryModel,
      entryPk: null,
      isLoading: false,
      entries: [],
      fields: [
        {key: 'order_id', label: this.$trans('Order ID'), sortable: true},
        {key: 'supplier', label: this.$trans('Supplier'), sortable: true},
        {key: 'material_name', label: this.$trans('Material'), sortable: true},
        {key: 'amount', label: this.$trans('Amount')},
        {key: 'entry_date', label: this.$trans('Entry date')},
        {key: 'stock_location_name', label: this.$trans('Moved to location')},
        {key: 'icons'}
      ],
    }
  },
  watch: {
    currentPage: function(val) {
      this.purchaseorderEntryModel.currentPage = val
      this.loadData()
    }
  },
  created() {
    this.currentPage = purchaseorderEntryModel.currentPage
    this.loadData()
  },
  methods: {
    handleSearchOk(bvModalEvt) {
      bvModalEvt.preventDefault()
      this.handleSearchSubmit()
    },
    handleSearchSubmit() {
      this.$refs['search-modal'].hide()

      purchaseorderEntryModel.setSearchQuery(this.searchQuery)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    showDeleteModal(id) {
      this.entryPk = id
      this.$refs['delete-purchaseorder-entry-modal'].show()
    },
    doDelete() {
      return this.$store.dispatch('getCsrfToken').then((token) => {
        purchaseorderEntryModel.delete(token, this.entryPk).then(() => {
          this.infoToast(this.$trans('Deleted'), this.$trans('Entry has been deleted'))
          this.loadData()
        }).catch(() => {
          this.errorToast(this.$trans('Error deleting entry'))
        })
      })
    },
    loadData() {
      this.isLoading = true;

      purchaseorderEntryModel.list()
        .then((data) => {
          this.entries = data.results
          this.isLoading = false
        })
        .catch((error) => {
          console.log('error fetching entries', error)
          this.errorToast(this.$trans('Error loading entries'))
          this.isLoading = false
        })
    }
  }
}
</script>
