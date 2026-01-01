<template>
  <div>
   <h6>{{ $trans('Documents') }}</h6>

    <!-- list -->
    <div
      v-if="true"
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
              {{ document.name }} <b-icon-download font-scale=".8"></b-icon-download>
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
        <p>{{ $trans("Add document(s)") }}</p>
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
        <p>{{ $trans("Edit document") }}</p>
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
          label-for="equipment-document-name"
        >
          <BFormInput
            id="equipment-document-name"
            size="sm"
            v-model="documentService.editItem.name"
          ></BFormInput>
        </BFormGroup>

        <BFormGroup
          label-cols="3"
          v-bind:label="$trans('Description')"
          label-for="equipment-document-description"
        >
          <BFormTextarea
            id="equipment-document-description"
            v-model="documentService.editItem.description"
            rows="1"
          ></BFormTextarea>
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
            class="btn btn-danger"
            type="button"
            variant="danger"
          >
            {{ $trans('Save changes') }}
          </BButton>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>

import IconLinkDelete from "@/components/IconLinkDelete.vue";
import IconLinkEdit from "@/components/IconLinkEdit.vue";
import {DocumentModel, LocationDocumentService, DocumentService} from "@/models/equipment/Document";
import {EquipmentModel} from "@/models/equipment/equipment"

import ApiResult from "@/components/ApiResult.vue";
import {LocationModel} from "@/models/equipment/location";
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";
const {create} = useToast()

export default {

  name: "DocumentsComponent",
  components: {
    ApiResult,
    IconLinkEdit,
    IconLinkDelete
  },
  props: {
    location: {
      type: LocationModel,
      default: null
    },
    equipment: {
      type: EquipmentModel,
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
      isNewEquipment: true,
      fields: [
        {key: 'name', label: $trans('Name')},
        {key: 'icons', label: ""},
      ],
      fieldsView: [
        {key: 'name', label: $trans('Name')},
      ],
      // documentService: new DocumentService(),
      documentService: this.location != null ? new LocationDocumentService() : new DocumentService(),
      isLocation: this.location != null,
      isEquipment: this.equipment != null,
      newItem: false,
      files: [],
    }
  },
  computed: {
    showChangesBlock() {
      return this.getParentId() && !this.showForm && (this.documentService.collection.length || this.documentService.deletedItems.length) && this.documentService.collectionHasChanges
    },
    showForm() {
      return !this.isView && (this.documentService.isEdit || this.newItem)
    },
    isDocumentValid() {
      return this.documentService.editItem.file !== null
    }
  },
  async created () {
    await this.loadData()
  },
  watch: {
    location: {
      handler() {
        this.loadData();
      }
    },
    equipment: {
      handler() {
        this.loadData()
      },
    }
  },
  methods: {
    getParentId() {
      if (this.isEquipment) return this.equipment.id
      else if (this.isLocation) return this.location.id
      return null
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
      if (this.getParentId()) {
        infoToast(create, $trans('Marked for delete'), $trans("Document marked for delete"))
      }
    },
    async loadData() {

      if (this.equipment != null) {
        if (this.equipment.documents) {
          this.documentService.collection = this.equipment.documents;
          return;
        }
      }
      else if (this.location != null) {
        if (this.location.documents) {
          this.documentService.collection = this.location.documents;
          return;
        }
      }

      if (!this.getParentId()) {
        return;
      }

      this.isLoading = true
      this.documentService.setParentId( this.getParentId() );
      //this.documentService.setListArgs(`equipment=${this.equipment.id}`)

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

            const newDocumentAttr = {
              file: b64,
              name: files[i].name,
              description: ''
            };

            if (this.isLocation) {
              newDocumentAttr.location = this.getParentId()
            } else if (this.isEquipment){
              newDocumentAttr.equipment = this.getParentId()
            } else {
              console.error( 'Bad state, expected location or equipment not set')
              return;
            }

            this.documentService.collection.push(new DocumentModel(newDocumentAttr))
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
      let documentErrors = []
      for (const document of this.documentService.collection) {
        if (document.file && document.file.indexOf('http') !== -1) {
          delete document.file
        }

        if (this.isLocation) {
          if (!this.location.id) {
            documentErrors.push(`no location to update document: ${document.name}`)
          } else {
            document.location = this.location.id
          }
        } else if (this.isEquipment) {
          if (!this.equipment.id) {
            documentErrors.push(`no equipment to update document: ${document.name}`)
          } else {
            document.equipment = this.equipment.id
          }
        }
        else {
          documentErrors.push( 'documents could not be updated')
        }
      }

      if (documentErrors.length > 0) {
        console.log('no equipment/locations to update documents', documentErrors)
        errorToast(create, $trans('Error updating documents (no equipment or location)'))
        return documentErrors
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
