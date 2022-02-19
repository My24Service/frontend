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
                label-for="order-document-name"
              >
                <b-form-input
                  id="order-document-name"
                  size="sm"
                  v-model="document.name"
                ></b-form-input>
              </b-form-group>
            </b-col>
            <b-col cols="8" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Description')"
                label-for="order-document-description"
              >
                <b-form-textarea
                  id="order-document-description"
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
import documentModel from '@/models/orders/Document.js'

export default {
  name: 'DocumentForm',
  props: {
    orderPk: {
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
      document: documentModel.getFields(),
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
      this.document = documentModel.getFields()
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
            order: this.orderPk,
            file: b64,
            name: files[i].name,
            description: ''
          })
        }

        reader.readAsDataURL(files[i])
      }
    },
    postDocument(document, callback) {
      this.$store.dispatch('getCsrfToken').then(token => {
        documentModel.insert(token, document).then(() => {
          return callback()
        }).catch(error => {
          return callback(error)
        })
      })
    },
    submitForm() {
      this.isLoading = true

      if (this.isCreate) {
        eachSeries(this.documents, this.postDocument, (err) => {
          if (err) {
            this.flashMessage.show({
              status: 'error',
              title: this.$trans('Error'),
              message: this.$trans('Error creating document(s)')
            })

            this.isLoading = false
          } else {
            this.flashMessage.show({
              status: 'info',
              title: this.$trans('Created'),
              message: this.$trans('Document(s) have been created')
            })

            this.isLoading = false
            this.$router.push({name: 'order-documents', params: {orderPk: this.orderPk}})
          }
        })

        return
      }

      this.$store.dispatch('getCsrfToken').then((token) => {
        delete this.document.file
        documentModel.update(token, this.pk, this.document).then(() => {
          this.flashMessage.show({
            status: 'info',
            title: this.$trans('Updated'),
            message: this.$trans('Document has been updated')
          })

          this.isLoading = false
          this.$router.push({name: 'order-documents', params: {orderPk: this.document.order}})
        }).catch(() => {
          this.flashMessage.show({
            status: 'error',
            title: this.$trans('Error'),
            message: this.$trans('Error updating document')
          })

          this.isLoading = false
        })
      })
    },
    loadDocument() {
      this.isLoading = true

      documentModel.detail(this.pk).then((document) => {
        this.document = document
        this.isLoading = false
      }).catch((error) => {
        console.log('error fetching document', error)
        this.flashMessage.show({
          status: 'error',
          title: this.$trans('Error'),
          message: this.$trans('Error loading document')
        })

        this.isLoading = false
      })
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
