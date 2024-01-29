<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form v-if="isCreate || isUploadAgain">
        <h2>{{ $trans('Upload customer data') }}</h2>
        <p><i>{{ $trans("Accepted file formats") }}: <b>{{ allowed_extensions.join(', ') }}</b></i></p>
        <b-row>
          <b-col cols="8" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('File')"
              label-for="customer-upload-file"
            >
              <b-form-file
                id="customer-upload-file"
                v-model="file"
                v-bind:placeholder="$trans('Choose a file or drop it here...')"
                @input="fileSelected"
              ></b-form-file>
              {{ current_file }}
            </b-form-group>
          </b-col>
        </b-row>
        <div class="mx-auto">
          <footer class="modal-footer" v-if="!isUploadAgain">
            <b-button @click="cancelForm" type="button" variant="secondary">
              {{ $trans('Cancel') }}</b-button>
            <b-button
              @click="submitForm"
              type="button"
              variant="primary"
              :disabled="isSubmitDisabled"
            >
              {{ $trans('Submit') }}
            </b-button>
          </footer>
          <footer class="modal-footer" v-if="isUploadAgain">
            <b-button @click="cancelUploadAgain" type="button" variant="secondary">
              {{ $trans('Cancel') }}</b-button>
            <b-button
              @click="submitUploadAgain"
              type="button"
              variant="primary"
              :disabled="isSubmitDisabled"
            >
              {{ $trans('Submit') }}
            </b-button>
          </footer>
        </div>
      </b-form>
      <div v-if="!isCreate && !isLoading && !isUploadAgain">
        <h2>{{ $trans('Modify upload data') }}</h2>
        <div>
          <ul>
            <li>country_code: NL, BE, DE, etc.</li>
            <li>external_identifier: {{ $trans("internal ID used by company ") }}</li>
            <li>{{ $trans("Required fields") }}: {{ required.join(', ') }}</li>
          </ul>
        </div>
        <div v-if="missing.length" class="missing">
          {{ $trans("Missing fields") }}: {{ missing.join(', ') }}
        </div>
        <div v-if="uploadHeadersChanged">
          <h3 class="headers-changed bg-warning">{{ $trans("Headers in file changed") }}</h3>
        </div>
        <table>
          <tr>
            <th class="mapping_header_upload_field">{{ $trans('Upload field') }}</th>
            <th class="mapping_header_db_field">{{ $trans('Database field') }}</th>
            <th class="mapping_header_filter_field">{{ $trans('Use in filter?') }}</th>
          </tr>
          <tr v-for="head in uploadHeaders" :key="head">
            <td class="mapping_td">{{ head }}</td>
            <td class="mapping_td">
              <multiselect
                :searchable="false"
                :options="availableColumns"
                :value="customerUpload.mapping[head]"
                :show-labels="false"
                @select="function(option) { selectColumn(head, option) }"
              />
            </td>
            <td class="mapping_td" style="text-align: center">
              <b-form-checkbox
                :value="head"
                v-model="customerUpload.filter_on"
              >
              </b-form-checkbox>
            </td>
          </tr>
        </table>
        <div class="mx-auto">
          <footer class="modal-footer">
            <b-button
              @click="clickUploadAgainButton"
              type="button"
              variant="primary"
            >
              {{ $trans('Upload file again') }}</b-button>
            <b-button
              @click="submitUpdatePreview"
              type="button"
              variant="primary"
              ref="submitUpdatePreview"
              :disabled="isUpdatePreviewDataDisabled"
            >
              {{ $trans('Save & preview') }}</b-button>
          </footer>
        </div>
        <div v-if="uploadResult">
          <div v-if="uploadResult.num_existing">
            <h3>{{ $trans("Existing customers")}}</h3>

            <table
              :id="`preview-table-${index}`"
              v-for="(existingItem, index) of existingData" :key="`table-${index}`"
              class="preview-table"
            >
              <tr>
                <th class="preview-cell">&nbsp;&nbsp;</th>
                <th class="preview-cell" v-for="(head, index) in uploadHeaders" :key="`head-${index}`">
                  {{ head }}
                </th>
              </tr>
              <tr class="preview-row upload-row">
                <td class="preview-cell">{{ $trans("Upload") }}</td>
                <td class="preview-cell" v-for="(col, index2) of existingItem.upload_row" :key="`${col}-${index}-${index2}`">
                  {{ col }}
                </td>
              </tr>
              <tr
                v-for="(db_row, index3) of existingItem.database_rows" :key="`db_row-${index}-${index3}`"
                class="preview-row database-row"
              >
                <td class="preview-cell">{{ $trans("Database") }}</td>
                <td class="preview-cell" v-for="(col, index2) of db_row" :key="`${col}-${index}-${index2}-${index3}`">
                  {{ col }}
                </td>
              </tr>
            </table>
          </div>
          <div v-if="errors.length">
            <h3>{{ $trans("Problems found")}}</h3>
            <table class="preview-table">
              <tr class="preview-row">
                <th class="preview-cell" v-for="(head, index) in uploadHeaders" :key="`head-${index}`">
                  {{ head }}
                </th>
              </tr>
              <tr class="preview-row" v-for="(missing, index) of errors" :key="`missing-${index}`">
                <td
                  v-for="(field, index2) of uploadHeaders"
                  :key="`td-${index}-${index2}`"
                  :class="`${missing.error_fields.indexOf(field) !== -1 ? 'bg-danger' : ''}`"
                  class="preview-cell"
                >
                  {{ missing.upload_rec[field] }}
                </td>
              </tr>
            </table>
          </div>
          <div v-if="insertErrors.length && uploadDone">
            <h3>{{ $trans("Errors")}}</h3>
            <table class="preview-table">
              <tr class="preview-row">
                <th class="preview-cell" v-for="(head, index) in uploadHeaders" :key="`head-${index}`">
                  {{ head }}
                </th>
              </tr>
              <tr class="preview-row" v-for="(error, index) of insertErrors" :key="`error-${index}`">
                <td :colspan="uploadHeaders.length">
                  <table>
                    <tr class="preview-row">
                      <td
                        v-for="(field, index2) of uploadHeaders"
                        :key="`td-${index}-${index2}`"
                        class="preview-cell"
                      >
                        {{ error.upload_rec[field] }}
                      </td>
                    </tr>
                    <tr>
                      <td :colspan="uploadHeaders.length">{{ error.error }}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </div>
          <div class="bg-success previewBlock rounded">
            {{ $trans("New customers") }}: <b>{{ uploadResult.num_insert }}</b>
          </div>
          <div class="bg-warning previewBlock rounded">
            {{ $trans("Existing customers") }}: <b>{{ uploadResult.num_existing }}</b>
          </div>

          <footer class="modal-footer" v-if="!uploadDone">
            <b-button
              @click="doUploadCustomers"
              type="button"
              variant="primary"
            >
              {{ $trans('Looks good! Upload customers') }}</b-button>
          </footer>
          <footer class="modal-footer" v-if="uploadDone">
            <b-button @click="navUploadList" type="button" variant="secondary">
              {{ $trans('Upload list') }}</b-button>
            <b-button
              @click="deleteUpload"
              type="button"
              variant="primary"
            >
              {{ $trans('Delete this upload and load customers') }}</b-button>
          </footer>
        </div>
      </div>
    </div>
  </b-overlay>
</template>

<script>
import Multiselect from "vue-multiselect";

import {CustomerUpload, CustomerUploadService} from '@/models/customer/Upload'
import {CustomerModel} from "@/models/customer/Customer";

Array.prototype.equals = function (array) {
  // if the other array is a falsy value, return
  if (!array)
    return false;
  // if the argument is the same array, we can be sure the contents are same as well
  if(array === this)
    return true;
  // compare lengths - can save a lot of time
  if (this.length !== array.length)
    return false;

  for (var i = 0, l=this.length; i < l; i++) {
    // Check if we have nested arrays
    if (this[i] instanceof Array && array[i] instanceof Array) {
      // recurse into the nested arrays
      if (!this[i].equals(array[i]))
        return false;
    }
    else if (this[i] !== array[i]) {
      // Warning - two different object instances will never be equal: {x:20} != {x:20}
      return false;
    }
  }
  return true;
}

export default {
  components: {Multiselect},
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
    isSubmitDisabled() {
      if (!this.current_file) {
        return true
      }

      const extension = this.getExtension(this.current_file)
      return this.customerUpload.file === null && this.allowed_extensions.indexOf(extension) === -1
    },
    availableColumns() {
      // return this.columns;
      const columns = this.columns.filter((field) =>
        Object.values(this.customerUpload.mapping).indexOf(field) === -1
      )
      if (columns.length) {
        columns.unshift('-')
      }
      return columns
    },
    missing() {
      if (!this.customerUpload.mapping) {
        return []
      }

      const chosenFields = Object.values(this.customerUpload.mapping)
      return this.required.filter((field) => chosenFields.indexOf(field) === -1)
    },
    isUpdatePreviewDataDisabled() {
      if (process.env.NODE_ENV === 'test') {
        return false
      }

      return this.customerUpload.filter_on.length < 3 || this.missing.length > 0 || this.uploadResult !== null
    },
  },
  data() {
    return {
      file: null,
      current_file: null,
      base64data: null,
      service: new CustomerUploadService(),
      customerUpload: new CustomerUpload({}),
      columns: [],
      uploadResult: null,
      required: [],
      existingData: [],
      errors: [],
      isUploadAgain: false,
      isLoading: false,
      uploadHeaders: [],
      uploadHeadersChanged: false,
      uploadDone: false,
      insertErrors: [],
      allowed_extensions: []
    }
  },
  async created() {

    if (this.isCreate) {
      this.isLoading = true
      this.allowed_extensions = await this.service.fetchAllowedExtensions()
      this.customerUpload = new CustomerUpload({})
      this.isLoading = false
    } else {
      this.isLoading = true
      this.required = await this.service.fetchRequired()

      // load
      this.customerUpload = await this.service.detail(this.pk)
      const headData = await this.service.readHead(this.pk)

      // headers so we can keep that order
      this.uploadHeaders = headData.headers;

      // define this here and not in the backend because the JS model contains more fields
      const exclude = [
        'default_currency', 'id', 'products_without_tax', 'maintenance_contract',
        'standard_hours_hour', 'standard_hours_minute', 'branch_partner', 'branch_id',
        'use_branch_address', 'call_out_costs', 'call_out_costs_currency', 'hourly_rate_engineer',
        'hourly_rate_engineer_currency', 'hourly_rate_partner_engineer', 'hourly_rate_partner_engineer_currency',
        'price_per_km', 'price_per_km_currency', 'priceFields', 'time', 'time2', 'timealt', 'timealt2',
        'customer_id'
      ]

      // set our available database columns
      const customer = new CustomerModel(({}))
      this.columns = Object.keys(customer).filter((field) => exclude.indexOf(field) === -1)

      // set mapping returned from backend
      this.customerUpload.mapping = headData.mapping

      this.isLoading = false
    }
  },
  methods: {
    async navUploadList() {
      await this.$router.push({name: 'customer-upload-list'})
    },
    async deleteUpload() {
      await this.service.delete(this.pk)
      await this.$router.push({name: 'customer-list'})
    },
    clickUploadAgainButton() {
      this.isUploadAgain = true
    },
    cancelUploadAgain() {
      this.isUploadAgain = false
    },
    async submitUploadAgain() {
      this.isLoading = true

      // patch only file
      const data = {
        file: this.customerUpload.file
      }
      await this.service.update(this.pk, data)

      // read head
      const headData = await this.service.readHead(this.pk)

      // check header changes
      if (!headData.headers.equals(this.uploadHeaders)) {
        this.uploadHeadersChanged = true
      }

      this.uploadHeaders = headData.headers
      this.customerUpload.mapping = headData.mapping

      this.uploadResult = null
      this.isUploadAgain = false
      this.isLoading = false
    },
    async doUploadCustomers() {
      if (process.env.NODE_ENV === 'test') {
        this.isLoading = true
        this.uploadResult = await this.service.doUpload(this.pk)
        this.handlePreviewData()
        this.uploadDone = true
        this.isLoading = false
      } else {
        if (confirm(this.$trans("Are you sure you want to upload these customers?"))) {
          try {
            this.isLoading = true
            this.uploadResult = await this.service.doUpload(this.pk)
            this.handlePreviewData()
            this.uploadDone = true
            this.isLoading = false
            this.infoToast(this.$trans("Upload complete"), this.$trans("New customers uploaded"))
          } catch (e) {
            this.isLoading = false
            this.errorToast(this.$trans('Error uploading customers'))
            console.log(`Error uploading customers: ${e}`)
          }
        }
      }
    },
    selectColumn(key, column) {
      const val = {}
      val[key] = column
      this.customerUpload.mapping = {
        ...this.customerUpload.mapping,
        ...val
      }
    },
    getExtension(filename) {
      const parts = filename.split('.')
      return parts[parts.length-1].toLowerCase()
    },
    fileSelected(file) {
      const reader = new FileReader()

      reader.onload = (f) => {
        const b64 = f.target.result
        this.current_file = file.name
        this.customerUpload.file = b64
      }

      reader.readAsDataURL(file)
    },
    async submitUpdatePreview() {
      this.isLoading = true
      this.uploadDone = false
      delete this.customerUpload.file
      await this.service.update(this.pk, this.customerUpload)
      this.uploadResult = await this.service.previewUpload(this.pk)
      this.handlePreviewData()

      this.isLoading = false
    },
    async submitForm() {
      try {
        const created = await this.service.insert(this.customerUpload)
        await this.$router.push({name: 'customer-upload-edit', params: {pk: created.id}})
      } catch (e) {
        this.errorToast(this.$trans('Error uploading file'))
        console.log(`Error uploading file: ${e}`)
      }
    },
    handlePreviewData() {
      // transform existing
      this.existingData = []

      /*
      {
            'num_update': num_update,
            'num_insert': num_insert,
            'updates': {
              {name}: {
                        'upload_rec': rec,
                        'num_entries': len(entries),
                        'entries': serializers.CustomerSerializer(data=entries, many=True).data,
                        'seen': 1
                      }
            }
            'errors': [
              {
                'upload_rec': rec,
                'error_fields': []
              }
            ]
        }
       */

      for (const name of Object.keys(this.uploadResult.updates)) {
        let row = {
          upload_row: [],
          database_rows: []
        }

        for (const field of this.uploadHeaders) {
          row.upload_row.push(this.uploadResult.updates[name].upload_rec[field])
        }

        for (const customerData of this.uploadResult.updates[name].entries) {
          let db_row = []
          for (const field of this.uploadHeaders) {
            db_row.push(customerData[this.customerUpload.mapping[field]])
          }
          row.database_rows.push(db_row)
        }

        this.existingData.push(row)
      }

      this.errors = []
      for (const row of this.uploadResult.errors) {
        this.errors.push({
          upload_rec: row.upload_rec,
          error_fields: row.error_fields,
        })
      }

      this.insertErrors = []
      for (const row of this.uploadResult.insert_errors) {
          this.insertErrors.push({
            upload_rec: row.upload_rec,
            error: row.error,
          })
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  },
}
</script>

<style scoped>
.missing {
  font-size: 16px;
  font-weight: bold;
  padding-bottom: 6px;
  color: red;
}
.mapping_header_upload_field {
  width: 150px;
  padding: 4px
}
.mapping_header_db_field {
  width: 500px;
  padding: 4px
}
.mapping_header_filter_field {
  width: 100px;
  padding: 4px
}
.mapping_td {
  padding: 4px
}
.previewBlock {
  padding: 6px;
  margin-bottom: 10px;
}
.preview-table, .preview-row, .preview-cell {
  border: black solid;
}
.preview-cell {
  font-size: 10px;
  width: 120px;
  padding: 4px;
}
.preview-table {
  margin-bottom: 16px;
}
h3.headers-changed {
  font-style: italic;
  color: white;
  padding: 6px;
}
</style>
