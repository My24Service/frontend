<template>
  <details open>
    <summary class="flex-columns space-between">
      <h6>{{ $trans('Documents') }}</h6>
      <IBiChevronDown></IBiChevronDown>
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
        <h4>{{ $trans("Add document(s)") }}</h4>
        <BFormGroup
          label-cols="3"
          v-bind:label="$trans('Choose files')"
        >
          <b-form-file
            v-model="files"
            multiple
            v-bind:placeholder="$trans('Choose a file or drop it here...')"
            @input="filesSelected"
          ></b-form-file>
        </BFormGroup>
      </b-form>

      <b-form v-if="documentService.isEdit">
        <h4>{{ $trans("Edit document") }}</h4>
        <BFormGroup
          label-cols="3"
          v-bind:label="$trans('Choose files')"
        >
          <b-form-file
            v-model="documentService.editItem.file"
            v-bind:placeholder="$trans('Choose a file or drop it here...')"
            @input="filesSelected"
          ></b-form-file>
        </BFormGroup>

        <BFormGroup
          label-cols="3"
          v-bind:label="$trans('Name')"
          label-for="customer-document-name"
        >
          <BFormInput
            id="customer-document-name"
            size="sm"
            v-model="documentService.editItem.name"
          ></BFormInput>
        </BFormGroup>

        <BFormGroup
          label-cols="3"
          v-bind:label="$trans('Description')"
          label-for="customer-document-description"
        >
          <BFormTextarea
            id="customer-document-description"
            v-model="documentService.editItem.description"
            rows="1"
          ></BFormTextarea>
        </BFormGroup>

        <BFormGroup
          label-cols="3"
          v-bind:label="$trans('User can view document?')"
          label-for="customer-document-user_can_view"
        >
          <BFormCheckbox
            id="customer-document-user_can_view"
            v-model="documentService.editItem.user_can_view"
          >
          </BFormCheckbox>
        </BFormGroup>
      </b-form>

      <footer class="modal-footer">
        <BButton
          :disabled="isLoading"
          @click="cancelEditDocument"
          class="btn btn-secondary update-button"
          type="button"
          size="sm"
          variant="secondary"
        >
          {{ $trans('Cancel') }}
        </BButton>
        <BButton
          v-if="documentService.isEdit"
          @click="doEditCollectionItem"
          class="btn btn-primary"
          size="sm"
          type="button"
          variant="warning"
          :disabled="!isDocumentValid"
        >
          {{ $trans('Edit document') }}
        </BButton>
      </footer>

    </div>

    <footer
      class="modal-footer"
      v-if="!showForm && !isView"
    >
      <BButton
        @click="newDocument"
        :disabled="isLoading"
        class="btn btn-primary update-button"
        type="button"
        variant="primary"
      >
        {{ $trans('Add document(s)') }}
      </BButton>
    </footer>

    <b-container
      v-if="showChangesBlock"
    >
      <b-row>
        <b-col cols="12">
          <BButton
            @click="loadData"
            :disabled="isLoading"
            class="btn btn-secondary"
            type="button"
          >
            {{ $trans('Discard changes') }}
          </BButton>
          &nbsp;
          <BButton
            @click="submitDocuments"
            :disabled="isLoading"
            class="btn btn-danger"
            type="button"
            variant="danger"
          >
            <b-spinner small v-if="isLoading"></b-spinner>
            {{ $trans('Save changes') }}
          </BButton>
        </b-col>
      </b-row>
    </b-container>
  </details>
</template>

<script>
import IconLinkDelete from "@/components/IconLinkDelete.vue";
import IconLinkEdit from "@/components/IconLinkEdit.vue";
import {DocumentModel, DocumentService} from "@/models/customer/Document.js";
import {CustomerModel} from "@/models/customer/Customer"
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";

export default {
  setup() {
    const {create} = useToast()

    // expose to template and other options API hooks
    return {
      create
    }
  },
  name: "DocumentsComponent",
  components: {
    IconLinkEdit,
    IconLinkDelete
  },
  props: {
    customer: {
      type: CustomerModel,
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
        {key: 'name', label: $trans('Name')},
        {key: 'icons', label: ""},
      ],
      fieldsView: [
        {key: 'name', label: $trans('Name')},
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
    this.documentService.setListArgs(`customer=${this.customer.id}`)
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
      infoToast(create, $trans('Marked for delete'), $trans("Document marked for delete"))
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
        errorToast(create, $trans('Error loading documents'))
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
              customer: this.customer.id,
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
        infoToast(create, $trans('Updated'), $trans('Documents have been updated'))
        await this.loadData()
      } catch (e) {
        console.log('error updating documents', e)
        errorToast(create, $trans('Error updating documents'))
      }

      this.isLoading = false
    },

  }
}
</script>
