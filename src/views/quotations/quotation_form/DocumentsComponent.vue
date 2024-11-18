<template>
  <div>
    <h5>{{ $trans('Documents') }}</h5>

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
        <template #cell(icons)="data">
          <div
            class="h2 float-right"
            v-if="data.item.id && !isView"
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
        <h6>{{ $trans("Add document(s)") }}</h6>
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
          label-for="quotation-document-name"
        >
          <b-form-input
            id="quotation-document-name"
            size="sm"
            v-model="documentService.editItem.name"
          ></b-form-input>
        </b-form-group>

        <b-form-group
          label-cols="3"
          v-bind:label="$trans('Description')"
          label-for="quotation-document-description"
        >
          <b-form-textarea
            id="quotation-document-description"
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
        :disabled="isLoading"
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
            :disabled="isLoading"
            class="btn btn-secondary"
            type="button"
          >
            {{ $trans('Discard changes') }}
          </b-button>
          &nbsp;
          <b-button
            @click="submitDocuments"
            :disabled="isLoading"
            class="btn btn-danger"
            type="button"
            variant="danger"
          >
            <b-spinner small v-if="isLoading"></b-spinner>
            {{ $trans('Save changes') }}
          </b-button>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>

import IconLinkDelete from "@/components/IconLinkDelete.vue";
import ButtonLinkSearch from "@/components/ButtonLinkSearch.vue";
import ButtonLinkRefresh from "@/components/ButtonLinkRefresh.vue";
import ButtonLinkAdd from "@/components/ButtonLinkAdd.vue";
import IconLinkEdit from "@/components/IconLinkEdit.vue";

import {DocumentModel, DocumentService} from "@/models/quotations/Document";
import {QuotationModel} from "@/models/quotations/Quotation"

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
    quotation: {
      type: QuotationModel,
      default: null
    },
    isView: {
      type: [Boolean],
      default: false
    }
  },
  data() {
    return {
      isLoading: false,
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
      return !this.showForm && (this.documentService.collection.length || this.documentService.deletedItems.length) && this.documentService.collectionHasChanges
    },
    showForm() {
      return !this.isView && (this.documentService.isEdit || this.newItem)
    },
    isDocumentValid() {
      return this.documentService.editItem.file !== null
    }
  },
  async created () {
    this.documentService.setListArgs(`quotation=${this.quotation.id}`)
    this.documentService.currentPage = this.$route.query.page || 1
    await this.loadData()
  },
  methods: {
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
      this.infoToast(this.$trans('Marked for delete'), this.$trans("Document marked for delete"))
    },
    async loadData() {
      this.isLoading = true

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
              quotation: this.quotation.id,
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
