<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New document') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit document') }}</h2>
        <b-row>
          <b-col cols="5" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Name')"
              label-for="customer-document-name"
            >
              <b-form-input
                id="customer-document-name"
                size="sm"
                v-model="document.name"
                :state="isSubmitClicked ? !$v.document.name.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !$v.document.name.$error : null">
                {{ $trans('Please enter a name') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('File')"
              label-for="customer-document-file"
            >
              <b-form-file
                id="customer-document-file"
                v-model="file"
                v-bind:placeholder="$trans('Choose a file or drop it here...')"
                @input="fileSelected"
                :state="isSubmitClicked ? !$v.document.file.$error : null"
              ></b-form-file>
              {{ current_file }}
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !$v.document.file.$error : null">
                {{ $trans('Please select a file') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('User can view document?')"
              label-for="customer-document-user_can_view"
            >
              <b-form-checkbox
                id="customer-document-user_can_view"
                v-model="document.user_can_view"
              >
              </b-form-checkbox>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="12" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Description')"
              label-for="customer-document-description"
            >
              <b-form-textarea
                id="customer-document-description"
                v-model="document.description"
                rows="5"
              ></b-form-textarea>
            </b-form-group>
          </b-col>
        </b-row>

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
import documentModel from '@/models/customer/Document'
import { required } from 'vuelidate/lib/validators'

export default {
  props: {
    customerPk: {
      type: [String, Number],
      default: null
    },
    pk: {
      type: [String, Number],
      default: null
    },
    edit: {
      type: [Boolean],
      default: false
    }
  },
  validations: {
    document: {
      name: {
        required,
      },
      file: {
        required,
      },
    }
  },
  data() {
    return {
      isLoading: false,
      fileChanged: false,
      current_file: null,
      file: null,
      submitClicked: false,
      document: documentModel.getFields(),
      errorMessage: null,
    }
  },
  computed: {
    isCreate() {
      return !this.pk
    },
    isSubmitClicked() {
      return this.submitClicked
    }
  },
  created() {
    if (this.isCreate) {
      this.document = documentModel.getFields()
      this.document.customer = this.customerPk
    } else {
      this.loadData()
    }
  },
  methods: {
    fileSelected(file) {
      const reader = new FileReader()
      reader.onload = (f) => {
        const b64 = f.target.result
        this.current_file = file.name
        this.document.file = b64
      }

      reader.readAsDataURL(file)
      this.fileChanged = true
    },
    submitForm() {
      this.submitClicked = true
      this.$v.$touch()
      if (this.$v.$invalid) {
        console.log('invalid?', this.$v.$invalid)
        return
      }

      this.isLoading = true

      if (this.isCreate) {
        return this.$store.dispatch('getCsrfToken').then(token => {
          documentModel.insert(token, this.document).then(() => {
            this.flashMessage.show({
              status: 'info',
              title: this.$trans('Created'),
              message: this.$trans('Document has been created')
            })

            this.isLoading = false
            this.$router.push({name: 'customer-documents', params: {customerPk: this.document.customer}})
          }).catch(error => {
            this.flashMessage.show({
              status: 'error',
              title: this.$trans('Error'),
              message: this.$trans('Error creating document')
            })

            this.isLoading = false
          })
        })
      }

      this.$store.dispatch('getCsrfToken').then((token) => {
        // file didn't change? remove from update data
        if (!this.fileChanged) {
          delete this.document.file
        }

        documentModel.update(token, this.pk, this.document)
          .then(() => {
            this.flashMessage.show({
              status: 'info',
              title: this.$trans('Updated'),
              message: this.$trans('Document has been updated')
            })

            this.isLoading = false
            this.$router.push({name: 'customer-documents', params: {customerPk: this.document.customer}})
          })
          .catch(() => {
            this.flashMessage.show({
              status: 'error',
              title: this.$trans('Error'),
              message: this.$trans('Error updating document')
            })

            this.isLoading = false
          })
      })
    },
    loadData() {
      this.isLoading = true

      documentModel.detail(this.pk).then((document) => {
        this.document = document
        this.document.file = document.file
        this.current_file = document.filename
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
