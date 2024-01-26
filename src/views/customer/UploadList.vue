<template>
  <div class="app-grid">

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-customer-upload-modal"
      ref="delete-customer-upload-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this upload?') }}</p>
    </b-modal>

    <div class="overflow-auto">
      <Pagination
        v-if="!isLoading"
        :model="this.service"
        :model_name="$trans('Upload')"
      />

      <b-table
        small
        :busy='isLoading'
        :fields="fields"
        :items="uploads"
        responsive="md"
        class="data-table"
        sort-icon-left
      >
        <template #table-busy>
          <div class="text-center text-danger my-2">
            <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
            <strong>{{ $trans('Loading...') }}</strong>
          </div>
        </template>
        <template #head(icons)="data">
          <div class="float-right">
            <b-button-toolbar>
              <b-button-group class="mr-1">
                <ButtonLinkAdd
                  router_name="customer-upload-add"
                  v-bind:title="$trans('New upload')"
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
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkEdit
              router_name="customer-upload-edit"
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
  </div>
</template>

<script>
import {CustomerUploadService} from '@/models/customer/Upload.js'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '@/components/ButtonLinkAdd.vue'
import SearchModal from '@/components/SearchModal.vue'
import Pagination from "@/components/Pagination.vue"

export default {
  name: 'UploadList',
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
      uploadPk: null,
      isLoading: false,
      service: new CustomerUploadService(),
      uploads: [],
      fields: [
        {key: 'file', label: this.$trans('File')},
        {key: 'created', label: this.$trans('Created')},
        {key: 'modified', label: this.$trans('Modified')},
        {key: 'icons'},
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
      this.uploadPk = id
      this.$refs['delete-customer-upload-modal'].show()
    },
    async doDelete() {
      try {
        await this.service.delete(this.uploadPk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Upload has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('error deleting upload', error)
        this.errorToast(this.$trans('Error deleting upload'))
      }
    },
    // rest
    async loadData() {
      this.isLoading = true

      try {
        const data = await this.service.list()
        this.uploads = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching uploads', error)
        this.errorToast(this.$trans('Error loading uploads'))
        this.isLoading = false
      }
    }
  }
}
</script>
