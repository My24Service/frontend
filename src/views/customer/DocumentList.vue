<template>
  <div class="app-grid">
    <b-breadcrumb class="mt-2" :items="breadcrumb"></b-breadcrumb>

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
      id="delete-customer-document-modal"
      ref="delete-customer-document-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this document?') }}</p>
    </b-modal>

    <b-table
      small
      :busy='isLoading'
      :fields="fields"
      :items="documents"
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
                router_name="customer-document-add"
                v-bind:router_params="{customerPk: data.field.value}"
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
            router_name="customer-document-edit"
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
import documentModel from '@/models/customer/Document.js'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '@/components/ButtonLinkAdd.vue'

export default {
  name: 'DocumentList',
  components: {
    IconLinkEdit,
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
  },
  props: {
    customerPk: {
      type: [String, Number],
      default: null
    },
  },
  data() {
    return {
      searchQuery: null,
      breadcrumb: [
        {
          text: this.$trans('Customers'),
          to: {name: 'customer-list'}
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
        {key: 'filename', label: this.$trans('File')},
        {key: 'icons', value: this.customerPk},
      ]
    }
  },
  created() {
    documentModel.setListArgs(`customer=${this.customerPk}`)
    this.currentPage = this.documentModel.currentPage
    this.loadDocuments()
  },
  methods: {
    handleSearchOk(bvModalEvt) {
      bvModalEvt.preventDefault()
      this.handleSearchSubmit()
    },
    handleSearchSubmit() {
      this.$refs['search-modal'].hide()

      documentModel.setSearchQuery(this.searchQuery)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    showDeleteModal(id) {
      this.documentPk = id
      this.$refs['delete-customer-document-modal'].show()
    },
    doDelete(id) {
      return this.$store.dispatch('getCsrfToken').then((token) => {
        documentModel.delete(token, this.documentPk).then(() => {
          this.flashMessage.show({
            status: 'info',
            title: this.$trans('Deleted'),
            message: this.$trans('Document has been deleted')
          })

          this.loadDocuments()
        }).catch(() => {
          this.flashMessage.show({
            status: 'error',
            title: this.$trans('Error'),
            message: this.$trans('Error deleting document')
          })
        })
      })
    },
    async loadDocuments() {
      this.isLoading = true

      documentModel.list().then((data) => {
        this.documents = data.results
        this.isLoading = false
      }).catch((error) => {
        console.log('error fetching documents', error)
        this.flashMessage.show({
          status: 'error',
          title: this.$trans('Error'),
          message: this.$trans('Error loading documents')
        })

        this.isLoading = false
      })
    }
  }
}
</script>
