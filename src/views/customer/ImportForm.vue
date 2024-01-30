<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form v-if="isCreate || isImportAgain">
        <h2>{{ $trans('Import customer data') }}</h2>
        <p><i>{{ $trans("Accepted file formats") }}: <b>{{ allowed_extensions.join(', ') }}</b></i></p>
        <b-row>
          <b-col cols="8" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('File')"
              label-for="customer-import-file"
            >
              <b-form-file
                id="customer-import-file"
                v-model="file"
                v-bind:placeholder="$trans('Choose a file or drop it here...')"
                @input="fileSelected"
              ></b-form-file>
              {{ current_file }}
            </b-form-group>
          </b-col>
        </b-row>
        <div class="mx-auto">
          <footer class="modal-footer" v-if="!isImportAgain">
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
          <footer class="modal-footer" v-if="isImportAgain">
            <b-button @click="cancelImportAgain" type="button" variant="secondary">
              {{ $trans('Cancel') }}</b-button>
            <b-button
              @click="submitImportAgain"
              type="button"
              variant="primary"
              :disabled="isSubmitDisabled"
            >
              {{ $trans('Submit') }}
            </b-button>
          </footer>
        </div>
      </b-form>
      <div v-if="!isCreate && !isLoading && !isImportAgain">
        <h2>{{ $trans('Modify import data') }}</h2>
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
        <div v-if="importHeadersChanged">
          <h3 class="headers-changed bg-warning">{{ $trans("Headers in file changed") }}</h3>
        </div>
        <table>
          <tr>
            <th class="mapping_header_import_field">{{ $trans('Import field') }}</th>
            <th class="mapping_header_db_field">{{ $trans('Database field') }}</th>
            <th class="mapping_header_filter_field">{{ $trans('Use in filter?') }}</th>
          </tr>
          <tr v-for="head in importHeaders" :key="head">
            <td class="mapping_td">{{ head }}</td>
            <td class="mapping_td">
              <multiselect
                :searchable="false"
                :options="availableColumns"
                :value="customerImport.mapping[head]"
                :show-labels="false"
                @select="function(option) { selectColumn(head, option) }"
              />
            </td>
            <td class="mapping_td" style="text-align: center">
              <b-form-checkbox
                :value="head"
                v-model="customerImport.filter_on"
              >
              </b-form-checkbox>
            </td>
          </tr>
        </table>
        <div class="mx-auto">
          <footer class="modal-footer">
            <b-button
              @click="clickImportAgainButton"
              type="button"
              variant="primary"
            >
              {{ $trans('Import file again') }}</b-button>
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
        <div v-if="importResult">
          <div v-if="importResult.num_existing">
            <h3>{{ $trans("Existing customers")}}</h3>

            <table
              :id="`preview-table-${index}`"
              v-for="(existingItem, index) of existingData" :key="`table-${index}`"
              class="preview-table"
            >
              <tr>
                <th class="preview-cell">&nbsp;&nbsp;</th>
                <th class="preview-cell" v-for="(head, index) in importHeaders" :key="`head-${index}`">
                  {{ head }}
                </th>
              </tr>
              <tr class="preview-row import-row">
                <td class="preview-cell">{{ $trans("Import") }}</td>
                <td class="preview-cell" v-for="(col, index2) of existingItem.import_row" :key="`${col}-${index}-${index2}`">
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
                <th class="preview-cell" v-for="(head, index) in importHeaders" :key="`head-${index}`">
                  {{ head }}
                </th>
              </tr>
              <tr class="preview-row" v-for="(missing, index) of errors" :key="`missing-${index}`">
                <td
                  v-for="(field, index2) of importHeaders"
                  :key="`td-${index}-${index2}`"
                  :class="`${missing.error_fields.indexOf(field) !== -1 ? 'bg-danger' : ''}`"
                  class="preview-cell"
                >
                  {{ missing.import_rec[field] }}
                </td>
              </tr>
            </table>
          </div>
          <div v-if="insertErrors.length && importDone">
            <h3>{{ $trans("Errors")}}</h3>
            <table class="preview-table">
              <tr class="preview-row">
                <th class="preview-cell" v-for="(head, index) in importHeaders" :key="`head-${index}`">
                  {{ head }}
                </th>
              </tr>
              <tr class="preview-row" v-for="(error, index) of insertErrors" :key="`error-${index}`">
                <td :colspan="importHeaders.length">
                  <table>
                    <tr class="preview-row">
                      <td
                        v-for="(field, index2) of importHeaders"
                        :key="`td-${index}-${index2}`"
                        class="preview-cell"
                      >
                        {{ error.import_rec[field] }}
                      </td>
                    </tr>
                    <tr>
                      <td :colspan="importHeaders.length">{{ error.error }}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </div>
          <div class="bg-success previewBlock rounded">
            {{ $trans("New customers") }}: <b>{{ importResult.num_insert }}</b>
          </div>
          <div class="bg-warning previewBlock rounded">
            {{ $trans("Existing customers") }}: <b>{{ importResult.num_existing }}</b>
          </div>

          <footer class="modal-footer" v-if="!importDone">
            <b-button
              @click="doImportCustomers"
              type="button"
              variant="primary"
            >
              {{ $trans('Looks good! Import customers') }}</b-button>
          </footer>
          <footer class="modal-footer" v-if="importDone">
            <b-button @click="navImportList" type="button" variant="secondary">
              {{ $trans('Import list') }}</b-button>
            <b-button
              @click="deleteImport"
              type="button"
              variant="primary"
            >
              {{ $trans('Delete this import and load customers') }}</b-button>
          </footer>
        </div>
      </div>
    </div>
  </b-overlay>
</template>

<script>
import Multiselect from "vue-multiselect";

import {CustomerImport, CustomerImportService} from '@/models/customer/Import'
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
      return this.customerImport.file === null && this.allowed_extensions.indexOf(extension) === -1
    },
    availableColumns() {
      // return this.columns;
      const columns = this.columns.filter((field) =>
        Object.values(this.customerImport.mapping).indexOf(field) === -1
      )
      if (columns.length) {
        columns.unshift('-')
      }
      return columns
    },
    missing() {
      if (!this.customerImport.mapping) {
        return []
      }

      const chosenFields = Object.values(this.customerImport.mapping)
      return this.required.filter((field) => chosenFields.indexOf(field) === -1)
    },
    isUpdatePreviewDataDisabled() {
      if (process.env.NODE_ENV === 'test') {
        return false
      }

      return this.customerImport.filter_on.length < 3 || this.missing.length > 0 || this.importResult !== null
    },
  },
  data() {
    return {
      file: null,
      current_file: null,
      base64data: null,
      service: new CustomerImportService(),
      customerImport: new CustomerImport({}),
      columns: [],
      importResult: null,
      required: [],
      existingData: [],
      errors: [],
      isImportAgain: false,
      isLoading: false,
      importHeaders: [],
      importHeadersChanged: false,
      importDone: false,
      insertErrors: [],
      allowed_extensions: []
    }
  },
  async created() {

    if (this.isCreate) {
      this.isLoading = true
      this.allowed_extensions = await this.service.fetchAllowedExtensions()
      this.customerImport = new CustomerImport({})
      this.isLoading = false
    } else {
      this.isLoading = true
      this.required = await this.service.fetchRequired()

      // load
      this.customerImport = await this.service.detail(this.pk)
      const headData = await this.service.readHead(this.pk)

      // headers so we can keep that order
      this.importHeaders = headData.headers;

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
      this.customerImport.mapping = headData.mapping

      this.isLoading = false
    }
  },
  methods: {
    async navImportList() {
      await this.$router.push({name: 'customer-import-list'})
    },
    async deleteImport() {
      await this.service.delete(this.pk)
      await this.$router.push({name: 'customer-list'})
    },
    clickImportAgainButton() {
      this.isImportAgain = true
    },
    cancelImportAgain() {
      this.isImportAgain = false
    },
    async submitImportAgain() {
      this.isLoading = true

      // patch only file
      const data = {
        file: this.customerImport.file
      }
      await this.service.update(this.pk, data)

      // read head
      const headData = await this.service.readHead(this.pk)

      // check header changes
      if (!headData.headers.equals(this.importHeaders)) {
        this.importHeadersChanged = true
      }

      this.importHeaders = headData.headers
      this.customerImport.mapping = headData.mapping

      this.importResult = null
      this.isImportAgain = false
      this.isLoading = false
    },
    async doImportCustomers() {
      if (process.env.NODE_ENV === 'test') {
        this.isLoading = true
        this.importResult = await this.service.doImport(this.pk)
        this.handlePreviewData()
        this.importDone = true
        this.isLoading = false
      } else {
        if (confirm(this.$trans("Are you sure you want to import these customers?"))) {
          try {
            this.isLoading = true
            this.importResult = await this.service.doImport(this.pk)
            this.handlePreviewData()
            this.importDone = true
            this.isLoading = false
            this.infoToast(this.$trans("Import complete"), this.$trans("New customers imported"))
          } catch (e) {
            this.isLoading = false
            this.errorToast(this.$trans('Error importing customers'))
            console.log(`Error importing customers: ${e}`)
          }
        }
      }
    },
    selectColumn(key, column) {
      const val = {}
      val[key] = column
      this.customerImport.mapping = {
        ...this.customerImport.mapping,
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
        this.customerImport.file = b64
      }

      reader.readAsDataURL(file)
    },
    async submitUpdatePreview() {
      this.isLoading = true
      this.importDone = false
      delete this.customerImport.file
      await this.service.update(this.pk, this.customerImport)
      this.importResult = await this.service.previewImport(this.pk)
      this.handlePreviewData()

      this.isLoading = false
    },
    async submitForm() {
      try {
        const created = await this.service.insert(this.customerImport)
        await this.$router.push({name: 'customer-import-edit', params: {pk: created.id}})
      } catch (e) {
        this.errorToast(this.$trans('Error importing file'))
        console.log(`Error importing file: ${e}`)
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
                        'import_rec': rec,
                        'num_entries': len(entries),
                        'entries': serializers.CustomerSerializer(data=entries, many=True).data,
                        'seen': 1
                      }
            }
            'errors': [
              {
                'import_rec': rec,
                'error_fields': []
              }
            ]
        }
       */

      for (const name of Object.keys(this.importResult.updates)) {
        let row = {
          import_row: [],
          database_rows: []
        }

        for (const field of this.importHeaders) {
          row.import_row.push(this.importResult.updates[name].import_rec[field])
        }

        for (const customerData of this.importResult.updates[name].entries) {
          let db_row = []
          for (const field of this.importHeaders) {
            db_row.push(customerData[this.customerImport.mapping[field]])
          }
          row.database_rows.push(db_row)
        }

        this.existingData.push(row)
      }

      this.errors = []
      for (const row of this.importResult.errors) {
        this.errors.push({
          import_rec: row.import_rec,
          error_fields: row.error_fields,
        })
      }

      this.insertErrors = []
      for (const row of this.importResult.insert_errors) {
          this.insertErrors.push({
            import_rec: row.import_rec,
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
.mapping_header_import_field {
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
