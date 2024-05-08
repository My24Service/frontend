<template>
  <details open>
    <summary class="flex-columns space-between">
      <h6>{{ $trans('Documents') }}</h6>
      <b-icon-paperclip></b-icon-paperclip>
    </summary>

    <!-- list -->
    <div
      v-if="!showForm"
    >
      <p v-if="!documentService.collection.length">
        <i>{{ $trans("No documents") }}</i>
      </p>
      <b-table
        small
        id="document-table"
        :busy='isLoading'
        :fields="isView ? fieldsView : fields"
        :items="documentService.collection"
        responsive="md"
        class="data-table"
        v-else
      >
        <template #cell(name)="data">
          <b-link v-bind:href="data.item.url" target="_blank">
            {{ data.item.name }} <b-icon-download font-scale=".8"></b-icon-download>
          </b-link>
        </template>
        <template #cell(icons)="data">
          <div
            class="h2 float-right"
            v-if="!isView"
          >
            <IconLinkEdit
              :method="function() { editDocument(data.item, data.index) }"
              v-bind:title="$trans('Edit')"
            />
            <IconLinkDelete
              v-bind:title="$trans('Delete')"
              v-bind:method="function() { deleteDocument(data.index) }"
            />
          </div>
        </template>
      </b-table>
    </div>

    <!-- form -->
    <div v-if="showForm">
      <b-form v-if="!documentService.isEdit">
        <h4>{{ $trans("Add document(s)") }}</h4>
        <b-form-group
          label-cols="3"
          v-bind:label="$trans('Choose files')"
        >
          <b-form-file
            v-model="files"
            multiple
            v-bind:placeholder="$trans('Choose a file or drop it here...')"
            @input="filesSelected"
          ></b-form-file>
        </b-form-group>
      </b-form>

      <b-form v-if="documentService.isEdit">
        <h4>{{ $trans("Edit document") }}</h4>
        <b-form-group
          label-cols="3"
          v-bind:label="$trans('Choose files')"
        >
          <b-form-file
            v-model="documentService.editItem.file"
            v-bind:placeholder="$trans('Choose a file or drop it here...')"
            @input="filesSelected"
          ></b-form-file>
        </b-form-group>

        <b-form-group
          label-cols="3"
          v-bind:label="$trans('Name')"
          label-for="order-document-name"
        >
          <b-form-input
            id="order-document-name"
            size="sm"
            v-model="documentService.editItem.name"
          ></b-form-input>
        </b-form-group>

        <b-form-group
          label-cols="3"
          v-bind:label="$trans('Description')"
          label-for="order-document-description"
        >
          <b-form-textarea
            id="order-document-description"
            v-model="documentService.editItem.description"
            rows="1"
          ></b-form-textarea>
        </b-form-group>
      </b-form>

      <footer class="modal-footer">
        <b-button
          :disabled="isLoading"
          @click="cancelEditDocument"
          class="btn btn-secondary update-button"
          type="button"
          size="sm"
          variant="secondary"
        >
          {{ $trans('Cancel') }}
        </b-button>
        <b-button
          v-if="documentService.isEdit"
          @click="doEditCollectionItem"
          class="btn btn-primary"
          size="sm"
          type="button"
          variant="warning"
          :disabled="!isDocumentValid"
        >
          {{ $trans('Edit document') }}
        </b-button>
      </footer>

    </div>

    <footer
      class="modal-footer"
      v-if="!showForm && !isView"
    >
      <b-button
        @click="newDocument"
        class="btn btn-primary update-button"
        type="button"
        variant="primary"
      >
        {{ $trans('Add document(s)') }}
      </b-button>
    </footer>

    <b-container
      v-if="showChangesBlock"
    >
      <b-row>
        <b-col cols="2"></b-col>
        <b-col cols="10">
          <b-button
            @click="loadData"
            class="btn btn-secondary"
            type="button"
          >
            {{ $trans('Discard changes') }}
          </b-button>
          &nbsp;
          <b-button
            @click="submitDocuments"
            class="btn btn-danger"
            type="button"
            variant="danger"
          >
            {{ $trans('Save changes') }}
          </b-button>
        </b-col>
      </b-row>
    </b-container>
  </details>
</template>

<script>

import IconLinkDelete from "@/components/IconLinkDelete.vue";
import ButtonLinkSearch from "@/components/ButtonLinkSearch.vue";
import ButtonLinkRefresh from "@/components/ButtonLinkRefresh.vue";
import ButtonLinkAdd from "@/components/ButtonLinkAdd.vue";
import IconLinkEdit from "@/components/IconLinkEdit.vue";
import {DocumentModel, DocumentService} from "@/models/orders/Document";
import {OrderModel} from "@/models/orders/Order"

export default {
  name: "DocumentsComponent",
  components: {
    IconLinkEdit,
    ButtonLinkAdd,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    IconLinkDelete
  },
  props: {
    order: {
      type: OrderModel,
      default: null
    },
    isView: {
      type: [Boolean],
      default: false
    }
  },
  // watch: {
  //   order: async function(newVal) {
  //     await this.loadData()
  //   }
  // },
  data() {
    return {
      isLoading: false,
      isNewOrder: true,
      fields: [
        {key: 'name', label: this.$trans('Name')},
        {key: 'icons', label: ""},
      ],
      fieldsView: [
        {key: 'name', label: this.$trans('Name')},
      ],
      documentService: new DocumentService(),
      newItem: false,
      files: []
    }
  },
  computed: {
    showChangesBlock() {
      return this.order.id && !this.showForm && (this.documentService.collection.length || this.documentService.deletedItems.length) && this.documentService.collectionHasChanges
    },
    showForm() {
      return !this.isView && (this.documentService.isEdit || this.newItem)
    },
    isDocumentValid() {
      return this.documentService.editItem.file !== null
    }
  },
  async created () {
    if (!this.order.id) {
      this.newDocument()
    }

    await this.loadData()
  },
  methods: {
    orderCreated(order) {
      for (const document of this.documentService.collection) {
        document.order = order.id
      }
      this.submitDocuments()
    },
    doEditCollectionItem() {
      this.documentService.doEditCollectionItem()
    },
    editDocument(item, index) {
      this.documentService.editCollectionItem(item, index)
    },
    cancelEditDocument() {
      this.documentService.cancelEdit()
      this.newItem = false
    },
    newDocument() {
      this.documentService.newEditItem()
      this.newItem = true
    },
    deleteDocument(index) {
      this.documentService.deleteCollectionItem(index)
      if (this.order.id) {
        this.infoToast(this.$trans('Marked for delete'), this.$trans("Document marked for delete"))
      }
    },
    async loadData() {
      if (!this.order.id) {
        return
      }

      this.isLoading = true
      this.documentService.setListArgs(`order=${this.order.id}`)

      try {
        await this.documentService.loadCollection()
        if (this.documentService.collection.length === 0) {
          this.newDocument()
        }
        this.isLoading = false
      } catch(error) {
        console.log('error fetching documents', error)
        this.errorToast(this.$trans('Error loading documents'))
        this.isLoading = false
      }
    },
    // form
    filesSelected(files) {
      if (files.length) {
        for (let i=0;i<files.length; i++) {
          const reader = new FileReader()
          reader.onload = (f) => {
            const b64 = f.target.result
            this.documentService.collection.push(new DocumentModel({
              order: this.order.id,
              file: b64,
              name: files[i].name,
              description: ''
            }))
          }

          reader.readAsDataURL(files[i])
        }
        this.newItem = false
        this.documentService.newEditItem()
        this.documentService.collectionHasChanges = true
      }
    },
    async submitDocuments() {
      this.isLoading = true
      for (const document of this.documentService.collection) {
        if (document.file && document.file.indexOf('http') !== -1) {
          delete document.file
        }

        if (!document.order) {
          if (!this.order.id) {
            console.log('no order to update documents')
            this.errorToast(this.$trans('Error updating documents (no order)'))
            return
          }

          document.order = this.order.id
        }
      }

      try {
        await this.documentService.updateCollection()
        this.infoToast(this.$trans('Updated'), this.$trans('Documents have been updated'))
        await this.loadData()
      } catch (e) {
        console.log('error updating documents', e)
        this.errorToast(this.$trans('Error updating documents'))
      }

      this.isLoading = false
    },

  }
}
</script>

<style scoped>
</style>
