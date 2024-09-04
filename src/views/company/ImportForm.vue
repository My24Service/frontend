<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
      <header>
        <div class="page-title">
          <h3>
            <b-icon icon="file-arrow-down"></b-icon>
            <span v-if="isCreate">{{ $trans('New import') }}</span>
            <span v-else>{{ $trans('Edit import') }}</span>
          </h3>
        </div>
      </header>

      <div class="app-detail panel overflow-auto">
        <b-form>
          <b-row>
            <b-col cols="4" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Name')"
                label-for="import_name"
              >
                <b-form-input
                  id="import_name"
                  size="sm"
                  v-model="importModel.name"
                  :state="isSubmitClicked ? !v$.importModel.name.$error : null"
                ></b-form-input>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.importModel.name.$error : null">
                  {{ $trans('Please enter a name') }}
                </b-form-invalid-feedback>
              </b-form-group>
            </b-col>

            <b-col cols="8" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('File')"
                label-for="company-import-file"
                :description="`${$trans('Accepted file formats')}: ${allowed_extensions.join(', ')}`"
              >
                <b-form-file
                  id="company-import-file"
                  v-model="file"
                  v-bind:placeholder="$trans('Choose a file or drop it here...')"
                  @input="fileSelected"
                ></b-form-file>
                {{ current_file }}
              </b-form-group>
            </b-col>
          </b-row>
          <div class="mx-auto">
            <footer class="modal-footer">
              <b-button @click="cancelForm" type="button" variant="secondary">
                {{ $trans('Cancel') }}</b-button>
              <b-button
                @click="submitForm"
                type="button"
                variant="primary"
              >
                {{ $trans('Submit') }}
              </b-button>
              <b-form-checkbox
                v-if="!importModel.result_inserts"
                v-model="continueToPreview"
              >
                {{ $trans("continue to preview") }}
              </b-form-checkbox>
            </footer>
          </div>
        </b-form>
      </div>
    </div>
  </b-overlay>
</template>

<script>
import {Import, ImportService} from '@/models/company/Import'
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'

export default {
  setup() {
    return { v$: useVuelidate() }
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  computed: {
    isCreate() {
      return !this.pk
    },
  },
  validations() {
    return {
      importModel: {
        name: {
          required
        },
      }
    }
  },
  data() {
    return {
      file: null,
      current_file: null,
      base64data: null,
      service: new ImportService(),
      importModel: new Import({}),
      allowed_extensions: [],
      isLoading: null,
      isSubmitClicked: false,
      continueToPreview: true,
    }
  },
  async created() {
    this.isLoading = true
    this.allowed_extensions = await this.service.fetchAllowedExtensions()

    if (this.isCreate) {
      this.importModel = new Import({})
      this.isLoading = false
    } else {
      this.importModel = await this.service.detail(this.pk)
      this.isLoading = false
    }
  },
  methods: {
    getExtension(filename) {
      const parts = filename.split('.')
      return parts[parts.length-1].toLowerCase()
    },
    fileSelected(file) {
      const extension = this.getExtension(file.name)
      if (this.allowed_extensions.indexOf(extension) === -1) {
        return
      }
      const reader = new FileReader()

      reader.onload = (f) => {
        const b64 = f.target.result
        this.current_file = file.name
        this.importModel.file = b64
      }

      reader.readAsDataURL(file)
    },
    async submitForm() {
      this.isSubmitClicked = true

      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

      if (this.isCreate) {
        try {
          const created = await this.service.insert(this.importModel)
          this.importModel = new Import(created)
        } catch (e) {
          this.errorToast(this.$trans('Error creating import'))
          console.log(`Error creating import: ${e}`)
          this.isSubmitClicked = false
          return
        }
      } else {
        try {
          if (this.importModel.file.substring(0, 'http'.length) === 'http') {
            delete this.importModel.file
          }

          await this.service.update(this.pk, this.importModel)
        } catch (e) {
          this.errorToast(this.$trans('Error updating import'))
          console.log(`Error creating import: ${e}`)
          this.isSubmitClicked = false
          return
        }
      }

      if (this.continueToPreview) {
        await this.$router.push({name: 'company-import-preview', params: {pk: this.importModel.id}})
      } else {
        await this.$router.push({name: 'company-import-list'})
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  },
}
</script>

<style scoped>
</style>
