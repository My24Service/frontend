<template>
  <div class="app-grid">
    <b-breadcrumb class="mt-2" :items="breadcrumb"></b-breadcrumb>

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-quotation-document-modal"
      ref="delete-quotation-document-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this document?') }}</p>
    </b-modal>

    <div class="overflow-auto">
      <Pagination
        v-if="!isLoading"
        :model="this.model"
        :model_name="$trans('Document')"
      />
      <b-table
        small
        id="document-table"
        :busy='isLoading'
        :fields="fields"
        :items="documents"
        responsive="md"
        class="data-table"
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
                  router_name="quotation-document-add"
                  v-bind:router_params="{quotationPk: data.field.value}"
                  v-bind:title="$trans('New document')"
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
              router_name="quotation-document-edit"
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
import documentService from '@/models/quotations/Document.js'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '@/components/ButtonLinkAdd.vue'
import SearchModal from '@/components/SearchModal.vue'
import Pagination from "@/components/Pagination.vue"

export default {
  name: 'DocumentList',
  components: {
    IconLinkEdit,
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
    SearchModal,
    Pagination,
  },
  props: {
    quotationPk: {
      type: [String, Number],
      default: null
    },
  },
  data() {
    return {
      model: documentService,
      searchQuery: null,
      breadcrumb: [
        {
          text: this.$trans('Quotations'),
          to: {name: 'quotation-list'}
        },
        {
          text: this.$trans('Documents'),
          active: true
        },
      ],
      documentPk: null,
      isLoading: false,
      documents: [],
      fields: [
        {key: 'name', label: this.$trans('Name')},
        {key: 'description', label: this.$trans('Description')},
        {key: 'file', label: this.$trans('File')},
        {key: 'icons', value: this.quotationPk},
      ]
    }
  },
  created () {
    documentService.setListArgs(`quotation=${this.quotationPk}`)
    this.model.currentPage = this.$route.query.page || 1
    this.loadData()
  },
  methods: {
    // search
    handleSearchOk(val) {
      this.$refs['search-modal'].hide()
      documentService.setSearchQuery(val)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    // delete
    showDeleteModal(id) {
      this.documentPk = id
      this.$refs['delete-quotation-document-modal'].show()
    },
    async doDelete() {
      this.isLoading = true
      try {
        await documentService.delete(this.documentPk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Document has been deleted'))
        this.loadData()
      } catch(error) {
        this.isLoading = false
        console.log('Error deleting document', error)
        this.errorToast(this.$trans('Error deleting document'))
      }
    },
    // rest
    async loadData() {
      this.isLoading = true

      try {
        const data = await documentService.list()
        this.documents = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching documents', error)
        this.errorToast(this.$trans('Error loading documents'))
        this.isLoading = false
      }
    }
  }
}
</script>
