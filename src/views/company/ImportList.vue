<template>
  <div class="app-page">

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-company-import-modal"
      ref="delete-company-import-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this import?') }}</p>
    </b-modal>

    <header>
      <div class="page-title">
        <h3>
          <b-icon icon="file-arrow-down"></b-icon> {{ $trans("Imports") }}
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
          <router-link :to="{name: 'company-import-add'}" class="btn">
            <b-icon icon="file-arrow-down"></b-icon>
            {{$trans('Add import')}}
          </router-link>
        </b-button-toolbar>
      </div>
    </header>

    <div class="app-detail panel overflow-auto">
      <b-table
        small
        :busy='isLoading'
        :fields="fields"
        :items="imports"
        responsive="md"
        class="data-table"
        sort-icon-left
      >
        <template #cell(result_inserts)="data">
          <span v-for="(inserts, model_type, index) of data.item.result_inserts" :key="index">
            {{ model_type }}: {{ inserts }}
          </span>
        </template>
        <template #cell(file)="data">
          <router-link :to="{name: 'company-import-preview', params: {pk: data.item.id}}">
            {{ data.item.file.split('/')[data.item.file.split('/').length-1] }}
          </router-link>
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkEdit
              router_name="company-import-edit"
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
      v-if="!isLoading"
      :model="this.service"
      :model_name="$trans('Import')"
    />

  </div>
</template>

<script>
import {ImportService} from '../../models/company/Import.js'
import IconLinkEdit from '../../components/IconLinkEdit.vue'
import IconLinkDelete from '../../components/IconLinkDelete.vue'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '../../components/ButtonLinkAdd.vue'
import SearchModal from '../../components/SearchModal.vue'
import Pagination from "../../components/Pagination.vue"

export default {
  name: 'ImportList',
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
      importPk: null,
      isLoading: false,
      service: new ImportService(),
      imports: [],
      fields: [
        {key: 'file', label: this.$trans('File')},
        {key: 'result_inserts', label: this.$trans('created')},
        {key: 'created', label: this.$trans('Created')},
        {key: 'modified', label: this.$trans('Modified')},
        {key: 'icons', label: ''},
      ]
    }
  },
  created() {
    this.service.currentPage = this.$route.query.page || 1
    this.loadData()
  },
  methods: {
    // search
    handleSearchOk(val) {
      this.$refs['search-modal'].hide()
      this.service.setSearchQuery(val)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    // delete
    showDeleteModal(id) {
      this.importPk = id
      this.$refs['delete-company-import-modal'].show()
    },
    async doDelete() {
      try {
        await this.service.delete(this.importPk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Import has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('error deleting import', error)
        this.errorToast(this.$trans('Error deleting import'))
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        const data = await this.service.list()
        this.imports = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching imports', error)
        this.errorToast(this.$trans('Error loading imports'))
        this.isLoading = false
      }
    }
  }
}
</script>
