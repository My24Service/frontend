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
      id="delete-supplier-modal"
      ref="delete-supplier-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this supplier?') }}</p>
    </b-modal>

    <b-pagination
      v-if="this.supplierModel.count > 20"
      class="pt-4"
      v-model="currentPage"
      :total-rows="this.supplierModel.count"
      :per-page="this.supplierModel.perPage"
      aria-controls="supplier-table"
    ></b-pagination>

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
        <div class="text-center text-danger my-2">
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

  </div>
</template>

<script>
import supplierModel from '@/models/inventory/Supplier.js'
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
      supplierModel,
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
  watch: {
    currentPage: function(val) {
      this.supplierModel.currentPage = val
      this.loadData()
    }
  },
  created() {
    this.currentPage = this.supplierModel.currentPage
    this.loadData()
  },
  methods: {
    handleSearchOk(bvModalEvt) {
      bvModalEvt.preventDefault()
      this.handleSearchSubmit()
    },
    handleSearchSubmit() {
      this.$refs['search-modal'].hide()

      supplierModel.setSearchQuery(this.searchQuery)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    showDeleteModal(id) {
      this.supplierPk = id
      this.$refs['delete-supplier-modal'].show()
    },
    doDelete() {
      return this.$store.dispatch('getCsrfToken').then((token) => {
        supplierModel.delete(token, this.supplierPk).then(() => {
          this.flashMessage.show({
            status: 'info',
            title: this.$trans('Deleted'),
            message: this.$trans('Supplier has been deleted')
          })
          this.loadData()
        }).catch(() => {
          this.flashMessage.show({
            status: 'error',
            title: this.$trans('Error'),
            message: this.$trans('Error deleting supplier')
          })
        })
      })
    },
    loadData() {
      this.isLoading = true;

      supplierModel.list().then((data) => {
        this.suppliers = data.results
        this.isLoading = false
      }).catch((error) => {
        console.log('error fetching suppliers', error);
        this.flashMessage.show({
          status: 'error',
          title: this.$trans('Error'),
          message: this.$trans('Error loading suppliers')
        })
        this.isLoading = false
      })
    }
  }
}
</script>
