<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <div v-if="isCreate">
          <h2>{{ $trans('New document') }}</h2>
          <b-form-group
            label-size="sm"
            v-bind:label="$trans('Choose files')"
          >
            <b-form-file
              v-model="files"
              multiple
              v-bind:placeholder="$trans('Choose a file or drop it here...')"
              @input="filesSelected"
            ></b-form-file>
          </b-form-group>

          <b-row>
            <b-col cols="12">
              <b-table v-if="documents.length > 0" small :fields="documentFields" :items="documents" responsive="md">
              </b-table>
            </b-col>
          </b-row>
        </div>
        <div v-if="!isCreate">
          <h2>{{ $trans('Edit document') }}</h2>
          <b-row>
            <b-col cols="12" role="group">
              {{ document.file }}
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="4" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Name')"
                label-for="quotation-document-name"
              >
                <b-form-input
                  id="quotation-document-name"
                  size="sm"
                  v-model="document.name"
                ></b-form-input>
              </b-form-group>
            </b-col>
            <b-col cols="8" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Description')"
                label-for="quotation-document-description"
              >
                <b-form-textarea
                  id="quotation-document-description"
                  v-model="document.description"
                  rows="1"
                ></b-form-textarea>
              </b-form-group>
            </b-col>
          </b-row>
        </div>

        <div class="mx-auto">
          <footer class="modal-footer">
            <b-button @click="cancelForm" type="button" variant="secondary">
              {{ $trans('Cancel') }}</b-button>
            <b-button @click="submitForm" type="button" variant="primary">
              {{ $trans('Submit') }}</b-button>
          </footer>
        </div>
      </b-form>
    </div>
  </b-overlay>
</template>

<script>
import eachSeries from 'async/eachSeries'
import documentService from '@/models/quotations/Document.js'

export default {
  name: 'DocumentForm',
  props: {
    quotationPk: {
      type: [String, Number],
      default: null
    },
    pk: {
      type: [String, Number],
      default: null
    }
  },
  data () {
    return {
      isLoading: false,
      documentFields: [
        { key: 'name', label: this.$trans('Name') },
        { key: 'description', label: this.$trans('Description') }
      ],
      files: [],
      documents: [],
      submitClicked: false,
      document: documentService.getFields(),
      errorMessage: null,
    }
  },
  computed: {
    isCreate() {
      return !this.pk
    },
  },
  created() {
    if (this.isCreate) {
      this.document = documentService.getFields()
    } else {
      this.loadDocument()
    }
  },
  methods: {
    filesSelected(files) {
      for (let i=0;i<files.length; i++) {
        const reader = new FileReader()
        reader.onload = (f) => {
          const b64 = f.target.result
          this.documents.push({
            quotation: this.quotationPk,
            file: b64,
            name: files[i].name,
            description: ''
          })
        }

        reader.readAsDataURL(files[i])
      }
    },
    async submitForm() {
      this.isLoading = true

      if (this.isCreate) {
        try {
          for (const document of this.documents) {
            await documentService.insert(document)
          }
        } catch(error) {
          this.errorToast(this.$trans('Error creating document(s)'))
          this.isLoading = false
        }

        this.infoToast(this.$trans('Created'), this.$trans('Document(s) have been created'))
        this.isLoading = false
        await this.$router.push({name: 'quotation-documents', params: {quotationPk: this.quotationPk}})

        return
      }

      try {
        delete this.document.file
        await documentService.update(this.pk, this.document)
        this.infoToast(this.$trans('Updated'), this.$trans('Document has been updated'))
        this.isLoading = false
        await this.$router.push({name: 'quotation-documents', params: {quotationPk: this.document.quotation}})
      } catch(error) {
        console.log('Error updating document', error)
        this.errorToast(this.$trans('Error updating document'))
        this.isLoading = false
      }
    },
    async loadDocument() {
      this.isLoading = true

      try {
        this.document = await documentService.detail(this.pk)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching document', error)
        this.errorToast(this.$trans('Error loading document'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
