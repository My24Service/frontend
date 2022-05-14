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
      id="delete-material-modal"
      ref="delete-material-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this material?') }}</p>
    </b-modal>

    <b-pagination
      v-if="this.materialModel.count > 20"
      class="pt-4"
      v-model="currentPage"
      :total-rows="this.materialModel.count"
      :per-page="this.materialModel.perPage"
      aria-controls="material-table"
    ></b-pagination>

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
          <b-button-toolbar>
            <b-button-group class="mr-1">
              <ButtonLinkAdd
                router_name="material-add"
                v-bind:title="$trans('New material')"
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
      <template #cell(show_name)="data">
        <router-link :to="{name: 'material-view', params: {pk: data.item.id}}">{{ data.item.show_name }}</router-link>
      </template>
      <template #cell(icons)="data">
        <div class="h2 float-right">
          <IconLinkEdit
            router_name="material-edit"
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
import materialModel from '@/models/inventory/Material.js'
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
      materialModel,
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
  watch: {
    currentPage: function(val) {
      this.materialModel.currentPage = val
      this.loadData()
    }
  },
  created() {
    this.currentPage = this.materialModel.currentPage
    this.loadData()
  },
  methods: {
    handleSearchOk(bvModalEvt) {
      bvModalEvt.preventDefault()
      this.handleSearchSubmit()
    },
    handleSearchSubmit() {
      this.$refs['search-modal'].hide()

      materialModel.setSearchQuery(this.searchQuery)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    showDeleteModal(id) {
      this.materialPk = id
      this.$refs['delete-material-modal'].show()
    },
    async doDelete() {
      try {
        await materialModel.delete(this.materialPk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Material has been deleted'))
        this.loadData()
      } catch(error) {
        console.log('error deleting material', error)
        this.errorToast(this.$trans('Error deleting material'))
      }
    },
    async loadData() {
      this.isLoading = true;

      try {
        const data = await materialModel.list()
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
