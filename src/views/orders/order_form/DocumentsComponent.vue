<template>
  <details open>
    <summary class="flex-columns space-between">
      <h6>{{ $trans('Documents') }}</h6>
      <IBiPaperclip></IBiPaperclip>
    </summary>

    <!-- list -->
    <div
      v-if="!showForm"
    >
      <p v-if="!documentService.collection.length">
        <i>{{ $trans("No documents") }}</i>
      </p>
      <b-container fluid="sm" v-else>
        <b-row
          v-for="(document, index) of documentService.collection"
          :key="document.name"
          no-gutters
          style="padding-bottom: 10px"
        >
          <b-col :cols="isView ? 12 : 9">
            <BLink v-bind:href="document.url" target="_blank">
              {{ document.name }} <IBiDownload font-scale=".8"></IBiDownload>
            </BLink>
          </b-col>
          <b-col cols="3" v-if="!isView">
            <div
              class="h2 float-right"
            >
              <IconLinkEdit
                :method="function() { editDocument(document, index) }"
                v-bind:title="$trans('Edit')"
              />
              <IconLinkDelete
                v-bind:title="$trans('Delete')"
                v-bind:method="function() { deleteDocument(index) }"
              />
            </div>
          </b-col>
          <b-col v-if="document.hasOwnProperty('apiOk')" cols="12">
            <ApiResult
              :error="document.error"
              :success-message='$trans("Document created")'
            />
          </b-col>
        </b-row>
      </b-container>

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
          label-for="order-document-name"
        >
          <BFormInput
            id="order-document-name"
            size="sm"
            v-model="documentService.editItem.name"
          ></BFormInput>
        </BFormGroup>

        <BFormGroup
          label-cols="3"
          v-bind:label="$trans('Description')"
          label-for="order-document-description"
        >
          <BFormTextarea
            id="order-document-description"
            v-model="documentService.editItem.description"
            rows="1"
          ></BFormTextarea>
        </BFormGroup>
      </b-form>

      <footer class="modal-footer">
        <BButton
          :disabled="isLoading"
          @click="cancelEditDocument"
          class="btn btn-primary"
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
        class="btn btn-primary"
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
        <b-col cols="2"></b-col>
        <b-col cols="10">
          <BButton
            @click="loadData"
            class="btn btn-secondary"
            type="button"
          >
            {{ $trans('Discard changes') }}
          </BButton>
          &nbsp;
          <BButton
            @click="submitDocuments"
            class="btn btn-primary"
            type="button"
          >
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
import {DocumentModel, DocumentService} from "@/models/orders/Document";
import {OrderModel} from "@/models/orders/Order"
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";

import ApiResult from "@/components/ApiResult.vue";

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
    ApiResult,
    IconLinkEdit,
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
        {key: 'name', label: $trans('Name')},
        {key: 'icons', label: ""},
      ],
      fieldsView: [
        {key: 'name', label: $trans('Name')},
      ],
      documentService: new DocumentService(),
      newItem: false,
      files: [],
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
    async orderCreated(orderPk) {
      for (const document of this.documentService.collection) {
        document.order = orderPk
      }
      return await this.submitDocuments()
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
        infoToast(create, $trans('Marked for delete'), $trans("Document marked for delete"))
      }
    },
    async loadData() {

      if (this.order.documents) {
        this.documentService.collection = this.order.documents;
        return;
      }

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
      if (this.documentService.collection.length === 0
        && this.documentService.deletedItems.length === 0) {
        return []
      }

      this.isLoading = true
      let orderErrors = []
      for (const document of this.documentService.collection) {
        if (document.file && document.file.indexOf('http') !== -1) {
          delete document.file
        }

        if (!document.order) {
          if (!this.order.id) {
            orderErrors.push(`no order to update document: ${document.name}`)
          } else {
            document.order = this.order.id
          }
        }
      }

      if (orderErrors.length > 0) {
        console.log('no order to update documents', orderErrors)
        errorToast(create, $trans('Error updating documents (no order)'))
        return orderErrors
      }

      let errors = []
      try {
        this.documentService.collection = await this.documentService.updateCollection()
        errors = this.documentService.collection.filter((d) => d.error)

        if (errors.length > 0) {
          errorToast(create, $trans('Error updating documents'))
        } else {
          infoToast(create, $trans('Updated'), $trans('Documents have been updated'))
          this.documentService.collectionHasChanges = false
        }
        // await this.loadData()
      } catch (e) {
        errors.push(e)
        console.log('error updating documents', e)
        errorToast(create, $trans('Error updating documents'))
      }

      this.isLoading = false

      return errors
    },

  }
}
</script>

<style scoped>
</style>
