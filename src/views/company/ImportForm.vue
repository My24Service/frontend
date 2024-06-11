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

      <div class="page-detail import-form">
        <b-form v-if="isCreate">
          <b-row>
            <p><i>{{ $trans("Accepted file formats") }}: <b>{{ allowed_extensions.join(', ') }}</b></i></p>
            <b-col cols="8" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('File')"
                label-for="equipment-import-file"
              >
                <b-form-file
                  id="equipment-import-file"
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
            </footer>
          </div>
        </b-form>
      </div>
    </div>
  </b-overlay>
</template>

<script>
import {EquipmentImport, EquipmentImportService} from '@/models/company/Import'

export default {
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
  data() {
    return {
      file: null,
      current_file: null,
      base64data: null,
      service: new EquipmentImportService(),
      equipmentImport: new EquipmentImport({}),
      allowed_extensions: [],
      isLoading: null
    }
  },
  async created() {
    this.isLoading = true
    this.allowed_extensions = await this.service.fetchAllowedExtensions()

    if (this.isCreate) {
      this.equipmentImport = new EquipmentImport({})
      this.isLoading = false
    } else {
      this.equipmentImport = await this.service.detail(this.pk)
      this.isLoading = false
    }
  },
  methods: {
    getExtension(filename) {
      const parts = filename.split('.')
      return parts[parts.length-1].toLowerCase()
    },
    fileSelected(file) {
      const reader = new FileReader()

      reader.onload = (f) => {
        const b64 = f.target.result
        this.current_file = file.name
        this.equipmentImport.file = b64
      }

      reader.readAsDataURL(file)
    },
    async submitForm() {
      try {
        if (this.isCreate) {
          const created = await this.service.insert(this.equipmentImport)
          await this.$router.push({name: 'equipment-import-preview', params: {pk: created.id}})
        } else {
          await this.service.update(this.pk, this.equipmentImport)
          await this.$router.push({name: 'equipment-import-preview', params: {pk: this.pk}})
        }
      } catch (e) {
        this.errorToast(this.$trans('Error importing file'))
        console.log(`Error importing file: ${e}`)
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  },
}
</script>

<style scoped>
.import-form {
  padding-top: 50px;
}
</style>
